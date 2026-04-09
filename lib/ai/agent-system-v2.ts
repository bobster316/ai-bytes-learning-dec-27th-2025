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
import { jsonrepair } from 'jsonrepair';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'deepseek/deepseek-v3.2';

// ─── Universal Lesson Generation Spec v1.0 ──────────────────────────────────
// Injected into every LessonExpanderAgent call after the conductor notes.
const UNIVERSAL_LESSON_SPEC = `
═══════════════════════════════════════════════════════════
PEDAGOGICAL STRUCTURE — UNIVERSAL LESSON SPEC v1.0
═══════════════════════════════════════════════════════════

Every lesson MUST include the following pedagogical components
in the default sequence below.

If a valid SEQUENCE ADJUSTMENT is provided by the Conductor
above, follow that adjusted sequence while preserving all
dependency rules. Only reorder the components named in the
adjustment. Do not change required block presence or field rules.

─────────────────────────────────────────────────────────
STEP 1 — HOOK  (block type: "hook")
  Role:    Create curiosity before any teaching begins.
  Where:   Position 1 or 2 in the lesson (after lesson_header/objective).
  Purpose: The learner must feel a gap between what they know and what
           they are about to learn. Use a question, statistic,
           contradiction, or scenario.
           DO NOT open with a definition (e.g. "X is a…")
           DO NOT explain anything yet.
  Fields:  { "type": "hook", "content": "...", "hook_style": "question"|"scenario"|"statistic"|"contradiction", "analytics_tag": "hook" }

STEP 2 — PREDICTION  (block type: "prediction")
  Role:    Activate prior knowledge and create a stake.
  Where:   After the hook, before any core_explanation.
  Purpose: Ask the learner to guess before the explanation arrives.
           The prediction does not need to be correct.
  Fields:  { "type": "prediction", "question": "What do you predict?", "options": ["A","B","C"], "correctIndex": 0, "reveal": "The answer is..." }

STEP 3 — CORE EXPLANATION  (block type: "core_explanation")
  Role:    Deliver the concept in plain language.
  Where:   After hook and prediction.
  Purpose: One concept. No jargon without definition. Max 3 sentences per paragraph.
  Anti-patterns:
           - Do not repeat the hook in different words
           - Do not drift into generic motivational copy
  Fields:  { "type": "core_explanation", "heading": "...", "paragraphs": ["..."], "analytics_tag": "core_explanation" }

STEP 4 — HOW IT WORKS  (block type: "process" or "flow_diagram")
  Role:    Show the mechanism, not just the idea.
  Where:   After core_explanation, before closure.
  Purpose: A causal mental model. Use flow_diagram for sequential steps.

STEP 5 — REAL-WORLD ANCHOR  (block type: "applied_case" or "industry_tabs")
  Role:    Ground the concept in a recognisable context.
  Where:   After process, in the consolidation phase.
  Purpose: A real or clearly realistic context. Avoid vague hypotheticals.

STEP 6 — CONTRAST  (block type: appropriate explanatory block)
  Role:    Sharpen understanding by showing what the concept is NOT.
  Where:   After the real-world anchor. tension_first arc may place this first.
  Purpose: A before/after, old-way/new-way, or misconception/correction pair.

STEP 7 — MENTAL CHECKPOINT  (block type: "mental_checkpoint")
  Role:    Mid-lesson comprehension pause (NOT a graded quiz).
  Where:   After core_explanation and process — before quiz and summary.
  Purpose: A moment for the learner to self-assess.
  Fields:  { "type": "mental_checkpoint", "prompt": "...", "checkpoint_style": "reflection"|"predict"|"confidence_pick", "response_mode": "reflective"|"diagnostic"|"confidence", "options": ["Got it","Mostly","Lost me"], "analytics_tag": "mental_checkpoint" }
           Note: options required only when checkpoint_style is "confidence_pick".

STEP 8 — INTERACTION  (block type: "quiz" with EXACTLY 3 questions)
  Role:    Graded knowledge check.
  Where:   After mental_checkpoint, before summary blocks.
  Purpose: Tests recall or application — must connect to core_explanation content.

STEP 9 — SUMMARY SEQUENCE
  teaching_line (REQUIRED):
    { "type": "teaching_line", "line": "...", "support": "...", "analytics_tag": "teaching_line" }
    The single most important sentence. Exactly 1 sentence. Max 25 words.
    No trailing colon. Not phrased as a heading or label.

  recap (STRONGLY EXPECTED):
    3-4 bullet recap of what was covered.

  key_terms (INCLUDE ONLY if technical vocabulary was introduced):
    Do not force this block into lessons with no terminology.
─────────────────────────────────────────────────────────

Do not leave any required pedagogical fields empty.
Generate complete, learner-facing content for every required block.
Before finalising, verify all required components are present exactly once.
═══════════════════════════════════════════════════════════

`;

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
        const messages = Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }];
        if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is missing");

        const MAX_RETRIES = 5;
        const TIMEOUT_MS = 120000; // Increased to 120s for 1000w prompts

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            try {
                const response = await fetch(`${OPENROUTER_URL}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'http://localhost:3000'
                    },
                    body: JSON.stringify({
                        model: MODEL_NAME,
                        messages,
                        temperature: 0.7,
                        max_tokens: 8000,
                        provider: { sort: "throughput" },
                        ...(isJson ? { response_format: { type: "json_object" } } : {})
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.status === 429 || response.status === 503) {
                    const delay = attempt * Math.max(3000, attempt * 1500); // Backoff: 3s, 6s, 13.5s, 24s, 37.5s (Total wait ~84s)
                    console.warn(`[OpenRouter API] 429/503 hit. Retrying attempt ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
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
                let text = data.choices?.[0]?.message?.content;
                if (!text) throw new Error("Empty response from OpenRouter API");

                // Asynchronous Cost Logging
                if (data.usage?.total_tokens && process.env.NEXT_PUBLIC_SUPABASE_URL) {
                    const prompts = data.usage.prompt_tokens || 0;
                    const comp = data.usage.completion_tokens || 0;
                    const cost_usd = (prompts / 1000000) * 0.14 + (comp / 1000000) * 0.28;
                    const supaUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/api_cost_logs`;
                    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
                    if (supaKey && cost_usd > 0) {
                        fetch(supaUrl, {
                            method: 'POST',
                            headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                            body: JSON.stringify({ provider: 'openrouter', operation: 'deepseek_v3_generation', units: data.usage.total_tokens, unit_type: 'total_tokens', cost_usd })
                        }).catch(() => {});
                    }
                }


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
        throw new Error(`${this.constructor.name}: Reached maximum retries without a successful response. This indicates persistent rate-limiting or service unavailability.`);
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
  "refinedCourseTitle": "string (MAX 6 words. A concise, punchy main title. No extreme subtitles. BANNED WORDS: Demystified, Unveiled, Unleashed, 101, Introduction to)",
  "courseMetadata": {
    "category": "Must be EXACTLY one of: ${CATEGORY_LABELS_FOR_PROMPT}",
    "description": "A best-in-class world-leading micro e-learning course description (2-3 paragraphs) that uses high-conversion marketing psychology and clearly defines the 'Antigravity' value proposition.",
    "estimatedComplexity": number,
    "recommendedPrerequisites": ["string"],
    "learningObjectives": ["string"],
    "practicalOutcomes": ["string"],
    "thumbnailPrompt": "string (A pure visual description. CRITICAL: Provide instructions for an IMAGE ONLY. NEVER instruct the rendering of text, typography, or titles within the image.)"
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
          "lessonTitle": "string (MAX 6 words. No subtitles.)",
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

// Each pool has a mode and a mandated purpose sequence.
// mode    → the lesson's teaching personality (injected into prompt)
// sequence → the cognitive arc the block order must follow (enforced in SECTION_PURPOSE_RULES)
// diagram  → which visual reasoning archetype this lesson uses (rotated across lessons)
const BLOCK_POOLS: Record<string, { blocks: string[], description: string, mode: string, sequence: string, diagram: string }> = {
    'The Hook': {
        mode: 'Visual-first',
        sequence: 'Introduce → Visualise → Explain → Visualise → Apply → Reinforce',
        diagram: 'cause-effect chain',
        description: 'Opens with surprise → builds evidence → returns to the hook with new insight',
        blocks: ['type_cards:grid', 'prediction', 'image_text_row', 'text:bridge', 'full_image', 'flow_diagram:contrast', 'instructor_insight', 'callout:tip']
    },
    'The Journey': {
        mode: 'Scenario-first',
        sequence: 'Introduce → Apply → Explain → Visualise → Explain → Reinforce',
        diagram: 'process flow',
        description: 'Opens with a problem → unfolds as a story → arrives at the destination',
        blocks: ['image_text_row', 'text:bridge', 'full_image', 'flow_diagram:steps', 'applied_case', 'type_cards:numbered', 'go_deeper', 'callout:tip']
    },
    'The Contrast': {
        mode: 'Comparison-heavy',
        sequence: 'Introduce → Explain → Compare → Visualise → Apply → Reinforce',
        diagram: 'before/after contrast',
        description: 'Shows the wrong way → introduces the corrective lens → clear before/after',
        blocks: ['flow_diagram:contrast', 'callout:warning', 'full_image', 'type_cards:horizontal', 'prediction', 'applied_case', 'image_text_row', 'instructor_insight']
    },
    'The Build': {
        mode: 'System-deep-dive',
        sequence: 'Introduce → Explain → Visualise → Explain → Visualise → Reinforce',
        diagram: 'system architecture',
        description: 'Simplest element first → layer by layer → reveals the complete system',
        blocks: ['image_text_row', 'type_cards:numbered', 'full_image', 'flow_diagram:steps', 'open_exercise', 'interactive_vis', 'text:bridge', 'applied_case']
    },
    'The Zoom': {
        mode: 'Visual-first',
        sequence: 'Introduce → Visualise → Visualise → Explain → Visualise → Reinforce',
        diagram: 'data flow',
        description: 'Wide-angle view → zooms into one critical detail → zooms back out enriched',
        blocks: ['full_image', 'mindmap', 'flow_diagram:steps', 'image_text_row', 'go_deeper', 'industry_tabs', 'type_cards:bento', 'callout:tip']
    },
    'The Dialogue': {
        mode: 'Scenario-first',
        sequence: 'Introduce → Apply → Explain → Compare → Apply → Reinforce',
        diagram: 'decision tree',
        description: 'Poses a question → answers through conversation → closes with a one-liner',
        blocks: ['prediction', 'image_text_row', 'type_cards:grid', 'full_image', 'text:bridge', 'instructor_insight', 'go_deeper', 'callout:tip']
    },
    'The Reveal': {
        mode: 'System-deep-dive',
        sequence: 'Introduce → Explain → Visualise → Explain → Visualise → Reinforce',
        diagram: 'transformation',
        description: 'Familiar & mundane → gradually reveals hidden complexity → I-never-knew-that moment',
        blocks: ['image_text_row', 'type_cards:bento', 'full_image', 'callout:warning', 'flow_diagram:contrast', 'go_deeper', 'mindmap', 'instructor_insight']
    },
    'The Challenge': {
        mode: 'Comparison-heavy',
        sequence: 'Introduce → Compare → Explain → Apply → Compare → Reinforce',
        diagram: 'trade-off matrix',
        description: 'Presents a decision point → explores trade-offs → closes with a usable principle',
        blocks: ['prediction', 'flow_diagram:contrast', 'full_image', 'applied_case', 'industry_tabs', 'image_text_row', 'type_cards:horizontal', 'callout:warning']
    },
};

function getBlueprintForLesson(
    structureName: string,
    lessonNumber: number,
    difficulty: string,
    courseState: CourseState | null
): { chosenBlocks: string[]; heroType: 'video_snippet' | 'full_image'; recapStyle: string; quizFirst: boolean; videoIndices: number[]; heroPattern: string[]; lessonMode: string; purposeSequence: string; diagramArchetype: string } {
    const pool = BLOCK_POOLS[structureName] || BLOCK_POOLS['The Hook'];
    const structureData = STRUCTURE_PATTERNS.find(s => s.name === structureName) || STRUCTURE_PATTERNS[0];
    const videoIndices = structureData.videoScene || [1, 14];

    const seed = lessonNumber + structureName.length;
    const offset = seed % pool.blocks.length;
    const rotated = [...pool.blocks.slice(offset), ...pool.blocks.slice(0, offset)];
    // Reduced from 7/8/9 — keeps total lesson blocks under the deepseek output token ceiling
    const pickCount = difficulty === 'Beginner' ? 5 : difficulty === 'Advanced' ? 7 : 6;

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

    return { chosenBlocks, heroType, recapStyle, quizFirst, videoIndices, heroPattern, lessonMode: pool.mode, purposeSequence: pool.sequence, diagramArchetype: pool.diagram };
}

// ─── Section purpose map — each block type has a natural pedagogical role ────
// Used in the prompt to enforce that every block declares exactly one purpose.
const SECTION_PURPOSE_RULES = `SECTION PURPOSE TAGGING — EVERY BLOCK MUST DECLARE ITS ROLE:

Every block in the lesson must include a "purpose" field with EXACTLY ONE of:
  "Introduce" | "Explain" | "Visualise" | "Compare" | "Apply" | "Reinforce"

LESSON MODE INSTRUCTION:
  This lesson's MODE is given in the LESSON MODE field above. Follow the teaching personality it defines:
  • Visual-first     → Lead with images and diagrams. Let visuals carry the argument; text supports.
  • Scenario-first   → Open with a real-world situation. Ground every concept in a decision or outcome.
  • System-deep-dive → Expose the architecture. Show how components connect. Prioritise mechanism over application.
  • Comparison-heavy → Anchor understanding in contrast. Every key idea has a foil. The difference IS the lesson.

PURPOSE SEQUENCE — MANDATORY:
  The PURPOSE SEQUENCE field above defines this lesson's exact cognitive arc.
  Follow it. The sequence of "purpose" values in your blocks array MUST match this arc.

CLUSTER CAP — HARD RULE:
  Never place more than 2 blocks with the same "purpose" value within any 4-block window.
  After 2 consecutive "Explain" blocks: the next block MUST be "Visualise", "Compare", or "Apply".
  Violating this rule creates explanation fatigue — it is a content failure.

DIAGRAM ARCHETYPE — MANDATORY:
  The DIAGRAM ARCHETYPE field above defines the visual reasoning pattern for ALL flow_diagram and
  comparison blocks in this lesson. Implement it literally:
  • "cause-effect chain"    → show how A causes B causes C; the chain is the lesson's argument
  • "process flow"          → sequential steps from input to output; each step is distinct and named
  • "before/after contrast" → two states of the same system; the gap between them is what the lesson explains
  • "system architecture"   → components, connections, and roles; the diagram shows how the whole works
  • "data flow"             → how information moves, transforms, and is consumed across the system
  • "decision tree"         → conditional branches; the learner sees how different inputs lead to different outcomes
  • "transformation"        → a single entity changes state; before/during/after is the structure
  • "trade-off matrix"      → two axes, four quadrants; each position represents a different balance of constraints
  Do NOT use "reactive vs predictive" or "rule-based vs learned" as the default fallback — choose the archetype.

NATURAL PURPOSE BY BLOCK TYPE:
  lesson_header, objective, punch_quote          → Introduce
  text, callout, go_deeper, instructor_insight   → Explain
  full_image, concept_illustration, mindmap      → Visualise
  image_text_row                                 → Visualise (image-led) or Explain (text-led)
  flow_diagram:steps, interactive_vis            → Visualise
  flow_diagram:contrast, type_cards:horizontal   → Compare
  type_cards:grid, type_cards:numbered           → Explain
  type_cards:bento                               → Visualise
  prediction                                     → Reinforce
  applied_case, industry_tabs, open_exercise     → Apply
  video_snippet                                  → Introduce (first) / Apply (second)
  recap, quiz, key_terms, completion             → Reinforce

PURPOSE MUST BE EMBODIED — NOT JUST LABELLED:
  Introduce  → PASS: "X doesn't work the way most people assume. The reason it works at all is surprising."
  Explain    → PASS: Unpacks the mechanism — how it works, why it behaves that way, what breaks if removed.
  Visualise  → PASS: Uses the image to reveal a relationship the text alone couldn't convey.
  Compare    → PASS: "The shift from A to B is not just a technical change — it changes what becomes possible."
  Apply      → PASS: A named situation, a specific constraint, a real decision, a clear consequence.
  Reinforce  → PASS: A question that requires using the concept, or a distillation that makes it unforgettable.`.trim();

// ─── Lesson quality rules injected into every generation prompt ─────────────
const LESSON_QUALITY_RULES = `LESSON CONTENT QUALITY RULES — ABSOLUTE LAW:

BLOCK TYPES — ABSOLUTE LAW:
  • ONLY use these exact type values: lesson_header, objective, text, full_image, image_text_row, type_cards, callout, industry_tabs, quiz, completion, key_terms, applied_case, recap, go_deeper, interactive_vis, video_snippet, punch_quote, prediction, mindmap, flow_diagram, concept_illustration, open_exercise, instructor_insight
  • NEVER invent custom types like "INTRO", "OUTRO", "explanatory", "foundation", "visual_insight" etc.
  • Use exactly one recap block. Never generate two recap blocks.
  • recap block MUST include: id (string), title (string e.g. "If you remember only three things…"), items (array of EXACTLY 4 objects, each with title + body). NEVER omit title. NEVER use "points" — the field is "items".
  • quiz block MUST include: id (string), title (string e.g. "Test Your Understanding"), questions (array of EXACTLY 3 objects). The "title" field is MANDATORY — LLM consistently omits it. DO NOT omit title.
  • instructor_insight block MUST include: id (string), insights (array of EXACTLY 3 objects, each with emoji, title, body). DO NOT add "heading" or "videoUrl" — those fields are not used.

CONTENT BALANCE — GOLDEN RULE:
  Every section = one idea → explained using everyday metaphors → visualised → reinforced.
  • DEMOCRATIZE AI (NO PHD REQUIRED): NEVER use academic jargon (e.g., CNNs, RNNs, O(n²), gradients, parameters) unless it is deeply explained using a simple real-world analogy. Write for a smart, curious beginner.
  • NEVER place a visual block (image_text_row, full_image, type_cards) with fewer than 3 explanatory sentences alongside it
  • NEVER produce a heading or label block with no substantive content below it
  • NEVER let 4+ consecutive text paragraphs appear without a visual break — insert a callout, image, or card block
  • Each block must justify its space: if you cannot write 3 substantive sentences about it, merge it with a neighbouring block

STRUCTURE:
  • objective blocks:      exactly 3 sentences — S1: what the learner will understand (start with "By the end of this lesson…"), S2: why this capability matters in real-world practice, S3: what mental model or skill this builds
  • image_text_row blocks: text field — minimum 4 substantive sentences structured as: (1) what this visual shows and why it was chosen, (2) the key mechanism or insight it reveals, (3) what the learner should infer from it, (4) a concrete practical implication
  • text blocks:           ALWAYS include "heading" field (3–6 word phrase naming the concept). NEVER omit heading. Example: { "type": "text", "heading": "How Attention Weights Work", "paragraphs": [...] }
  • video_snippet blocks:  REQUIRED "description" field — exactly 2 sentences: S1 what the viewer will see, S2 why it matters for this lesson
  • recap blocks:          REQUIRED fields: id (string), title (string), style ("card" — always use this exact value), items (array of EXACTLY 4 objects, each with title + body). Example: { "type": "recap", "id": "recap_x", "title": "If you remember only three things…", "style": "card", "items": [...] }. NEVER omit style.
  • applied_case blocks:   REQUIRED "tabs" array — EXACTLY 3 tabs. Each tab MUST contain ALL of these keys: id, label, scenario, challenge, resolution. NEVER omit any key from any tab. Example structure:
      "tabs": [
        { "id": "tab_1", "label": "Healthcare", "scenario": "2 sentences describing the real-world situation.", "challenge": "2 sentences describing the specific obstacle.", "resolution": "2 sentences describing how the lesson concept solved it." },
        { "id": "tab_2", "label": "Finance", "scenario": "...", "challenge": "...", "resolution": "..." },
        { "id": "tab_3", "label": "Manufacturing", "scenario": "...", "challenge": "...", "resolution": "..." }
      ]
  • key_terms blocks:      EXACTLY 4 to 5 terms max. Choose ONLY the most essential vocabulary. NEVER include complex mathematical or engineering jargon. Each term MUST have "definition" (2 sentences max).
  • completion blocks:     ALL of these fields are REQUIRED:
      - title:        A statement of intellectual arrival — NOT a UI label. Avoid: "Lesson Complete", "You've finished", "Well done". Write instead a short phrase that names what the learner has understood: "From Reaction to Prediction", "Seeing the Pattern", "The Architecture Becomes Clear". Make it feel earned.
      - summary:      1–2 sentences. NOT a recap of what was covered. Describe what the learner NOW UNDERSTANDS DIFFERENTLY — capability-framing, forward-looking. The learner should recognise a shift in how they see the topic.
      - skillsEarned: Exactly 3 items. Each is a PERSPECTIVE SHIFT, not a topic label. Each must start with "You can now…" and complete the thought with a concrete capability — something the learner genuinely could not do before this lesson. NEVER write generic labels like "Understanding AI applications" or "Core concept understood".
      - closingLine:  ONE short, precise sentence that lands the core idea of the lesson. This is the sentence the learner remembers. It should feel like the lesson's conclusion distilled into a single thought. Example: "This is where intelligent systems stop reacting — and start anticipating."
      - nextStep:     1 sentence. Must name the specific concept or capability the NEXT lesson builds — not a vague "continue learning". Make it feel like an invitation, not a signpost.
      BANNED in completion blocks: "Congratulations", "You've completed", "Well done", "In this lesson we covered", "You have learned", "You are now equipped to", "We explored". These are generic closers. The tone must be: calm, precise, confident — a quiet acknowledgement that a shift has happened.

COMPLETION REFERENCE TONE (do not copy literally — match the register):
  title: "From Reaction to Prediction" | summary: capability shift, not recap | skillsEarned: "You can now explain…" | closingLine: "This is where intelligent systems stop reacting — and start anticipating." | nextStep: names the specific next concept.

DENSITY CAPS — HARD LIMITS (exceeding these is a content failure):
  • type_cards descriptions:  MAX 60 words per card — 2 sentences only. These are insight cards, not paragraphs.
  • text block paragraphs:    MAX 2 sentences per paragraph; MAX 3 paragraphs per block
  • image_text_row text:      EXACTLY 4 sentences — no expansion permitted beyond these 4
  • key_terms definitions:    MAX 25 words per definition — first sentence defines, second sentence contextualises
  • recap body:               EXACTLY 2 sentences — insight + implication. No expansion.
  • applied_case fields:      scenario/challenge/resolution: 2 sentences each — no padding
  • instructor_insight body:  1–2 sentences only — each card is a single thought, not a paragraph

VISUAL MECHANISM DIVERSITY — NO CONSECUTIVE REPEATS:
  • flow_diagram:contrast blocks MUST contrast two concepts that are DIRECTLY from this lesson's title and objective — not generic AI/ML abstractions.
  • BANNED as default contrast: "Reactive vs Predictive", "Reactive vs Proactive". These are overused. If the lesson IS specifically about reactive vs predictive systems, you may use it — but only if it is the exact topic of THIS lesson.
  • The contrast labelA and labelB MUST be terms the learner has just been taught in THIS lesson. Never use contrast blocks to introduce a concept not covered in the lesson.
  • NEVER use the same contrast mechanism as the previous lesson. Derive the contrast from: rule-based vs learned, centralised vs distributed, manual vs automated, single-pass vs iterative, deterministic vs probabilistic, siloed vs integrated, human-in-loop vs autonomous, batch vs real-time, threshold-based vs continuous — whichever best matches THIS lesson's specific content.
  • mindmap and flow_diagram:steps must also vary: do NOT reuse the same structural metaphor (e.g., "layered pyramid") in consecutive lessons.

TEXT QUALITY:
  • sentence length: short and direct — one idea per sentence
  • avoid long compound sentences joined by multiple "which", "that", "however" chains
  • no paragraph should look like a dense wall of text — if it does, break it
  • reduce verbosity by 15% — say more with less

IMAGE EXPLANATIONS (semantic quality — ABSOLUTE):
  • full_image blocks:    REQUIRED "explanation" field — 2–3 sentences
  • flow_diagram blocks:  REQUIRED "explanation" field — 2–3 sentences
  • type_cards cards:     REQUIRED "description" field — 3–4 sentences explaining the card concept and why it matters
  • ALL explanations MUST interpret what the visual reveals — NOT describe what is visible
    BAD:  "This image shows a transformer architecture diagram."
    GOOD: "The layout reveals how the attention mechanism links tokens regardless of their position in the sequence, which is why transformers outperform recurrent networks on long-context tasks."

LAYOUT HINTS:
  • full_image blocks: set layout: "split" when explanation is present; layout: "hero" for standalone atmosphere images only`.trim();

const LESSON_VOICE_GUIDE = `LESSON VOICE AND STYLE — THIS IS HOW AI BYTES LESSONS SOUND:

AI Bytes lessons feel like a friendly, world-class educator democratizing AI. The tone is highly engaging, deeply intuitive, and explicitly designed for non-coders. It never sounds like a university textbook, an academic paper, or an intimidating engineering manual.

VOICE PRINCIPLES:
  • Speak directly to the learner as "you" — not "the user", "learners", or "one"
  • Lead with the insight or surprising idea first, then explain it — never define before making the reader want to know
  • Vary sentence rhythm deliberately: use short, punchy lines to land key ideas; follow long setup sentences with short payoffs
  • Earn attention through clarity and substance — never fake enthusiasm. No "Amazing!", "Exciting!", "Let's dive in!", or overhype
  • Prefer the specific over the general: concrete mechanisms and real numbers beat vague statements
  • Explain not just WHAT something is, but HOW it works, WHY it matters, and WHAT it enables
  • When writing about visuals or diagrams, interpret what they reveal — do not describe what is visible
  • Keep paragraphs short and intentional — every sentence should justify its presence
  • Use analogy rarely and only when it genuinely accelerates understanding — never as decoration
  • End sections and the lesson with a sense of closure, capability, and forward motion
  • Replace any sentence that describes what something IS with a sentence that reveals what it DOES, breaks, or enables
    BAD: "DCGANs are a type of generative network used to create images."
    GOOD: "DCGANs don't understand images. They compete over them — one network generates, the other judges, until the generator wins."

THE THREE LAWS OF VOICE (apply these to every sentence before writing it):
  1. UNIVERSALITY TEST: If this sentence could appear in ANY course on ANY topic, it must be rewritten. Generic language is a failure. Every sentence must be specific to THIS concept, THIS mechanism, THIS lesson.
     BAD: "AI is transforming industries around the world."
     BAD: "This technology has many important applications."
     GOOD: "Railway operators using predictive maintenance cut unplanned downtime by 30–40% — not by reacting faster, but by not needing to react at all."
  2. CLARITY LAW: If a sentence sounds clever but is harder to understand, simplify it. Precision beats sophistication. The goal is a clear idea landing cleanly — not an impressive sentence that obscures it.
     BAD: "Intelligence emerges not from cognition itself but from structured probabilistic inference across distributed representations."
     BAD: "AI redefines the boundaries of computational reasoning through layered abstraction."
     GOOD: "AI learns by adjusting itself based on data. The more data it sees, the better it adjusts."
     The test: can a smart person understand this sentence on first read? If not, rewrite it.
  3. OPENING RULE: Every block, every section, every paragraph must begin with a THOUGHT, not a label or definition. The first sentence is the hook — it must make the learner want the second sentence.
     BAD: "Transformers are a type of neural network architecture."
     BAD: "In this section, we will cover the key components."
     GOOD: "The attention mechanism changed everything — not because it was new, but because it was the first design that could hold the whole sentence in mind at once."

ANTI-PATTERNS — NEVER DO THESE:
  • "In this lesson, we will explore..." — start with the idea, not the agenda
  • "It is important to note that..." — just say the important thing
  • "As we can see from the diagram..." — interpret the diagram, don't narrate it
  • "AI is not just..." — weak contrasting opener; state the positive truth directly
  • "This is important because..." — if it's important, lead with the important thing
  • "In modern systems..." / "Today, AI is widely used..." — universal filler; replace with a specific claim
  • Three long sentences in a row — break the rhythm
  • Vague conclusions ("This has many applications") — name the specific application
  • Hollow encouragement ("Great job!", "Well done!") — the content itself is the reward

REFERENCE FEEL:
  • Apple keynote — clarity, rhythm, one idea lands completely before the next begins
  • Masterclass — specific craft knowledge, respect for the learner's intelligence
  • MIT lecture — rigour, the real mechanism, not the simplified version

ANCHOR SENTENCES — write at this level:
  "Models do not learn all at once. They improve through small, disciplined corrections."
  "This is where the system stops guessing and starts adjusting."
  "The visual matters because it reveals the mechanism, not just the result."
  "You now understand not just what this component does, but why modern AI depends on it."
  "AI doesn't begin with intelligence. It begins with patterns."`.trim();

// ─── Voice Persona Guide — per conductor personality type ───────────────────
// Each persona shares the Three Laws of Voice (universality, clarity, opening rule)
// but adds a distinct sentence rhythm, structural approach, and banned patterns.
// The active persona is injected into expandLesson() instead of the generic guide.

const VOICE_PERSONA_BASE = `
THE THREE LAWS OF VOICE (apply to every sentence):
  1. UNIVERSALITY TEST: If this sentence could appear in ANY course on ANY topic, rewrite it. Every sentence must be specific to THIS concept.
     BAD: "AI is transforming industries."  GOOD: "Railway operators using predictive maintenance cut unplanned downtime by 30–40% — not by reacting faster, but by not needing to react at all."
  2. CLARITY LAW: If a sentence sounds clever but is harder to understand, simplify it. The test: can a smart person understand this on first read?
     BAD: "Intelligence emerges from structured probabilistic inference across distributed representations."  GOOD: "AI learns by adjusting itself based on data. The more data it sees, the better it adjusts."
  3. OPENING RULE: Every block, section, and paragraph must begin with a THOUGHT, not a label or definition. First sentence = hook.
     BAD: "Transformers are a type of neural network."  GOOD: "The attention mechanism changed everything — not because it was new, but because it was the first design that could hold the whole sentence in mind at once."

ALWAYS: Speak as "you". Lead with the insight, then explain. Earn attention through substance. Prefer specific over general.
NEVER: "In this lesson...", "Let's explore...", "It is important to note...", "As we can see...", hollow encouragement.`.trim();

// ─── Persona Flavour Variants ────────────────────────────────────────────────
// Each of the 6 personas has 4 sub-flavours. Selected by microVariationSeed % 4.
// A flavour keeps all base rules but varies sentence rhythm, structural bias, and signature move.
// This gives 6 × 4 = 24 distinct voice configurations before opening-type variation.

interface PersonaFlavour {
    name: string;
    rhythm: string;
    structure: string;
    signatureMove: string;
}

const PERSONA_FLAVOURS: Record<string, PersonaFlavour[]> = {
    calm: [
        {
            name: 'Minimal',
            rhythm: 'Hard 20-word cap per sentence. Short declarative chains: "X does Y. Y produces W." No filler.',
            structure: 'State mechanism first. Implication second. One idea fully expressed, then stop. Paragraph max: 3 sentences.',
            signatureMove: 'COMPRESSION MOVE: Once per lesson, reduce a complex idea to its irreducible two-sentence form. No lead-in, no qualification.',
        },
        {
            name: 'Analytical',
            rhythm: 'Measured, deliberate pacing. Each sentence dissects one component. Build bottom-up: parts → interaction → whole.',
            structure: 'Name the parts. Explain how each part works. Show how the parts connect. Never skip a step.',
            signatureMove: 'DISSECTION MOVE: Once per lesson, break one concept into its exact components in sequential numbered form: "First: X. Second: Y. Third: Z."',
        },
        {
            name: 'Sequential',
            rhythm: 'Numbered logic chains. "Step 1: X. Step 2: Y. Step 3: Z." Each step is one sentence, complete in itself.',
            structure: 'Process always before implication. Show the exact sequence of operations. No jumps — every transition is explicit.',
            signatureMove: 'CHAIN MOVE: Once per lesson, trace a complete chain of cause and effect from first input to final output, one step per sentence.',
        },
        {
            name: 'Interrogative',
            rhythm: 'State a claim. Follow immediately with the mechanism that explains it. Rhythm: assertion → mechanism → implication.',
            structure: 'Reverse-engineer from outcomes. Start with what happens. Work backwards to why it happens. Then explain when it breaks.',
            signatureMove: 'REVERSAL MOVE: Once per lesson, start with the surprising output ("The result is X") and work backwards to explain the mechanism that produces it.',
        },
    ],

    electric: [
        {
            name: 'Contrast',
            rhythm: 'Hard contrast per block. "X is wrong. Y is right." Short-long alternation. Never three sentences of equal length.',
            structure: 'Every block is a flip. Wrong assumption → correct mechanism. Use contrast as the primary teaching device.',
            signatureMove: 'FLIP MOVE: Once per lesson, use exact parallel structure: "Not this. [Short sentence]. That. [Longer explanation]."',
        },
        {
            name: 'Stakes',
            rhythm: 'Raise stakes in every block. What breaks? What\'s missed? Urgency through consequence, not exclamation.',
            structure: 'Consequence-first teaching. Lead with what fails when this concept is misunderstood. Then explain the correct understanding.',
            signatureMove: 'COST MOVE: Once per lesson, name the exact real-world cost of not understanding this concept. Specific system, specific failure mode.',
        },
        {
            name: 'Momentum',
            rhythm: 'Build like a wave. Short sentence. Slightly longer. Then the insight. Then one short stop. Repeat.',
            structure: 'Momentum through accumulation. Each sentence adds one more piece. Land the insight at the peak. Short sentence to seal it.',
            signatureMove: 'CRESCENDO MOVE: Once per lesson, build exactly 4 sentences to a single hard-stop insight. Sentences 1-3 build; sentence 4 lands.',
        },
        {
            name: 'Surprise',
            rhythm: 'Lead with the most counterintuitive fact. Let it sit for one sentence. Then explain why it\'s true.',
            structure: 'Surprise → pause → explanation. The counterintuitive fact is not the punchline — it\'s the opening. Explanation is the resolution.',
            signatureMove: 'SURPRISE MOVE: Once per lesson, open a block with the most counterintuitive fact about this concept. One word sentence follows: "Seriously." Then explain.',
        },
    ],

    cinematic: [
        {
            name: 'Epic',
            rhythm: 'Wide-angle opening sentence. Establish the stakes, the era, the forces at play. Zoom in sentence by sentence.',
            structure: 'Macro → micro. Open with the biggest frame possible. Narrow to the specific mechanism. Close on what this enables.',
            signatureMove: 'SCALE MOVE: Once per lesson, write one sentence that frames this concept against the broadest possible stakes — civilisational, industrial, or historical.',
        },
        {
            name: 'Intimate',
            rhythm: 'Close-lens writing. Small observations, not grand pronouncements. Write as if speaking to one specific person.',
            structure: 'Personal frame first. "Here\'s what this actually looks like from the inside." Then the mechanism. Then the implication for that one person.',
            signatureMove: 'CLOSE-UP MOVE: Once per lesson, write one paragraph that describes this concept as if observed from 10cm away — hyper-specific, no abstraction.',
        },
        {
            name: 'Documentary',
            rhythm: 'Evidence-first. Every claim is grounded in a real case, a real number, a real system. No claim without anchor.',
            structure: 'Real event → mechanism → principle. Build argument from observed evidence, never from assertion.',
            signatureMove: 'EVIDENCE MOVE: Once per lesson, open a block with a specific documented event, date, or statistic that directly demonstrates this concept.',
        },
        {
            name: 'Dramatic',
            rhythm: 'Tension-focused. Build each block to a peak: grounded opening → introduced tension → resolved insight.',
            structure: 'Every block has a before/after. State the limitation or problem. Introduce the concept as the resolution. Show what changed.',
            signatureMove: 'BEFORE/AFTER MOVE: Once per lesson, use exact structure: "[Before this concept existed]: X. [After it existed]: Y. [The difference]: Z."',
        },
    ],

    technical: [
        {
            name: 'Code-First',
            rhythm: 'Lead with implementation. What the code/system does before what it means. Conceptual framing follows, never precedes.',
            structure: 'Interface → implementation → consequence. Name the API or operation first. Then explain what it does internally. Then the implication.',
            signatureMove: 'IMPLEMENTATION MOVE: Once per lesson, ground an abstract concept in its exact technical expression: "In code, this looks like: [pseudocode or operation]."',
        },
        {
            name: 'Systems',
            rhythm: 'Component-interaction focus. Every concept explained as a component with inputs, outputs, and dependencies.',
            structure: 'Input → transform → output. Name what enters the system. Describe the transformation. Specify what exits. Name the failure modes.',
            signatureMove: 'SYSTEM MAP MOVE: Once per lesson, write one block as pure system description: "Input: X. Process: Y. Output: Z. Fails when: W."',
        },
        {
            name: 'Debugging',
            rhythm: 'Assume something is wrong. What breaks? How do you detect it? Failure modes teach more than success paths.',
            structure: 'Normal path → edge case → failure mode → detection → fix. Treat every concept as something that will eventually need to be debugged.',
            signatureMove: 'FAILURE MOVE: Once per lesson, explicitly name the most common failure mode for this concept, how it manifests, and how to detect it.',
        },
        {
            name: 'Quantitative',
            rhythm: 'Numbers appear in the first sentence of every block. Complexity, dimensions, parameters, rates — lead with the quantity.',
            structure: 'Quantitative anchor → mechanism → scale implication. The number frames the concept. The mechanism explains it. The scale shows why it matters.',
            signatureMove: 'NUMBERS MOVE: Once per lesson, write a sentence that contains at least 3 specific numbers: dimensions, parameters, or performance metrics.',
        },
    ],

    warm: [
        {
            name: 'Empathetic',
            rhythm: 'Anticipate the exact confusion the learner has right now. Name it. Resolve it. Block starts with the learner\'s question.',
            structure: 'Confusion → clarity → capability. Acknowledge the misconception. Replace it with the correct model. Close with what\'s now possible.',
            signatureMove: '"HERE\'S THE THING" MOVE: Once per lesson, use exactly: "Here\'s the thing: [the real understanding, not the textbook version]."',
        },
        {
            name: 'Practical',
            rhythm: 'Real use case first. What does this look like when it actually runs? Mechanism second, theory last.',
            structure: 'Practical anchor → mechanism → why it works that way. Never lead with definition. Lead with usage.',
            signatureMove: 'IN PRACTICE MOVE: Once per lesson, open a block with "In practice, this means..." followed by a specific, concrete scenario.',
        },
        {
            name: 'Discovery',
            rhythm: 'Invite thinking before explaining. "You might expect X. Here\'s what actually happens." Discovery, not delivery.',
            structure: 'Prediction → reveal → explanation. State what most people would predict. Show the actual result. Explain why the reality differs.',
            signatureMove: 'PREDICT/REVEAL MOVE: Once per lesson, write: "You\'d expect [X]. The actual result is [Y]. The reason is [Z]."',
        },
        {
            name: 'Affirming',
            rhythm: 'Build capability through accumulation. Each block adds one layer. Sentences are medium length, conversational.',
            structure: 'Capability audit. End every block with one sentence that names what the learner can now do or understand that they couldn\'t before.',
            signatureMove: 'CAPABILITY MOVE: Once per lesson, end a block with: "That means you can now [specific concrete thing] — and that\'s not obvious."',
        },
    ],

    stark: [
        {
            name: 'Assertion',
            rhythm: 'Hard 15-word cap. Bold specific claim in sentence 1. Two facts. Done. No softening.',
            structure: 'Claim → evidence → implication. Three sentences is a complete block. Four is generous. Five is padding.',
            signatureMove: 'BLUNT MOVE: Once per lesson, write a 3-sentence block where sentence 1 is a claim, sentence 2 is the proof, sentence 3 is the consequence. Nothing else.',
        },
        {
            name: 'Correction',
            rhythm: 'Assume a wrong belief. Name it. Correct it. One sentence each. Move on.',
            structure: 'Wrong belief → correct belief → why the correction matters. Never mock. Just replace.',
            signatureMove: 'CORRECTION MOVE: Once per lesson, write: "The common explanation says [wrong version]. It doesn\'t. [Correct version]."',
        },
        {
            name: 'Deconstruction',
            rhythm: 'Take the conventional explanation apart. Show why it\'s incomplete. Give the accurate version. Still under 15 words per sentence.',
            structure: 'Conventional view → flaw in conventional view → accurate view. Never build on a flawed foundation.',
            signatureMove: 'DECONSTRUCT MOVE: Once per lesson, name one widely-used simplification of this concept and explain exactly where it breaks down.',
        },
        {
            name: 'Compressed',
            rhythm: 'Maximum 12 words per sentence. Subject. Verb. Object. Full stop. No exceptions.',
            structure: 'One idea per sentence. One sentence per idea. White space does the work that words would waste.',
            signatureMove: 'COMPRESSION MOVE: Once per lesson, reduce the single most important idea of this lesson to exactly one sentence of 10 words or fewer.',
        },
    ],
};

// ─── Opening Type Instructions ────────────────────────────────────────────────
// These mandate the exact pattern for the first sentence of the hook block.
// The openingType is selected by the conductor and tracked in memory to prevent repeats.

const OPENING_TYPE_INSTRUCTIONS: Record<string, string> = {
    question: `MANDATORY OPENING — QUESTION:
  Your hook block's FIRST SENTENCE must be a single direct question that the learner cannot ignore.
  The question must be unanswerable without the knowledge this lesson teaches.
  The SECOND sentence must begin answering it immediately — no build-up.
  GOOD: "Why does the same prompt produce wildly different outputs? The answer is in the probability distribution, not the model."
  BAD: "Have you ever wondered about AI?" (too vague, answerable without the lesson)`,

    contradiction: `MANDATORY OPENING — CONTRADICTION:
  Your hook block's FIRST SENTENCE must state something the learner probably believes is true.
  The SECOND sentence must directly contradict or complicate it.
  GOOD: "Neural networks learn from examples. Except they don't — they adjust weights based on error signals, which is not the same thing."
  BAD: "Many people think AI is just pattern matching." (vague, not a real contradiction)`,

    scenario: `MANDATORY OPENING — SCENARIO:
  Your hook block's FIRST SENTENCE must place the learner in a specific, concrete situation.
  It must be a real operational scenario, not a hypothetical.
  GOOD: "Your recommendation engine just served the same product to 10,000 users and converted 0.3% of them."
  BAD: "Imagine you're building an AI system." (too generic, not grounded)`,

    stat: `MANDATORY OPENING — STATISTIC:
  Your hook block's FIRST SENTENCE must be a specific, verifiable number, percentage, or measurable fact.
  The number must directly illustrate the importance or scale of this lesson's concept.
  GOOD: "GPT-4 has 1.76 trillion parameters — but 85% of them are inactive for any given token."
  BAD: "AI is growing rapidly." (not a statistic, not specific)`,

    bold_claim: `MANDATORY OPENING — BOLD CLAIM:
  Your hook block's FIRST SENTENCE must be a blunt, confident assertion that challenges default thinking.
  It must be specific enough that a knowledgeable person would want to debate or verify it.
  GOOD: "The most important AI paper of the last decade wasn't about a new model. It was about why existing models were failing."
  BAD: "AI is changing everything." (too vague, no challenge, no specificity)`,
};

function getPersonaVoiceGuide(personality: string, seed: number = 0, openingType: string = 'bold_claim'): string {
    const key = personality?.toLowerCase();
    const flavours = PERSONA_FLAVOURS[key];
    const openingInstruction = OPENING_TYPE_INSTRUCTIONS[openingType] ?? OPENING_TYPE_INSTRUCTIONS.bold_claim;

    if (!flavours) {
        // Fall back to the global guide if personality not recognised
        return LESSON_VOICE_GUIDE + '\n\n' + openingInstruction;
    }

    const flavour = flavours[seed % 4];

    return `LESSON VOICE — PERSONA: ${key.toUpperCase()} / ${flavour.name.toUpperCase()}
${VOICE_PERSONA_BASE}

SENTENCE RHYTHM:
  ${flavour.rhythm}

STRUCTURAL APPROACH:
  ${flavour.structure}

SIGNATURE MOVE (use exactly once in this lesson — do not overuse):
  ${flavour.signatureMove}

${openingInstruction}

BANNED for all personas: "In this lesson...", "Let's explore...", "It is important to note...", "As we can see...", "There is", "It is", hollow encouragement, vague conclusions.`;
}

// ─── Block schema documentation per block type ──────────────────────────────
function getBlockSchemaDoc(blockRef: string): string {
    const [type, variant] = blockRef.split(':');
    const schemas: Record<string, string> = {
        'type_cards:grid':       'type_cards grid — 3–4 cards for factual orientation. layout: "grid". Each card: badge, badgeColour (pulse|iris|amber), title, description (2 sentences MAX (~60 words): first sentence states what this is, second sentence states why it matters — no padding), imagePrompt (1–2 sentences: subject, setting, mood — will be enriched later).',
        'type_cards:numbered':   'type_cards numbered — 3–4 cards breaking topic into parts. layout: "numbered". Each card: badge, badgeColour, title, description (2 sentences MAX (~60 words): first sentence states what this is, second sentence states why it matters — no padding).',
        'type_cards:horizontal': 'type_cards horizontal — COMPARISON of 2 things. layout: "horizontal". 2–3 cards only. Each card: title, description (2 sentences MAX (~60 words): first sentence states what this is, second sentence states why it matters — no padding).',
        'type_cards:bento':      'type_cards bento — freeform supplemental cards. layout: "bento". 3–4 cards, each with badge, title, description (2 sentences MAX (~60 words): first sentence states what this is, second sentence states why it matters — no padding), imagePrompt (1–2 sentences: subject, setting, mood).',
        'instructor_insight':    'instructor_insight — EXACTLY 3 insight cards. REQUIRED fields: id (string), insights (array of EXACTLY 3 objects, each with: emoji (single emoji), title (bold 3–5 word phrase), body (1–2 sentences — a single specific insight, not a definition)). DO NOT use fields named "heading", "videoUrl", "cards", or "items" — the array field is called "insights".',
        'flow_diagram:steps':    'flow_diagram steps — linear process (3–6 steps). title, steps[]{label, description, colour}, explanation (2–3 sentences interpreting what the flow reveals — the conclusion the learner should draw).',
        'flow_diagram:contrast': 'flow_diagram contrast — before/after. title, contrast{ labelA, labelB, stepsA[], stepsB[], middleNode, outcomeA, outcomeB }, explanation (2–3 sentences interpreting what the contrast reveals).',
        'mindmap':               'mindmap — central node + 4–6 branch concepts.',
        'concept_illustration':  'concept_illustration — visual metaphor. concept, description, imagePrompt (1–2 sentences: subject, style, mood), style: network|layers|cycle|hierarchy.',
        'image_text_row':        'image_text_row — image left, text right. imagePrompt (1–2 sentences: subject, setting, mood), label, title, text (minimum 4 substantive sentences: (1) what this visual shows and why it was chosen, (2) the key mechanism or insight it reveals, (3) what the learner should infer, (4) a concrete practical implication), reverse: false.',
        'image_text_row:reverse':'image_text_row reversed — text left, image right. reverse: true. imagePrompt (1–2 sentences: subject, setting, mood), label, title, text (minimum 4 substantive sentences as above).',
        'prediction':            'prediction — knowledge check. REQUIRED fields: id (string), question (string), options (array of EXACTLY 3 plain strings — no objects), correctIndex (0, 1, or 2 — integer), reveal (string, 1–2 sentences explaining why the correct answer is right), accentColour ("pulse"|"iris"|"amber"|"nova"). ALL 5 fields are mandatory.',
        'applied_case':          'applied_case — 3 real-world scenarios as tabs. REQUIRED fields: id (string), tabs (array of EXACTLY 3 objects). Each tab MUST include ALL of: id (string), label (string, 2–4 words), scenario (string, 2 sentences: real organisation + specific situation), challenge (string, 2 sentences: the specific constraint or problem they faced), resolution (string, 2 sentences: how applying this lesson\'s concept solved it). NEVER omit scenario, challenge, or resolution — they are all mandatory.',
        'industry_tabs':         'industry_tabs — 4–5 industry use-case tabs. heading, tabs[]{ id, label, imagePrompt (1–2 sentences: subject, setting, mood), imageCaption, scenarioTitle, scenarioBody }.',
        'callout:warning':       'callout warning — variant: "warning", title, text.',
        'callout:tip':           'callout tip — variant: "tip", title, text.',
        'open_exercise':         'open_exercise — practice activity. instruction, weakPrompt, scaffoldLabels, modelAnswer.',
        'interactive_vis':       'interactive_vis — data visualisation. title, intro, description, codeSnippet, vizType: chart|flowchart|architecture.',
        'text:bridge':           'text (bridge/transition) — 1–3 paragraphs only. heading, paragraphs[].',
        'video_snippet':          'video_snippet — AI-generated cinematic clip. REQUIRED fields: type, id, title, caption, videoPrompt (EXACTLY 5 SENTENCES motion-arc structure — S1: lesson concept + title, S2: visible objects/interfaces, S3: start→change→end motion arc, S4: camera + environment, S5: exclusions + fidelity target), description (EXACTLY 2 SENTENCES: S1 what the viewer will see, S2 why it matters for this lesson), video_search_query (3-5 words), duration: "8s".',
        'go_deeper':             'go_deeper — advanced accordion. triggerText, content (2–3 paragraphs).',
        'lesson_header':         'lesson_header — hero section. REQUIRED fields: title (string), tag (2–3 word category label), duration (e.g. "15 min"), difficulty (Beginner|Intermediate|Advanced), heroType: "interactive", heroPrompt (1–2 sentences: visual subject and mood for the hero background), description (1–2 sentence lesson overview), objectives (array of 4 short strings each starting with a verb).',
        'objective':             'objective — single learning objective card. REQUIRED fields: label (short label e.g. "Learning Objective"), text (EXACTLY 3 sentences — S1: starts with "By the end of this lesson you will be able to…", S2: why this capability matters in real-world practice, S3: what mental model or skill this builds).',
        'punch_quote':           'punch_quote — full-width bold statement. REQUIRED fields: quote (one punchy declarative sentence, 10–20 words, no quotation marks), accent (pulse|iris|amber|nova).',
        'recap':                 'recap — end-of-lesson summary. REQUIRED fields: id (string), title (string, e.g. "If you remember only three things…"), items (array of EXACTLY 4 objects). Each item MUST include: title (4–6 words, a bold takeaway phrase), body (EXACTLY 2 sentences — S1: why this matters, S2: what it enables). The array field is called "items" — NEVER use "points", "bullets", or "cards".',
        'key_terms':             'key_terms — glossary. REQUIRED fields: terms (array of MINIMUM 12 objects each with: term (string), definition (EXACTLY 2 sentences — first sentence defines the term precisely, second sentence explains where it appears or why it matters)).',
        'completion':            'completion — lesson complete card. REQUIRED fields: summary (1–2 sentences synthesising the core lesson insight in the learner\'s own growth terms — what they can now see or do that they could not before), skillsEarned (array of 3 strings, 8–12 words each, start with an action verb), nextStep (1 forward-pointing sentence naming what the learner can explore or apply next).',
        'quiz':                  'quiz — knowledge check. REQUIRED fields: id (string), title (string, e.g. "Test Your Understanding"), questions (array of EXACTLY 3 objects). Each question MUST include ALL of: question (string), options (array of EXACTLY 3 strings), correctIndex (0, 1, or 2 — integer), correctFeedback (string, 1 sentence confirming why), incorrectFeedback (string, 1 sentence explaining what was missed). The "title" field is mandatory — never omit it.',
        'full_image':            'full_image — wide visual. REQUIRED fields: imagePrompt (MINIMUM 1000 WORDS ultra-detailed), caption (1–2 sentences), explanation (2–3 sentences INTERPRETING what the visual reveals — not describing what is visible), layout ("split" when explanation present, "hero" for standalone atmosphere images).',
    };
    return schemas[blockRef] || schemas[type] || `${type} block — include all required fields.`;
}

// ─── 2. Lesson Expander Agent (Pool-Based Diversity Generator V3) ─────────────
export class LessonExpanderAgent extends BaseAgentV2 {
    async expandLesson(lesson: any, moduleContext: any, courseContext: any, retrievedChunks: any[] = [], lessonNumber: number = 1, courseState: CourseState | null = null, dnaContent: CourseDNA["content"] | null = null, rhythmDirective: string = '', lessonPersonality: string = 'warm', microVariationSeed: number = 0, openingType: string = 'bold_claim'): Promise<ConceptExplanation> {
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
        const { chosenBlocks: initialBlocks, heroType, recapStyle, quizFirst, videoIndices, heroPattern, lessonMode, purposeSequence, diagramArchetype } = blueprint;

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
            `[BLOCK-${middleBlocks.length + 5}] text — FOUNDATION: ${getBlockSchemaDoc('text')} Write 2–3 paragraphs (2 sentences each) that consolidate the lesson's core ideas and prepare the learner for the next topic.`,
            `[BLOCK-${middleBlocks.length + 6}] recap — style: "${recapStyle}"`,
            `[BLOCK-${middleBlocks.length + 7}] quiz — EXACTLY 3 questions`,
            `[BLOCK-${middleBlocks.length + 8}] key_terms`,
            `[BLOCK-${middleBlocks.length + 9}] completion`,
        ];

        const unifiedBlueprint = [...ironBefore, ...middleBlocks, ...ironAfter].join('\n');

        const ironCoreCount = 10;
        const totalTarget = ironCoreCount + finalBlocksWithVideos.length + (isBeginner ? 2 : isAdvanced ? 4 : 3);
        const temperature = Math.min(0.7 + (lessonNumber - 1) * 0.04, 1.0);

        const flavourIndex = microVariationSeed % 4;
        const flavourName = PERSONA_FLAVOURS[lessonPersonality?.toLowerCase()]?.[flavourIndex]?.name ?? '?';
        console.log(`[LessonExpander] Lesson ${lessonNumber} — ${lessonPersonality}/${flavourName} — opening: ${openingType} — seed: ${microVariationSeed} — "${lesson.lessonTitle}"`);
        const rhythmPrefix = rhythmDirective ? `${rhythmDirective}\n\n---\n\n` : '';
        const prompt = rhythmPrefix + UNIVERSAL_LESSON_SPEC + `SYSTEM: You are an elite UK instructional designer. Lesson ${lessonNumber} of this course.
LESSON: "${lesson.lessonTitle}"
OBJECTIVE: ${lesson.microObjective}
DIFFICULTY: ${difficulty}
COURSE PERSONALITY: ${dnaContent?.writing_style ?? 'Clear, expert, no filler words.'}
EXAMPLE STYLE: ${dnaContent?.example_bias ?? 'real_world_first'}
QUESTION TONE: ${dnaContent?.question_tone ?? 'socratic'}
NARRATIVE: "${structureName}"
LESSON MODE: ${lessonMode}
PURPOSE SEQUENCE: ${purposeSequence}
DIAGRAM ARCHETYPE: ${diagramArchetype} — all flow_diagram and comparison blocks in this lesson must use this reasoning pattern
TONE: ${toneName} (${toneChars})

LESSON BLUEPRINT — TOTAL BLOCKS: ${unifiedBlueprint.split('\n').length}
${unifiedBlueprint}

VISUAL ACCURACY — ABSOLUTE LAW:
>>> IMAGE PROMPTS (imagePrompt fields) MUST BE EXACTLY 3-4 HIGHLY DETAILED SENTENCES of technical blueprint following the 6-part formula below. DO NOT EXCEED 100 WORDS PER PROMPT.
>>> VIDEO PROMPTS (videoPrompt fields) MUST BE EXACTLY 5 SENTENCES using the motion-arc structure: S1 names the lesson concept and lesson title, S2 describes visible objects/interfaces, S3 describes the motion arc (start state → transformation → end state), S4 describes camera movement and environment, S5 states exclusions and fidelity target.
>>> TEXT BLOCK PARAGRAPHS (paragraphs[] fields): 2 sentences per paragraph, MAX 3 paragraphs per text block. Substantive and precise — no padding. Each paragraph = one clear idea.
>>> Captions, titles, labels, and single-line fields must be CONCISE (under 50 words) to stay within token limits.
>>> YOU MUST GENERATE TWO (2) VIDEO SNIPPETS: One at [BLOCK-4] and one at [BLOCK-X] as labeled in the blueprint.
>>> NEVER use analogies or metaphors (no kitchens, gardens, pottery, or simple "city" metaphors).
>>> USE 6-PART TECHNICAL FORMULA FOR PROMPTS:
    1. GEOMETRY: Precise shapes, wireframes, vertices, architectural layouts.
    2. PHYSICS: Refractive indices, subsurface scattering, material properties (metal, silicon).
    3. LITE & OPTICS: Specific lighting (rim, three-point), 35mm focal length.
    4. DATA VISUALISATION: Literal tensors, weight matrices, code streams, signal noise.
    5. MOTION (Video-only): Frame-by-frame camera movement (pan/tilt/zoom), temporal shifts.
    6. PEDAGOGICAL ALIGNMENT: Direct literal mapping to the lesson objective ID.
>>> ABSTRACT TOPICS (ethics, policy, bias, fairness, regulation, alignment, safety, governance): Image prompts MUST reference concrete physical objects and real-world scenes — not symbols or metaphors. SHOW: a data scientist reviewing bias metrics on a laptop screen, a regulatory document with highlighted clauses, a court room or compliance office, engineers reviewing a fairness dashboard with actual chart elements visible, a facial recognition error on a physical interface, side-by-side dataset distributions as visible bar charts. DO NOT show: scales of justice, glowing brains, abstract "balance" metaphors, hands holding orbs, or any symbolic representation that doesn't appear in real life.
>>> BE LITERAL. BE ACCURATE. BE TECHNICAL.

${getPersonaVoiceGuide(lessonPersonality, microVariationSeed, openingType)}

${SECTION_PURPOSE_RULES}

${LESSON_QUALITY_RULES}

${BANNED_WORDS_INSTRUCTION}

REQUIRED OUTPUT JSON STRUCTURE:
{
  "videoScript": { ... },
  "blocks": [ ... ],
  "lesson_number": ${lessonNumber},
  "analogy_domain": "${domainStr}",
  "structure_pattern": "${structureName}"
}`;

        let messages: any[] = [{ role: 'user', content: prompt }];
        const makeRequestWithTemp = async (msgs: any[], concise = false) => {
            const fetchMessages = msgs;
            if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is missing");
            const response = await fetch(`${OPENROUTER_URL}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000'
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: fetchMessages,
                    temperature,
                    max_tokens: 8000,
                    provider: { sort: "throughput" },
                    response_format: { type: "json_object" }
                })
            });
            const data = await response.json();
            const finishReason = data.choices?.[0]?.finish_reason;
            const text = data.choices?.[0]?.message?.content;
            if (!text) {
                const reason = finishReason || 'empty_response';
                throw new Error(`OpenRouter returned no content (reason: ${reason}, status: ${response.status})`);
            }
            if (finishReason === 'length') {
                throw Object.assign(new Error(`Output truncated (MAX_TOKENS) — lesson JSON exceeded model output limit`), { code: 'MAX_TOKENS' });
            }
            // Strip bare control characters that API occasionally embeds unescaped inside
            // JSON strings, causing SyntaxError on parse. Covers:
            //   0x00–0x09, 0x0B, 0x0C, 0x0E–0x1F — non-printable control chars incl. tab (0x09)
            //   0x0A (\n), 0x0D (\r) — literal newlines inside string values (illegal in JSON)
            const sanitized = text
                .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, ' ')
                .replace(/\n/g, ' ')
                .replace(/\r/g, ' ');
            try {
                return JSON.parse(sanitized);
            } catch (_firstErr) {
                // Second chance: structural repair (missing commas, trailing commas, unquoted keys, etc.)
                try {
                    return JSON.parse(jsonrepair(sanitized));
                } catch (parseErr: any) {
                    parseErr.rawText = sanitized; // attach so retry loop can feed it back to OpenRouter
                    throw parseErr;
                }
            }
        };

        // Minimal fallback prompt — defined here so it's accessible in all catch paths
        const minimalBlocks = ['lesson_header', 'objective', 'video_snippet', 'text', 'type_cards:grid', 'video_snippet', 'recap', 'quiz', 'key_terms', 'completion'];
        const minimalPrompt = `You are an instructional designer. Generate a complete lesson JSON for:
LESSON: "${lesson.lessonTitle}"
OBJECTIVE: ${lesson.microObjective}

Use EXACTLY these blocks in order: ${minimalBlocks.join(', ')}.

HARD LIMITS:
- type_cards: 3 cards, each description MAX 50 words
- text paragraphs: MAX 2 sentences each, MAX 2 paragraphs
- recap: EXACTLY 4 items with title + body (2 sentences)
- quiz: EXACTLY 3 questions
- key_terms: EXACTLY 8 terms
- completion: title, summary (1 sentence), skillsEarned (3 items), closingLine (1 sentence), nextStep (1 sentence)
- image prompts: MAX 3 sentences

OUTPUT: valid complete JSON only. No truncation.`;

        const runMinimalFallback = async (reason: string): Promise<any> => {
            console.warn(`[LessonExpander] ⚠️ ${reason} — rebuilding minimal prompt`);
            try {
                const result = await makeRequestWithTemp([{ role: 'user', content: minimalPrompt }]);
                console.log(`[LessonExpander] ✅ Minimal fallback succeeded for "${lesson.lessonTitle}"`);
                return result;
            } catch (retryErr: any) {
                console.error(`[LessonExpander] ❌ Minimal fallback also failed:`, retryErr.message);
                throw new Error(`Lesson "${lesson.lessonTitle}" could not be generated within the model output limit after all fallbacks`);
            }
        };

        let attempts = 0;
        let lastValidResult: any = null;
        while (attempts < 3) {
            try {
                const result = await makeRequestWithTemp(messages);
                if (!courseState) return result;
                const validation = CourseValidator.validateUniqueness({ ...result, lesson_number: lessonNumber, analogy_domain: result.analogy_domain || domainStr, structure_pattern: structureName, scenes: result.blocks }, courseState);
                if (validation.passed) return result;
                // Keep last result in case all retries fail — better than nothing
                lastValidResult = result;
                messages.push({ role: 'assistant', content: JSON.stringify(result) });
                messages.push({ role: 'user', content: `Rejection: ${validation.failures.join(', ')}. FIX ALL. REMEMBER: Image prompts MUST BE EXACTLY 3-4 HIGHLY DETAILED SENTENCES. DO NOT EXCEED 100 WORDS PER PROMPT. Video prompts MUST follow the 5-sentence motion-arc structure (S1 names lesson concept + title, S2 visible objects, S3 start→change→end, S4 camera, S5 exclusions).` });
            } catch (e: any) {
                if (e?.code === 'MAX_TOKENS') {
                    return await runMinimalFallback(`Output truncated on attempt ${attempts + 1}`);
                } else if (e instanceof SyntaxError) {
                    console.error("Retry error", e);
                    const rawText = (e as any).rawText;
                    if (rawText) {
                        messages.push({ role: 'model', parts: [{ text: rawText }] });
                        messages.push({ role: 'user', parts: [{ text: `Your previous response contained a JSON syntax error: "${e.message}". This is usually caused by unescaped special characters or truncated strings. Regenerate the complete lesson JSON with valid, well-formed JSON — ensure all string values have properly escaped characters.` }] });
                    }
                } else {
                    console.error("Retry error", e);
                }
            }
            attempts++;
        }

        // All uniqueness retries exhausted — accumulated messages are too large for a safe 4th attempt.
        // Use the last generated result if available (uniqueness issues are minor vs. a full rollback),
        // otherwise fall back to the minimal prompt.
        if (lastValidResult) {
            console.warn(`[LessonExpander] ⚠️ All uniqueness retries failed for "${lesson.lessonTitle}" — using last generated result`);
            return lastValidResult;
        }
        // No successful generation at all — try minimal prompt as last resort
        return await runMinimalFallback('All retries failed, no usable result');
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
    
    async processLesson(lessonPlan: any, moduleContext: any, courseContext: any, lessonNumber: number = 1, courseState: CourseState | null = null, dnaContent: CourseDNA["content"] | null = null, rhythmDirective: string = '', lessonPersonality: string = 'warm', microVariationSeed: number = 0, openingType: string = 'bold_claim'): Promise<ConceptExplanation> {
        return await this.expander.expandLesson(lessonPlan, moduleContext, courseContext, [], lessonNumber, courseState, dnaContent, rhythmDirective, lessonPersonality, microVariationSeed, openingType);
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
