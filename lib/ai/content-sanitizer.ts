/**
 * Content Sanitizer — strips AI clichés and replaces them with plain English.
 * Applied to all generated lesson content before it is saved to the database.
 *
 * Usage:
 *   import { sanitizeText, sanitizeBlocks, BANNED_WORDS_INSTRUCTION } from '@/lib/ai/content-sanitizer';
 *
 *   // In prompts:
 *   const prompt = `...${BANNED_WORDS_INSTRUCTION}...`;
 *
 *   // Before saving blocks:
 *   const cleanBlocks = sanitizeBlocks(generatedBlocks);
 */

// ─── Replacement pairs (regex → replacement) ────────────────────────────────
// Order matters: more specific phrases first, then single words.
const REPLACEMENTS: Array<[RegExp, string]> = [
    // Phrases (multi-word — match before single-word variants)
    [/\bdeep.?dive\b/gi, 'close look'],
    [/\bdive into\b/gi, 'look at'],
    [/\bdive in\b/gi, 'start'],
    [/\blet's (?:dive in|get started|begin our journey|embark)\b/gi, "let's start"],
    [/\bbuckle up\b/gi, ''],
    [/\bit(?:'s| is) (?:worth noting|important to note) that\b/gi, ''],
    [/\bin conclusion\b/gi, 'to summarise'],
    [/\bin summary\b/gi, 'to summarise'],
    [/\bparadigm shift\b/gi, 'major change'],
    [/\bgame.chang(?:er|ing)\b/gi, 'significant shift'],
    [/\bcutting.edge\b/gi, 'latest'],
    [/\bstate.of.the.art\b/gi, 'modern'],
    [/\bnext.level\b/gi, 'advanced'],
    [/\bswiss army knife\b/gi, 'versatile tool'],
    [/\bnorth star\b/gi, 'goal'],

    // Single words — verbs
    [/\bdemystif(?:y|ies|ied|ying|ication)\b/gi, 'explain'],
    [/\bunpack(?:s|ed|ing)?\b/gi, 'break down'],
    [/\bdelve(?:s|d|ing)?\b/gi, 'look'],
    [/\bunlock(?:s|ed|ing)?\b/gi, 'learn'],
    [/\bharness(?:es|ed|ing)?\b/gi, 'use'],
    [/\bleverag(?:e|es|ed|ing)\b/gi, 'use'],
    [/\bempower(?:s|ed|ing|ment)?\b/gi, 'help'],
    [/\bunleash(?:es|ed|ing)?\b/gi, 'use'],
    [/\bstreamlin(?:e|es|ed|ing)\b/gi, 'simplify'],
    [/\butiliz(?:e|es|ed|ing)\b/gi, 'use'],
    [/\bfacilitat(?:e|es|ed|ing)\b/gi, 'help'],
    [/\bfoster(?:s|ed|ing)?\b/gi, 'encourage'],
    [/\bcommenc(?:e|es|ed|ing)\b/gi, 'start'],
    [/\bembark(?:s|ed|ing)?\b/gi, 'start'],
    [/\bnavigate(?:s|d|ing)?\b/gi, 'work through'],
    [/\bpivot(?:s|ed|ing)?\b/gi, 'shift'],

    // Single words — adjectives/adverbs
    [/\bdemystif(?:ying|ied)\b/gi, 'clear'],
    [/\btransformativ(?:e|ely)\b/gi, 'significant'],
    [/\bgroundbreaking\b/gi, 'new'],
    [/\binnovativ(?:e|ely)\b/gi, 'new'],
    [/\bseamlessly\b/gi, 'easily'],
    [/\brobust\b/gi, 'reliable'],
    [/\bcomprehensive(?:ly)?\b/gi, 'complete'],
    [/\bholistic(?:ally)?\b/gi, 'complete'],
    [/\bpowerful\b/gi, 'effective'],

    // Single words — nouns
    [/\bsynergy\b/gi, 'combination'],
    [/\becosystem\b/gi, 'environment'],
    [/\bjourney\b/gi, 'process'],
    [/\blandscape\b/gi, 'field'],
    [/\btapestry\b/gi, 'combination'],
    [/\barsenal\b/gi, 'set of tools'],
    [/\btoolkit\b/gi, 'set of tools'],
    [/\bblueprint\b/gi, 'plan'],
    [/\bbeacon\b/gi, 'guide'],

    // Discourse fillers
    [/\bfurthermore\b/gi, 'also'],
    [/\bmoreover\b/gi, 'also'],
    [/\bnonetheless\b/gi, 'still'],
    [/\bnevertheless\b/gi, 'still'],
];

// ─── Clean up residual double spaces left by blank replacements ──────────────
function collapseSpaces(s: string): string {
    return s.replace(/  +/g, ' ').trim();
}

/**
 * Sanitize a single string — runs all replacements in order.
 */
export function sanitizeText(text: string | undefined | null): string {
    if (!text) return text as string;
    let result = text;
    for (const [pattern, replacement] of REPLACEMENTS) {
        result = result.replace(pattern, replacement);
    }
    return collapseSpaces(result);
}

/**
 * Recursively walk a content block (or any JSON value) and sanitize all strings.
 * Does NOT mutate the input — returns a new object.
 */
export function sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') return sanitizeText(value);
    if (Array.isArray(value)) return value.map(sanitizeValue);
    if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = sanitizeValue(v);
        }
        return out;
    }
    return value;
}

