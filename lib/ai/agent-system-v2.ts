import {
    CourseGenerationInput,
    CourseStructure,
    TopicPlan,
    LessonPlan,
    ConceptExplanation,
    AssessmentSuite,
    CompleteCourse
} from '../types/course-upgrade';
import type { CourseDNA } from '../types/course-upgrade';
import { CATEGORY_LABELS_FOR_PROMPT } from '../constants/categories';
import { CourseState, CourseStateManager, ALL_DOMAINS, STRUCTURE_PATTERNS } from './course-state';
import { BANNED_WORDS_INSTRUCTION } from './content-sanitizer';
import { CourseValidator } from './validator';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function sanitizeJson(text: string): string {
    let json = text;
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        json = text.substring(firstBrace, lastBrace + 1);
    }
    json = json.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    let sanitized = "";
    let inString = false;
    for (let i = 0; i < json.length; i++) {
        const char = json[i];
        if (char === '"' && (i === 0 || json[i - 1] !== '\\')) {
            inString = !inString;
            sanitized += char;
        } else if (inString) {
            if (char === '\n') sanitized += '\\n';
            else if (char === '\r') sanitized += '\\r';
            else if (char === '\t') sanitized += '\\t';
            else if (char === '\\' && (i + 1 < json.length && !(/["\\\/bfnrtu]/.test(json[i + 1])))) {
                sanitized += '\\\\';
            } else sanitized += char;
        } else {
            sanitized += char;
        }
    }
    sanitized = sanitized.replace(/,\s*([\]\}])/g, "$1");
    sanitized = sanitized.replace(/\}\s*\{/g, "},{");
    sanitized = sanitized.replace(/\]\s*\[/g, "],[");
    sanitized = sanitized.replace(/"\s*"/g, '", "');
    return sanitized;
}

abstract class BaseAgentV2 {
    protected async makeRequest(prompt: string | any[], isJson: boolean = true, allowRepair: boolean = true) {
        const contents = Array.isArray(prompt) ? prompt : [{ role: 'user', parts: [{ text: prompt }] }];
        if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");

        const MAX_RETRIES = 3;
        const TIMEOUT_MS = 120000; // Increased to 120s for 1000w prompts

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            try {
                const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents,
                        generationConfig: {
                            temperature: 0.7,
                            responseMimeType: isJson ? "application/json" : "text/plain",
                        }
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.status === 429 || response.status === 503) {
                    const delay = attempt * 2000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                if (!response.ok) {
                    if (response.status >= 500) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                    throw new Error(`${this.constructor.name} API Error ${response.status}`);
                }

                const data = await response.json();
                let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("Empty response from Gemini API");

                if (isJson) {
                    try {
                        return JSON.parse(text);
                    } catch (initialErr) {
                        try {
                            const sanitized = sanitizeJson(text);
                            return JSON.parse(sanitized);
                        } catch (midErr) {
                            try {
                                const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                                if (match) return JSON.parse(match[0]);
                                throw midErr;
                            } catch (finalErr: any) {
                                if (allowRepair) {
                                    return await this.repairJson(text, finalErr.message);
                                }
                                throw new Error(`Parse Error: ${finalErr.message}`);
                            }
                        }
                    }
                }
                return text;
            } catch (e: any) {
                clearTimeout(timeoutId);
                if (e.name === 'AbortError') {
                    if (attempt < MAX_RETRIES) continue;
                    throw new Error(`${this.constructor.name}: Request timed out.`);
                }
                if (e.message.includes("API Key")) throw e; // auth failure — never retry
                // "valid JSON" / empty responses are transient — fall through to retry
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    continue;
                }
                throw e;
            }
        }
    }

    private async repairJson(invalidJson: string, errorMessage: string): Promise<any> {
        const repairPrompt = `SYSTEM: You are a JSON Syntax Repair Engine.
        ERROR: ${errorMessage}
        TASK: Fix the JSON syntax errors in the provided text. Do NOT change values.
        INVALID JSON: ${invalidJson.slice(0, 50000)}...
        RETURN ONLY THE VALID JSON OBJECT.`;
        return await this.makeRequest(repairPrompt, true, false);
    }
}

