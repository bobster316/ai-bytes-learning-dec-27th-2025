import { CourseState, STRUCTURE_PATTERNS } from './course-state';

// ------------------------------------------------------------------
// TF-IDF & Cosine Similarity Implementation
// ------------------------------------------------------------------

function tokenize(text: string): string[] {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2); // basic stopword skip
}

function calculateTF(tokens: string[]): Record<string, number> {
    const tf: Record<string, number> = {};
    const total = tokens.length;
    if (total === 0) return tf;
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    for (const key in tf) { tf[key] = tf[key] / total; }
    return tf;
}

function calculateIDF(documents: string[][]): Record<string, number> {
    const idf: Record<string, number> = {};
    const docCount = documents.length;
    if (docCount === 0) return idf;

    const documentSets = documents.map(doc => new Set(doc));
    
    documentSets.forEach(set => {
        set.forEach(token => {
            idf[token] = (idf[token] || 0) + 1;
        });
    });

    for (const key in idf) {
        idf[key] = Math.log(docCount / idf[key]);
    }
    return idf;
}

function cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    allKeys.forEach(key => {
        const valA = vecA[key] || 0;
        const valB = vecB[key] || 0;
        dotProduct += valA * valB;
        normA += valA * valA;
        normB += valB * valB;
    });

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getNarrationSimilarity(currentNarration: string, history: string[]): number {
    if (history.length === 0) return 0;
    
    // Convert history into arrays of tokens
    const historyTokens = history.map(tokenize);
    const currentTokens = tokenize(currentNarration);
    
    // We treat the corpus as [current, ...history] to compute IDF
    const corpus = [currentTokens, ...historyTokens];
    const idf = calculateIDF(corpus);

    // Compute TF for current
    const currentTF = calculateTF(currentTokens);
    const currentTFIDF: Record<string, number> = {};
    for (const key in currentTF) { currentTFIDF[key] = currentTF[key] * (idf[key] || 0); }

    let maxSimilarity = 0;

    // Compare against each historical document
    for (const hTokens of historyTokens) {
        const hTF = calculateTF(hTokens);
        const hTFIDF: Record<string, number> = {};
        for (const key in hTF) { hTFIDF[key] = hTF[key] * (idf[key] || 0); }
        
        const sim = cosineSimilarity(currentTFIDF, hTFIDF);
        if (sim > maxSimilarity) maxSimilarity = sim;
    }

    return maxSimilarity;
}

function jaccardSimilarity(queryA: string, queryB: string): number {
    const setA = new Set(tokenize(queryA));
    const setB = new Set(tokenize(queryB));
    if (setA.size === 0 && setB.size === 0) return 0;
    
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
}

// ------------------------------------------------------------------
// Main Validator
// ------------------------------------------------------------------

export interface ValidationResult {
    passed: boolean;
    failures: string[];
    score: number; // 0 to 1, higher is better
}

export class CourseValidator {
    