// ─── Required-field rules per block type ────────────────────────────────────
// Each entry: field name → fallback value if missing/empty.
// Fallback is logged as a warning so it's visible in server logs.
const BLOCK_REQUIRED_FIELDS: Record<string, Record<string, unknown>> = {
    lesson_header: {
        title:       'Untitled Lesson',
        tag:         'Core Concept',
        duration:    '15 min',
        difficulty:  'Beginner',
        heroType:    'interactive',
        heroPrompt:  'Abstract glowing neural network on dark background',
        description: 'In this lesson you will build a clear understanding of this core concept and how it applies in the real world.',
        objectives:  ['Understand the core concept', 'Identify key applications', 'Apply the principles', 'Explain to others'],
    },
    objective: {
        label: 'Learning Objective',
        text:  'By the end of this lesson you will be able to apply this concept confidently.',
    },
    text: {
        heading:    'Key Concept',
        paragraphs: ['This section covers the essential ideas behind this topic.'],
    },
    punch_quote: {
        quote:  'Every great idea starts with a question.',
        accent: 'pulse',
    },
    full_image: {
        imagePrompt: 'High-tech 3D isometric visualization of global data networks',
        caption: 'A professional technical visualization of the system architecture.',
    },
    video_snippet: {
        title:       'Visual Insight',
        videoPrompt: 'Abstract visualisation of data flowing through a neural network, cinematic, no text, no faces',
        caption:     'An AI-generated visual illustrating the core concept.',
        duration:    8,
    },
    instructor_insight: {
        heading:  'Instructor Insight',
        videoUrl: null,
        insights: [
            { emoji: '🧠', title: 'Key insight', body: 'This concept is more intuitive than it first appears.' },
            { emoji: '⚡', title: 'Common mistake', body: 'Most beginners confuse this with a related but distinct idea.' },
            { emoji: '🔮', title: 'Real-world signal', body: 'Look for this pattern in the tools you already use.' },
        ],
    },
    recap: {
        style:  'card',
        title:  'If you remember only three things...',
        points: ['The core concept and what it means', 'How it differs from related ideas', 'Where you will encounter it next'],
    },
    prediction: {
        question:     'What do you think happens next?',
        options:      ['Option A', 'Option B', 'Option C'],
        correctIndex: 0,
        reveal:       'The correct answer is A. This is because the system processes inputs in sequence.',
        accentColour: 'iris',
    },
    open_exercise: {
        instruction:    'Improve the weak prompt below using the scaffold provided.',
        weakPrompt:     'Tell me about AI.',
        scaffoldLabels: ['Context', 'Task', 'Format', 'Tone'],
        modelAnswer:    'You are a data analyst. Summarise the key differences between supervised and unsupervised learning in a 3-bullet list using plain English.',
        accentColour:   'pulse',
    },
    completion: {
        skillsEarned: ['Core concept understood', 'Real-world applications identified', 'Ready for the next lesson'],
    },
    applied_case: {
        scenario: 'A company needs to implement a new AI strategy...',
        challenge: 'The existing infrastructure is legacy and fragmented.',
        resolution: 'By applying the principles learned in this lesson, they successfully transitioned to a unified AI-first architecture.',
    },
    quiz: {
        title:     'Knowledge Check',
        questions: [{
            question: 'What is the core takeaway from this section?',
            options:  ['Option A', 'Option B', 'Option C'],
            correctIndex: 0,
            correctFeedback: 'Correct! You have a firm grasp of the concept.',
            incorrectFeedback: 'Not quite. Let\'s look at the key points again.'
        }]
    }
};

/**
 * Validate a single block and fill in any missing required fields with safe fallbacks.
 * Logs a warning for every field that had to be patched.
 */