// 1. Manifest Planner Agent (Manifest First - V2)
export class ManifestPlannerAgent extends BaseAgentV2 {
    async generateManifest(input: CourseGenerationInput): Promise<CourseStructure> {
        const topicCount = input.topicCount || 2;
        const lessonsPerTopic = input.lessonsPerTopic || 2;

        const prompt = `SYSTEM: You are an instructional designer and curriculum architect.
GOAL: Produce a CourseManifest JSON that enumerates every required Topic and lesson with stable IDs.
CONSTRAINTS:
- Output must validate against the provided JSON structure. Do not omit required keys.
- Write a compelling, cinematic 45-60 second "Intro Video Script" that the AI Avatar will speak to introduce the course.
- Do NOT write lesson prose (except for the course intro script). Only titles, objective IDs, prerequisites, and estimates for lessons.
- Ensure constructive alignment: every lesson objective must map to a specific ID.

INPUT:
Course: "${input.courseName}"
Difficulty: ${input.difficultyLevel}
Target Duration: ${input.targetDuration} mins
Total Topics: ${topicCount}
Lessons Per Topic: ${lessonsPerTopic}

OUTPUT JSON FORMAT:
{
  "refinedCourseTitle": "string",
  "courseMetadata": {
    "category": "Must be EXACTLY one of: ${CATEGORY_LABELS_FOR_PROMPT}",
    "description": "A best-in-class world-leading micro e-learning course description (2-3 paragraphs) that uses high-conversion marketing psychology and clearly defines the 'Antigravity' value proposition.",
    "estimatedComplexity": number,
    "recommendedPrerequisites": ["string"],
    "learningObjectives": ["string"],
    "practicalOutcomes": ["string"],
    "thumbnailPrompt": "string"
  },
  "introVideoScript": {
    "hook": { "duration": 10, "script": "string", "visualCues": ["string"] },
    "context": { "duration": 10, "script": "string", "visualCues": ["string"] },
    "coreContent": {
      "duration": 20,
      "segments": [
        { "title": "string", "duration": 10, "script": "string", "visualCues": ["string"] }
      ]
    },
    "recap": { "duration": 5, "script": "string", "keyPoints": ["string"] },
    "totalDuration": 45
  },
  "topics": [
    {
      "id": "mod_001",
      "topicName": "string",
      "topicOrder": number,
      "description": "string",
      "learningOutcomes": ["string"],
      "estimatedDuration": 30,
      "topicType": "core",
      "visualAids": [],
      "lessons": [
        {
          "id": "les_001",
          "lessonTitle": "string",
          "lessonOrder": number,
          "microObjective": "string",
          "learningObjectives": ["string"],
          "keyConceptsToCover": ["string"],
          "prerequisites": ["string"],
          "estimatedDifficulty": 2,
          "estimatedDuration": 15
        }
      ]
    }
  ]
}`;
        return await this.makeRequest(prompt) as CourseStructure;
    }
}

// ─── Pool-based block selection system ──────────────────────────────────────
// Every lesson gets a deterministic but UNIQUE combination of flexible middle
// blocks, driven by its narrative structure and topic type. This ensures no two
// lessons share the same visual skeleton.