    static validateUniqueness(lessonData: any, courseState: CourseState): ValidationResult {
        const failures: string[] = [];
        let score = 1.0;

        if (!lessonData || !lessonData.scenes || !Array.isArray(lessonData.scenes)) {
            return { passed: false, failures: ["CRITICAL: Invalid JSON structure or missing scenes array."], score: 0 };
        }

        const blocks: any[] = lessonData.scenes; // The mapper passes result.blocks as scenes

        // 1. Analogy Domain Repetition
        const domain = lessonData.analogy_domain;
        if (domain) {
            const lastDomain = courseState.domain_history.length > 0 ? courseState.domain_history[courseState.domain_history.length - 1] : null;
            if (domain === lastDomain) {
                failures.push(`DOMAIN REPEAT: You used the ${domain} domain again. You MUST NOT repeat the immediately preceding domain.`);
                score -= 0.3;
            }
            
            let count = courseState.domain_history.filter(d => d === domain).length;
            if (count >= 2) {
                failures.push(`DOMAIN OVERUSE: The ${domain} domain has been used ${count} times already. Max 2 per course.`);
                score -= 0.3;
            }
        }

        // 2. Visual Type Diversity (3 of 6 rule)
        const visualBlockTypes = new Set(['full_image', 'image_text_row', 'video_snippet', 'concept_illustration', 'flow_diagram', 'type_cards', 'interactive_vis', 'mindmap']);
        const usedTypes = new Set(blocks.filter(b => visualBlockTypes.has(b.type)).map(b => b.type));
        if (usedTypes.size < 3) {
            failures.push(`VISUAL MONOTONY: You only used ${usedTypes.size} unique visual block types (${Array.from(usedTypes).join(', ')}). You MUST use AT LEAST 3 distinct visual block types!`);
            score -= 0.2;
        }

        // 3. Search Query Similarity
        let queryViolation = false;
        const allQueries = blocks.map(b => b.imagePrompt || b.videoPrompt || b.video_search_query).filter(Boolean);
        for (const query of allQueries) {
            for (const oldQuery of courseState.used_search_queries) {
                if (jaccardSimilarity(query, oldQuery) >= 0.4) {
                    failures.push(`SEARCH QUERY SIMILARITY: Your visual prompt "${query}" is too similar to a previously used query "${oldQuery}". Change the concrete objects being searched.`);
                    queryViolation = true;
                    score -= 0.1;
                    break;
                }
            }
            if (queryViolation) break;
        }

        // 4. Narration Similarity (TF-IDF Cosine)
        // Extract all major text content
        const fullNarrationChunks = blocks.filter(b => b.type === 'text' || b.type === 'punch_quote' || b.type === 'instructor_insight').map(b => {
             if (b.type === 'text') return b.text;
             if (b.type === 'punch_quote') return b.quote;
             if (b.type === 'instructor_insight' && b.insights) return b.insights.map((i: any) => i.body).join(' ');
             return '';
        }).filter(Boolean);
        const fullNarration = fullNarrationChunks.join(' ');
        
        if (fullNarration.length > 0) {
            const simScore = getNarrationSimilarity(fullNarration, courseState.narration_history);
            if (simScore >= 0.35) {
                failures.push(`NARRATION SIMILARITY: Your text content is too semantically similar to a previous lesson (Score: ${Math.round(simScore*100)}%). Rewrite to use completely different phrasing.`);
                score -= 0.25;
            }
        }

        // 5. Opening Line Uniqueness
        const firstTextBlock = blocks.find(b => b.type === 'text' || b.type === 'punch_quote');
        const openingText = firstTextBlock?.text || firstTextBlock?.quote;
        if (openingText) {
            const firstSentence = openingText.split(/[.?!]/)[0].trim().toLowerCase();
            const genericStarters = ["in this lesson", "today we are", "welcome to", "let's dive into", "we will explore"];
            if (genericStarters.some(g => firstSentence.startsWith(g))) {
                failures.push(`GENERIC OPENING: Your opening text "${firstSentence}..." uses a banned generic starter. Start strong and directly inside the analogy.`);
                score -= 0.1;
            }
            for (const oldLine of courseState.used_opening_lines) {
                const oldSentence = oldLine.split(/[.?!]/)[0].trim().toLowerCase();
                if (firstSentence === oldSentence) {
                    failures.push(`OPENING REPEAT: You reused the opening sentence "${firstSentence}". This must be unique.`);
                    score -= 0.2;
                    break;
                }
            }
        }

        // 6. Structure Compliance
        const assignedPatternName = lessonData.structure_pattern;
        const assignedPattern = STRUCTURE_PATTERNS.find(sp => sp.name === assignedPatternName);
        if (assignedPattern) {
            const finalTextBlock = [...blocks].reverse().find(b => b.type === 'text' || b.type === 'recap');
            const closeText = finalTextBlock?.text || (finalTextBlock?.points ? finalTextBlock.points.join(' ') : '');
            if (closeText.length < 20) {
                 failures.push(`STRUCTURE NON-COMPLIANCE: The final block is too short to fulfill the required closing structure for '${assignedPatternName}'.`);
                 score -= 0.1;
            }
        }

        // 7. Video Scene Present (Allow 1 or 2)
        const videoBlocks = blocks.filter(b => b.type === 'video_snippet');
        if (videoBlocks.length < 1 || videoBlocks.length > 2) {
            failures.push(`VIDEO SCENE COUNT: Exactly 1 or 2 blocks must be of type 'video_snippet'. You generated ${videoBlocks.length}.`);
            score -= 0.3;
        }

        // 8. Video Query Cleanliness
        const videoScene = videoBlocks[0];
        if (videoScene) {
            const bannedTerms = ["technology", "digital", "tech", "cyber", "virtual", "futuristic", "innovation"];
            const vQuery = (videoScene.video_search_query || videoScene.videoPrompt || "").toLowerCase();
            
            let bannedTermUsed = bannedTerms.find(term => vQuery.includes(term));
            if (bannedTermUsed) {
                failures.push(`VIDEO QUERY POLLUTION: Your video_search_query or videoPrompt "${vQuery}" contains the banned abstract term "${bannedTermUsed}". Write ONLY physical actions a camera can film.`);
                score -= 0.2;
            }

            // 9. Video Query Uniqueness
            for (const oldVQuery of courseState.video_queries_used) {
                if (jaccardSimilarity(vQuery, oldVQuery) >= 0.4) {
                    failures.push(`VIDEO QUERY REPEAT: Your video query "${vQuery}" is too structurally similar to previous query "${oldVQuery}". Try a totally different motion verb and subject.`);
                    score -= 0.15;
                    break;
                }
            }
        }

        score = Math.max(0, score);

        return {
            passed: failures.length === 0,
            failures,
            score
        };
    }
}