function validateAndRepairBlock(block: Record<string, unknown>): Record<string, unknown> {
    let type = (block.type || block.blockType || 'text') as string;
    
    // ─── Direct Mapping for V3/FLEX Schemas ──────────────────────────────────
    // The AI sometimes generates blocks with "FLEX-X" or "HERO VIDEO" labels.
    // We map these to standard internal types before validation.
    const TYPE_MAP: Record<string, string> = {
        'HERO VIDEO':        'video_snippet',
        'SECONDARY VIDEO':   'video_snippet',
        'FLEX-1':           'image_text_row',
        'FLEX-2':           'type_cards',
        'FLEX-3':           'instructor_insight',
        'FLEX-4':           'image_text_row',
        'FLEX-5':           'text',
        'FLEX-6':           'full_image',
        'FLEX-7':           'type_cards', // Process/Step cards
        'FLEX-8':           'applied_case',
        'full_image_section': 'full_image'
    };

    if (TYPE_MAP[type]) {
        type = TYPE_MAP[type];
    }

    const repaired: Record<string, any> = { 
        ...block,
        type: type // Normalize to 'type'
    };

    // ─── Nested Content Extraction ───────────────────────────────────────────
    // Some schemas wrap the actual block data in a 'content' field.
    if (block.content && typeof block.content === 'object' && !Array.isArray(block.content)) {
        Object.assign(repaired, block.content);
    }
    
    const rules = BLOCK_REQUIRED_FIELDS[type];
    if (!rules) return repaired;
    let patched = false;

    for (const [field, fallback] of Object.entries(rules)) {
        let value = repaired[field];

        // ─── Alias Resolution ────────────────────────────────────────────────
        const isInitiallyEmpty = (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0));
        
        if (isInitiallyEmpty) {
            if (field === 'paragraphs') {
                value = repaired.body || repaired.content || repaired.text;
            } else if (field === 'title') {
                value = (repaired as any).lesson_title || (repaired as any).header || (repaired as any).block_title || (repaired as any).heading;
            } else if (field === 'description') {
                const paras = (repaired as any).paragraphs;
                value = (repaired as any).microObjective || (repaired as any).subtitle || (repaired as any).text_content
                    || (repaired as any).body || (Array.isArray(paras) ? paras[0] : paras);
            } else if (field === 'duration') {
                value = (repaired as any).timeEstimate || (repaired as any).minutes || (repaired as any).duration_minutes;
            } else if (field === 'difficulty') {
                value = (repaired as any).level || (repaired as any).skillLevel || (repaired as any).complexity;
            } else if (field === 'objectives') {
                value = (repaired as any).learning_objectives || (repaired as any).outcomes || (repaired as any).goals || (repaired as any).learningObjectives;
            } else if (field === 'quote') {
                // punch_quote: AI may output generic text fields instead of 'quote'
                const paras = (repaired as any).paragraphs;
                value = (repaired as any).text || (repaired as any).body || (repaired as any).heading
                    || (Array.isArray(paras) ? paras[0] : paras);
            } else if (field === 'label') {
                // objective/punch_quote label: try heading or a shortened title
                value = (repaired as any).heading || (repaired as any).title || (repaired as any).subtitle;
            } else if (field === 'text' && type === 'objective') {
                // objective.text: AI may use paragraphs/body/heading
                const paras = (repaired as any).paragraphs;
                value = (repaired as any).body || (repaired as any).content
                    || (Array.isArray(paras) ? paras[0] : paras) || (repaired as any).heading;
            } else if (field === 'heroPrompt') {
                value = (repaired as any).imagePrompt || (repaired as any).background || (repaired as any).image_prompt;
            }

            if (value !== undefined) {
                repaired[field] = value;
            }
        }

        const finalValue = repaired[field];
        const isEmpty = (finalValue === undefined || finalValue === null || finalValue === '' || (Array.isArray(finalValue) && finalValue.length === 0));

        if (isEmpty) {
            console.warn(`[ContentSanitizer] ⚠️ Block "${type}" (id: ${block.id}) missing required field "${field}" — using fallback`);
            repaired[field] = fallback;
            patched = true;
        } else if (field === 'paragraphs' && !Array.isArray(repaired[field])) {
            repaired[field] = [repaired[field]];
        }
    }

    // REPAIR: paragraphs[] with a single giant string → split on sentence boundaries
    if (type === 'text' && Array.isArray(repaired.paragraphs) && repaired.paragraphs.length === 1) {
        const raw = repaired.paragraphs[0] as string;
        if (typeof raw === 'string' && raw.length > 300) {
            // Skip splitting if text contains abbreviations that would confuse sentence boundary detection
            const hasAbbreviations = /\b(e\.g\.|i\.e\.|vs\.|Fig\.|Dr\.|Mr\.|Mrs\.|Prof\.|approx\.|etc\.)/i.test(raw);
            if (hasAbbreviations) {
                // Leave as single paragraph — safer than incorrect splits
            } else {
            const sentences = raw.match(/[^.!?]+[.!?]+[\s]*/g) || [raw];
            const chunks: string[] = [];
            let current = '';
            for (const s of sentences) {
                current += s;
                if (current.trim().split(/[.!?]/).filter(Boolean).length >= 2) {
                    chunks.push(current.trim());
                    current = '';
                }
            }
            if (current.trim()) chunks.push(current.trim());
            if (chunks.length > 1) {
                console.warn(`[ContentSanitizer] ℹ️ text block "${block.id}" — split 1 giant paragraph into ${chunks.length} paragraphs`);
                repaired.paragraphs = chunks;
            }
            }
        }
    }

    // Special structural checks
    if (type === 'prediction') {
        const opts = repaired.options;
        if (!Array.isArray(opts) || opts.length !== 3 || opts.some((o: any) => typeof o !== 'string')) {
            console.warn(`[ContentSanitizer] ⚠️ prediction block "${block.id}" — options must be exactly 3 plain strings, repairing`);
            repaired.options = ['Option A', 'Option B', 'Option C'];
            if (typeof repaired.correctIndex !== 'number') repaired.correctIndex = 0;
        }
    }
    if (type === 'open_exercise') {
        const labels = repaired.scaffoldLabels;
        if (!Array.isArray(labels) || labels.length !== 4) {
            console.warn(`[ContentSanitizer] ⚠️ open_exercise block "${block.id}" — scaffoldLabels must be exactly 4 strings, repairing`);
            repaired.scaffoldLabels = ['Context', 'Task', 'Format', 'Tone'];
        }
    }
    if (type === 'quiz') {
        const qs = repaired.questions;
        if (!Array.isArray(qs) || qs.length === 0) {
            console.warn(`[ContentSanitizer] ⚠️ quiz block "${block.id}" — missing questions, repairing`);
            repaired.questions = BLOCK_REQUIRED_FIELDS.quiz.questions;
        } else {
            repaired.questions = qs.map((q: any) => ({
                ...q,
                question: q.question || q.questionText || q.text || 'Knowledge Check',
                options:  q.options || q.answers || ['True', 'False'],
                correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 
                              (q.options || q.answers)?.findIndex((o: any) => o?.isCorrect === true || o === q.answer || o === q.correctAnswer) ?? 0
            }));
        }
    }
    if (type === 'recap') {
        // Alias resolution for legacy points[]
        let pts = (repaired as any).points || (repaired as any).takeaways || [];
        if (!Array.isArray(pts)) pts = [];
        const normalizedPts = pts.map((it: any) =>
            typeof it === 'string' ? it : it?.text || it?.point || it?.takeaway || String(it)
        );

        // New items[] format — normalise objects vs strings
        let itms = (repaired as any).items || [];
        if (!Array.isArray(itms)) itms = [];
        const normalizedItems = itms.map((it: any) => {
            if (typeof it === 'string') return null; // Cannot fabricate title+body from a string
            if (it && typeof it === 'object' && it.title && it.body) return it;
            // Try alias resolution
            const title = it?.title || it?.heading || it?.label || '';
            const body  = it?.body  || it?.text   || it?.content || '';
            return title ? { title, body } : null;
        }).filter(Boolean);

        if (normalizedItems.length > 0) {
            repaired.items = normalizedItems;
            if (normalizedItems.length < 4) {
                console.warn(`[ContentSanitizer] ⚠️ recap block "${block.id}" — items has ${normalizedItems.length} entries (expected 4), saving as-is`);
            }
        } else if (normalizedPts.length > 0) {
            repaired.points = normalizedPts;
        } else {
            console.warn(`[ContentSanitizer] ⚠️ recap block "${block.id}" — missing both points and items, using fallback`);
            repaired.points = ['Key insight 1', 'Key insight 2', 'Key insight 3', 'Key insight 4'];
        }
    }
    // ── WARN: missing semantic content — do NOT fabricate ────────────────────
    if (type === 'video_snippet' && !repaired.description) {
        console.warn(`[ContentSanitizer] ⚠️ video_snippet block "${block.id}" — missing "description" field. Component will hide the panel.`);
    }
    if (type === 'full_image' && !repaired.explanation) {
        console.warn(`[ContentSanitizer] ⚠️ full_image block "${block.id}" — missing "explanation" field. Component falls back to full-width, no split layout.`);
    }
    if (type === 'flow_diagram' && !repaired.explanation) {
        console.warn(`[ContentSanitizer] ⚠️ flow_diagram block "${block.id}" — missing "explanation" field. Component will render diagram without interpretive text.`);
    }
    if (type === 'applied_case') {
        const t = (repaired as any).tabs;
        if (Array.isArray(t) && t.length > 0) {
            if (t.length !== 3) {
                console.warn(`[ContentSanitizer] ⚠️ applied_case block "${block.id}" — tabs has ${t.length} entries (expected 3), saving as-is`);
            }
        } else if (!repaired.scenario) {
            console.warn(`[ContentSanitizer] ⚠️ applied_case block "${block.id}" — missing both tabs and legacy scenario field`);
        }
    }
    if (type === 'key_terms') {
        // Normalise field name variants (terms / key_terms / keyTerms) → terms
        if (!Array.isArray(repaired.terms)) {
            if (Array.isArray(repaired.key_terms)) {
                repaired.terms = repaired.key_terms;
                delete repaired.key_terms;
            } else if (Array.isArray(repaired.keyTerms)) {
                repaired.terms = repaired.keyTerms;
                delete repaired.keyTerms;
            }
        }
        if (Array.isArray(repaired.terms)) {
            repaired.terms = repaired.terms.map((t: any) =>
                typeof t === 'string' ? { term: t, definition: 'Key concept.' } : t
            );
            if (repaired.terms.length < 12) {
                console.warn(`[ContentSanitizer] ⚠️ key_terms block "${block.id}" — only ${repaired.terms.length} terms (expected ≥12). Saving as-is; do NOT pad with invented terms.`);
            }
        }
    }
    if (type === 'instructor_insight') {
        const ins = repaired.insights;
        if (!Array.isArray(ins) || ins.length < 3) {
            console.warn(`[ContentSanitizer] ⚠️ instructor_insight block "${block.id}" — must have exactly 3 insights, repairing`);
            const base: any[] = Array.isArray(ins) ? ins : [];
            while (base.length < 3) base.push({ emoji: '💡', title: 'Insight', body: 'This concept rewards careful attention.' });
            repaired.insights = base.slice(0, 3);
        }
    }

    if (patched) {
        console.warn(`[ContentSanitizer] Block "${type}" (id: ${block.id}) was repaired before DB save`);
    }

    return repaired;
}