const BLOCK_POOLS: Record<string, { blocks: string[], description: string }> = {
    'The Hook': {
        description: 'Opens with surprise → builds evidence → returns to the hook with new insight',
        blocks: ['type_cards:grid', 'prediction', 'image_text_row', 'text:bridge', 'full_image', 'flow_diagram:contrast', 'applied_case', 'image_text_row:reverse']
    },
    'The Journey': {
        description: 'Opens with a problem → unfolds as a story → arrives at the destination',
        blocks: ['image_text_row', 'text:bridge', 'full_image', 'flow_diagram:steps', 'applied_case', 'image_text_row:reverse', 'type_cards:numbered', 'go_deeper']
    },
    'The Contrast': {
        description: 'Shows the wrong way → introduces the corrective lens → clear before/after',
        blocks: ['image_text_row', 'flow_diagram:contrast', 'callout:warning', 'full_image', 'type_cards:horizontal', 'prediction', 'applied_case', 'image_text_row:reverse']
    },
    'The Build': {
        description: 'Simplest element first → layer by layer → reveals the complete system',
        blocks: ['image_text_row', 'type_cards:numbered', 'full_image', 'flow_diagram:steps', 'concept_illustration', 'interactive_vis', 'text:bridge', 'applied_case']
    },
    'The Zoom': {
        description: 'Wide-angle view → zooms into one critical detail → zooms back out enriched',
        blocks: ['full_image', 'mindmap', 'concept_illustration', 'image_text_row', 'go_deeper', 'industry_tabs', 'image_text_row:reverse']
    },
    'The Dialogue': {
        description: 'Poses a question → answers through conversation → closes with a one-liner',
        blocks: ['prediction', 'image_text_row', 'type_cards:grid', 'full_image', 'text:bridge', 'applied_case', 'image_text_row:reverse']
    },
    'The Reveal': {
        description: 'Familiar & mundane → gradually reveals hidden complexity → I-never-knew-that moment',
        blocks: ['image_text_row', 'type_cards:bento', 'full_image', 'callout:warning', 'applied_case', 'concept_illustration', 'image_text_row:reverse']
    },
    'The Challenge': {
        description: 'Presents a decision point → explores trade-offs → closes with a usable principle',
        blocks: ['image_text_row', 'prediction', 'full_image', 'flow_diagram:contrast', 'applied_case', 'industry_tabs', 'image_text_row:reverse']
    },
};

function getBlueprintForLesson(
    structureName: string,
    lessonNumber: number,
    difficulty: string,
    courseState: CourseState | null
): { chosenBlocks: string[]; heroType: 'video_snippet' | 'full_image'; recapStyle: string; quizFirst: boolean; videoIndices: number[]; heroPattern: string[] } {
    const pool = BLOCK_POOLS[structureName] || BLOCK_POOLS['The Hook'];
    const structureData = STRUCTURE_PATTERNS.find(s => s.name === structureName) || STRUCTURE_PATTERNS[0];
    const videoIndices = structureData.videoScene || [1, 14];

    const seed = lessonNumber + structureName.length;
    const offset = seed % pool.blocks.length;
    const rotated = [...pool.blocks.slice(offset), ...pool.blocks.slice(0, offset)];
    const pickCount = difficulty === 'Beginner' ? 7 : difficulty === 'Advanced' ? 9 : 8;

    const filtered = difficulty === 'Beginner'
        ? rotated.filter(b => b !== 'go_deeper' && b !== 'interactive_vis')
        : rotated;

    const chosenBlocks = filtered.slice(0, pickCount);
    const heroType: 'video_snippet' | 'full_image' = (seed % 2 === 0) ? 'video_snippet' : 'full_image'; 
    const recapStyles = ['card', 'minimal', 'striped'];
    const recapStyle = recapStyles[(lessonNumber - 1) % 3];
    const quizFirst = lessonNumber % 3 === 0;

    // Define HERO PATTERNS for top-section variation
    const patterns = [
        ['lesson_header', 'punch_quote', 'objective'], // Classic
        ['lesson_header', 'objective', 'punch_quote'], // Objective-First
        ['punch_quote', 'lesson_header', 'objective'], // Quote-First
        ['lesson_header', 'video_snippet', 'objective'] // Action-First
    ];
    const heroPattern = patterns[seed % patterns.length];

    return { chosenBlocks, heroType, recapStyle, quizFirst, videoIndices, heroPattern };
}

// ─── Block schema documentation per block type ──────────────────────────────
function getBlockSchemaDoc(blockRef: string): string {
    const [type, variant] = blockRef.split(':');
    const schemas: Record<string, string> = {
        'type_cards:grid':       'type_cards grid — 3–4 cards for factual orientation. layout: "grid". Each card: badge, badgeColour (pulse|iris|amber), title, description (1–2 sentences), imagePrompt (MINIMUM 1000 WORDS of ultra-detailed description).',
        'type_cards:numbered':   'type_cards numbered — 3–4 cards breaking topic into parts. layout: "numbered". Each card: badge, badgeColour, title, description.',
        'type_cards:horizontal': 'type_cards horizontal — COMPARISON of 2 things. layout: "horizontal". 2–3 cards only.',
        'type_cards:bento':      'type_cards bento — freeform supplemental cards. layout: "bento". 3–4 cards, each with badge, title, description, imagePrompt (MINIMUM 1000 WORDS).',
        'instructor_insight':    'instructor_insight — EXACTLY 3 insight cards. Each: emoji, bold title, body (1–2 sentences).',
        'flow_diagram:steps':    'flow_diagram steps — linear process (3–6 steps). title, steps[]{label, description, colour}.',
        'flow_diagram:contrast': 'flow_diagram contrast — before/after. title, contrast{ labelA, labelB, stepsA[], stepsB[], middleNode, outcomeA, outcomeB }.',
        'mindmap':               'mindmap — central node + 4–6 branch concepts.',
        'concept_illustration':  'concept_illustration — visual metaphor. concept, description, imagePrompt (MINIMUM 1000 WORDS), style: network|layers|cycle|hierarchy.',
        'image_text_row':        'image_text_row — image left, text right. imagePrompt (MINIMUM 1000 WORDS), label, title, text (2–3 sentences), reverse: false.',
        'image_text_row:reverse':'image_text_row reversed — text left, image right. reverse: true. imagePrompt (MINIMUM 1000 WORDS), label, title, text.',
        'prediction':            'prediction — knowledge check. question, options (EXACTLY 3), correctIndex, reveal.',
        'applied_case':          'applied_case — real-world scenario. scenario, challenge, resolution.',
        'industry_tabs':         'industry_tabs — 4–5 industry use-case tabs. heading, tabs[]{ id, label, imagePrompt (MINIMUM 1000 WORDS), imageCaption, scenarioTitle, scenarioBody }.',
        'callout:warning':       'callout warning — variant: "warning", title, text.',
        'callout:tip':           'callout tip — variant: "tip", title, text.',
        'open_exercise':         'open_exercise — practice activity. instruction, weakPrompt, scaffoldLabels, modelAnswer.',
        'interactive_vis':       'interactive_vis — data visualisation. title, intro, description, codeSnippet, vizType: chart|flowchart|architecture.',
        'text:bridge':           'text (bridge/transition) — 1–3 paragraphs only. heading, paragraphs[].',
        'video_snippet':          'video_snippet — AI-generated cinematic video clip. REQUIRED: type: "video_snippet", id, title, caption, videoPrompt: EXACTLY 5 SENTENCES using the motion-arc structure — S1: name the exact lesson concept being demonstrated (must include the lesson title), S2: primary visible objects / UI / interfaces / data flows in frame, S3: motion arc — what state the scene STARTS in, what CHANGES during 8 seconds, what the final state IS, S4: camera movement and environment / lighting, S5: exclusions (no metaphors, no human faces) and fidelity target (photorealistic / cinematic). video_search_query: 3-5 words safe for Pexels stock search. duration: "8s".',
        'go_deeper':             'go_deeper — advanced accordion. triggerText, content (2–3 paragraphs).',
    };
    return schemas[blockRef] || schemas[type] || `${type} block — include all required fields.`;
}