/**
 * Sanitize an array of content blocks before DB insert.
 * Runs text sanitization AND required-field validation/repair on every block.
 */
export function sanitizeBlocks(blocks: unknown[]): unknown[] {
    return blocks
        .map(sanitizeValue)
        .map(b => validateAndRepairBlock(b as Record<string, unknown>)) as unknown[];
}

// ─── Instruction string to embed in generation prompts ──────────────────────
export const BANNED_WORDS_INSTRUCTION = `
LANGUAGE QUALITY — MANDATORY:
Write in plain, direct British English. Avoid ALL of the following words and phrases — they sound like generic AI output and undermine credibility:

BANNED PHRASES: "deep dive", "dive into", "dive in", "let's get started", "buckle up", "it's worth noting", "it's important to note", "in conclusion", "paradigm shift", "game-changer", "game-changing", "cutting-edge", "state-of-the-art", "next-level", "swiss army knife", "north star"

BANNED WORDS: demystify, unpack, delve, unlock, harness, leverage, empower, unleash, streamline, utilize, facilitate, foster, commence, embark, navigate (metaphorical), transformative, groundbreaking, innovative (overused), seamlessly, robust, comprehensive, holistic, synergy, ecosystem (metaphorical), journey (metaphorical), landscape (metaphorical), tapestry, arsenal, toolkit, blueprint (metaphorical), beacon, furthermore, moreover

REPLACEMENTS TO USE INSTEAD:
- "deep dive / dive into" → "look at", "cover", "examine"
- "leverage / harness / utilize" → "use", "apply"
- "unlock / unleash" → "learn", "run", "get"
- "demystify / unpack" → "explain", "break down", "clarify"
- "transformative / groundbreaking" → "significant", "useful", "new"
- "seamlessly" → "easily", "directly"
- "journey / landscape / ecosystem" → use the specific real word instead
- "furthermore / moreover" → "also", "and", "in addition"
`.trim();