// ─── 2. Lesson Expander Agent (Pool-Based Diversity Generator V3) ─────────────
export class LessonExpanderAgent extends BaseAgentV2 {
    async expandLesson(lesson: any, moduleContext: any, courseContext: any, retrievedChunks: any[] = [], lessonNumber: number = 1, courseState: CourseState | null = null, dnaContent: CourseDNA["content"] | null = null): Promise<ConceptExplanation> {
        const contextStr = retrievedChunks.length > 0
            ? retrievedChunks.map(c => `[Source: ${c.source_id}]\n${c.content}`).join('\n\n')
            : "No retrieved context available.";

        const difficulty = courseContext?.difficulty || lesson?.difficulty || "Intermediate";
        const isAdvanced = difficulty === "Advanced";
        const isBeginner = difficulty === "Beginner";

        let domainStr = 'Technology';
        let structureName = 'The Hook';
        let structureOpen = '';
        let structureClose = '';
        let toneName = 'Warm Mentor';
        let toneChars = '';
        let toneExample = '';
        let domainHistory = 'None';
        let bannedDomains = 'None';
        let overusedBlockTypes = 'None';
        let underusedBlockTypes = 'All';

        if (courseState) {
            const nextDomainName = CourseStateManager.getNextDomain(courseState);
            const domainObj = ALL_DOMAINS.find(d => d.name === nextDomainName) || ALL_DOMAINS[0];
            domainStr = domainObj.name;
            const structure = CourseStateManager.getStructure(lessonNumber);
            structureName = structure.name;
            structureOpen = structure.open;
            structureClose = structure.close;

            const tone = CourseStateManager.getTone(lessonNumber);
            toneName = tone.name;
            toneChars = tone.chars;
            toneExample = tone.example;

            const counts = courseState.visual_type_counts;
            const values = Object.values(counts);
            const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
            const overused = Object.keys(counts).filter(k => counts[k] > avg + 1);
            const underused = Object.keys(counts).filter(k => counts[k] < avg);
            overusedBlockTypes = overused.length > 0 ? overused.join(', ') : 'None';
            underusedBlockTypes = underused.length > 0 ? underused.join(', ') : 'All';
            domainHistory = courseState.domain_history.length > 0 ? courseState.domain_history.join(', ') : 'None';
            bannedDomains = courseState.domain_history.length > 0 ? courseState.domain_history[courseState.domain_history.length - 1] : 'None';
        }

        const blueprint = getBlueprintForLesson(structureName, lessonNumber, difficulty, courseState);
        const { chosenBlocks: initialBlocks, heroType, recapStyle, quizFirst, videoIndices, heroPattern } = blueprint;

        let finalBlocksWithVideos = [...initialBlocks];
        if (videoIndices.length > 1) {
            finalBlocksWithVideos.splice(Math.min(videoIndices[1], finalBlocksWithVideos.length), 0, 'video_snippet');
        }

        const ironBefore = heroPattern.map((type, idx) => {
            const schema = type === 'video_snippet' 
                ? `HERO VIDEO: ${getBlockSchemaDoc('video_snippet')} (REQUIRED: ALWAYS generate this first video block)`
                : getBlockSchemaDoc(type);
            return `[BLOCK-${idx + 1}] ${type}: ${schema}`;
        });
        
        const middleBlocks = finalBlocksWithVideos.map((blockRef, idx) => {
            const [type] = blockRef.split(':');
            const label = type === 'video_snippet' ? `SECONDARY VIDEO (REQUIRED: You MUST generate this second video snippet)` : `FLEX-${idx + 1}`;
            return `[BLOCK-${idx + 5}] ${label}: ${getBlockSchemaDoc(blockRef)}`;
        });

        const ironAfter = [
            `[BLOCK-${middleBlocks.length + 5}] text — FOUNDATION`,
            `[BLOCK-${middleBlocks.length + 6}] recap — style: "${recapStyle}"`,
            `[BLOCK-${middleBlocks.length + 7}] quiz — EXACTLY 3 questions`,
            `[BLOCK-${middleBlocks.length + 8}] key_terms`,
            `[BLOCK-${middleBlocks.length + 9}] completion`,
        ];

        const unifiedBlueprint = [...ironBefore, ...middleBlocks, ...ironAfter].join('\n');

        const ironCoreCount = 10;
        const totalTarget = ironCoreCount + finalBlocksWithVideos.length + (isBeginner ? 2 : isAdvanced ? 4 : 3);
        const temperature = Math.min(0.7 + (lessonNumber - 1) * 0.04, 1.0);

        const prompt = `SYSTEM: You are an elite UK instructional designer. Lesson ${lessonNumber} of this course.
LESSON: "${lesson.lessonTitle}"
OBJECTIVE: ${lesson.microObjective}
DIFFICULTY: ${difficulty}
COURSE PERSONALITY: ${dnaContent?.writing_style ?? 'Clear, expert, no filler words.'}
EXAMPLE STYLE: ${dnaContent?.example_bias ?? 'real_world_first'}
QUESTION TONE: ${dnaContent?.question_tone ?? 'socratic'}
NARRATIVE: "${structureName}"
TONE: ${toneName} (${toneChars})

LESSON BLUEPRINT — TOTAL BLOCKS: ${unifiedBlueprint.split('\n').length}
${unifiedBlueprint}

VISUAL ACCURACY — ABSOLUTE LAW:
>>> IMAGE PROMPTS (imagePrompt fields) MUST BE MINIMUM 1000 WORDS of technical blueprint following the 6-part formula below.
>>> VIDEO PROMPTS (videoPrompt fields) MUST BE EXACTLY 5 SENTENCES using the motion-arc structure: S1 names the lesson concept and lesson title, S2 describes visible objects/interfaces, S3 describes the motion arc (start state → transformation → end state), S4 describes camera movement and environment, S5 states exclusions and fidelity target.
>>> All other text (content, captions, titles) must be CONCISE (under 100 words per field) to stay within token limits.
>>> YOU MUST GENERATE TWO (2) VIDEO SNIPPETS: One at [BLOCK-4] and one at [BLOCK-X] as labeled in the blueprint.
>>> NEVER use analogies or metaphors (no kitchens, gardens, pottery, or simple "city" metaphors).
>>> USE 6-PART TECHNICAL FORMULA FOR PROMPTS:
    1. GEOMETRY: Precise shapes, wireframes, vertices, architectural layouts.
    2. PHYSICS: Refractive indices, subsurface scattering, material properties (metal, silicon).
    3. LITE & OPTICS: Specific lighting (rim, three-point), 35mm focal length.
    4. DATA VISUALISATION: Literal tensors, weight matrices, code streams, signal noise.
    5. MOTION (Video-only): Frame-by-frame camera movement (pan/tilt/zoom), temporal shifts.
    6. PEDAGOGICAL ALIGNMENT: Direct literal mapping to the lesson objective ID.
>>> BE LITERAL. BE ACCURATE. BE TECHNICAL.

${BANNED_WORDS_INSTRUCTION}

REQUIRED OUTPUT JSON STRUCTURE:
{
  "videoScript": { ... },
  "blocks": [ ... ],
  "lesson_number": ${lessonNumber},
  "analogy_domain": "${domainStr}",
  "structure_pattern": "${structureName}"
}`;

        let messages: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
        const makeRequestWithTemp = async (msgs: any[]) => {
            const contents = msgs;
            if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");
            const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: { temperature, responseMimeType: "application/json" }
                })
            });
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return JSON.parse(text);
        };

        let attempts = 0;
        while (attempts < 3) {
            try {
                const result = await makeRequestWithTemp(messages);
                if (!courseState) return result;
                const validation = CourseValidator.validateUniqueness({ ...result, lesson_number: lessonNumber, analogy_domain: result.analogy_domain || domainStr, structure_pattern: structureName, scenes: result.blocks }, courseState);
                if (validation.passed) return result;
                messages.push({ role: 'model', parts: [{ text: JSON.stringify(result) }] });
                messages.push({ role: 'user', parts: [{ text: `Rejection: ${validation.failures.join(', ')}. FIX ALL. REMEMBER: Image prompts MUST be 1000+ words. Video prompts MUST follow the 5-sentence motion-arc structure (S1 names lesson concept + title, S2 visible objects, S3 start→change→end, S4 camera, S5 exclusions).` }] });
            } catch (e) {
                console.error("Retry error", e);
            }
            attempts++;
        }
        return await makeRequestWithTemp(messages);
    }
}

export class EvaluatorAgent extends BaseAgentV2 {
    async evaluateLesson(generatedContent: ConceptExplanation, lessonPlan: any): Promise<{ passed: boolean; scores: any; failures: string[]; fixes: string[] }> {
        const blocks: any[] = (generatedContent as any).blocks || [];
        const failures: string[] = [];
        const types = blocks.map(b => b.type);
        if (!types.includes('lesson_header')) failures.push('Missing lesson_header');
        const videoCount = blocks.filter(b => b.type === 'video_snippet').length;
        if (videoCount < 1) failures.push('Missing video_snippet');
        const passed = failures.length === 0;
        return { passed, scores: { coverage: passed ? 100 : 50 }, failures, fixes: [] };
    }
}

// 6. Visual Enrichment Agent (MANDATORY 1000W BLANKET ACCURACY)
export class VisualEnrichmentAgent extends BaseAgentV2 {
    async enrichBlock(block: any, lessonTitle: string, domainStr: string): Promise<string> {
        const isVideo = block.type === 'video_snippet';

        if (isVideo) {
            const prompt = `SYSTEM: You are a Video Director for AI Bytes Learning.
GOAL: Rewrite the provided video prompt into EXACTLY 5 SENTENCES using the motion-arc structure.

CONTEXT:
LESSON: "${lessonTitle}"
DOMAIN: "${domainStr}"
BLOCK TITLE: "${block.title || block.caption || 'Technical Detail'}"

MOTION-ARC STRUCTURE (strictly 5 sentences, no more, no less):
S1: State the exact concept from the lesson "${lessonTitle}" that this video demonstrates. Name "${lessonTitle}" explicitly in this sentence.
S2: Describe the primary visible objects, interfaces, hardware, data flows, or physical setup visible in frame at the start.
S3: Describe the motion arc — what state the scene STARTS in, what visibly TRANSFORMS or MOVES during the 8-second clip, and what the final state IS at the end.
S4: Describe the camera behaviour (movement type, framing, lens, environment, and lighting mood).
S5: State exclusions (no metaphors, no human faces, no abstract domain substitutions, no kitchen/garden/nature scenes) and the fidelity target (photorealistic, cinematic, temporally stable).

RULES:
- Must reference "${lessonTitle}" by name in S1.
- S3 must describe a real temporal transformation — not just what is visible, but what actively CHANGES over the 8 seconds.
- No analogies. No metaphors. No domain substitutions.
- Return ONLY the 5 sentences as plain text. No labels (do not write "S1:", "S2:" etc.), no intros, no outros.`;

            const result = await this.makeRequest(prompt, false);
            return result || block.videoPrompt || '';
        }

        // Image prompt enrichment — 1000-word mandate unchanged
        const prompt = `SYSTEM: You are a Lead Visual Architect for AI Bytes Learning.
GOAL: Expand the provided IMAGE BLOCK trigger into a MINIMUM 1000-WORD technical blueprint.

CONTEXT:
LESSON: "${lessonTitle}"
DOMAIN: "${domainStr}"
BLOCK TITLE: "${block.title || block.caption || 'Technical Detail'}"

VISUAL ACCURACY — ABSOLUTE LAW:
1. MINIMUM 1000 WORDS of technical description.
2. NO analogies. NO metaphors. NO kitchens, gardens, pottery, or cities.
3. USE THE 6-PART TECHNICAL FORMULA:
    - GEOMETRY: Precise shapes, wireframes, vertices, architectural layouts.
    - PHYSICS: Refractive indices, subsurface scattering, material properties (brushed metal, silicon).
    - LITE & OPTICS: Specific lighting (rim, three-point, lens flare), 35mm focal length.
    - DATA VISUALISATION: Literal tensors, weight matrices, code streams, signal noise.
    - PEDAGOGICAL ALIGNMENT: Direct literal mapping to the lesson objective.

RETURN ONLY THE TEXT OF THE ENRICHED PROMPT. NO INTROS. NO OUTROS.`;

        const result = await this.makeRequest(prompt, false);
        return result || block.imagePrompt || '';
    }
}

export class OrchestratorV2 {
    private planner = new ManifestPlannerAgent();
    private expander = new LessonExpanderAgent();
    private evaluator = new EvaluatorAgent();
    private enricher = new VisualEnrichmentAgent();

    async generateManifest(input: CourseGenerationInput): Promise<CourseStructure> { return await this.planner.generateManifest(input); }
    
    async processLesson(lessonPlan: any, moduleContext: any, courseContext: any, lessonNumber: number = 1, courseState: CourseState | null = null, dnaContent: CourseDNA["content"] | null = null): Promise<ConceptExplanation> {
        return await this.expander.expandLesson(lessonPlan, moduleContext, courseContext, [], lessonNumber, courseState, dnaContent);
    }

    async enrichLessonMedia(lesson: ConceptExplanation, domainStr: string): Promise<ConceptExplanation> {
        if (!lesson.blocks) return lesson;
        
        // Extract a title for context
        const headerBlock = lesson.blocks.find(b => b.type === 'lesson_header') as any;
        const lessonContextTitle = headerBlock?.title || "AI Lesson";
        
        console.log(`[OrchestratorV2] Parallel Enrichment starting for: ${lessonContextTitle}`);
        
        // Enrich media prompts IN PARALLEL to save time while staying within block token limits
        const enrichmentPromises = lesson.blocks.map(async (block: any) => {
            try {
                switch (block.type) {
                    case 'full_image':
                    case 'image_text_row':
                    case 'applied_case':
                        if (block.imagePrompt) {
                            block.imagePrompt = await this.enricher.enrichBlock(block, lessonContextTitle, domainStr);
                        }
                        break;
                    
                    case 'video_snippet':
                        block.videoPrompt = await this.enricher.enrichBlock(block, lessonContextTitle, domainStr);
                        break;

                    case 'type_cards':
                        if (block.cards) {
                            await Promise.all(block.cards.map(async (card: any) => {
                                if (card.imagePrompt) {
                                    card.imagePrompt = await this.enricher.enrichBlock({ ...card, type: 'image_block' }, lessonContextTitle, domainStr);
                                }
                            }));
                        }
                        break;

                    case 'industry_tabs':
                        if (block.tabs) {
                            await Promise.all(block.tabs.map(async (tab: any) => {
                                if (tab.imagePrompt) {
                                    tab.imagePrompt = await this.enricher.enrichBlock({ ...tab, type: 'image_block' }, lessonContextTitle, domainStr);
                                }
                            }));
                        }
                        break;
                }
            } catch (err) {
                console.error(`[OrchestratorV2] Enrichment failed for a block:`, err);
            }
        });

        await Promise.all(enrichmentPromises);
        console.log(`[OrchestratorV2] Parallel Enrichment complete for: ${lessonContextTitle}`);
        
        return lesson;
    }
}
