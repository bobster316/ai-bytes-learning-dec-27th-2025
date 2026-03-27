/**
 * test-generate-lesson.mjs
 * Standalone script to test V2 LessonExpanderAgent block generation.
 * Run with: node scripts/test-generate-lesson.mjs
 *
 * Generates one lesson, prints block types + count, saves full output to tmp-test-lesson.json
 */

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load env from .env.local
function loadEnv() {
    try {
        const envFile = readFileSync(join(rootDir, '.env.local'), 'utf8');
        for (const line of envFile.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eq = trimmed.indexOf('=');
            if (eq === -1) continue;
            const key = trimmed.slice(0, eq).trim();
            const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) process.env[key] = val;
        }
    } catch (e) {
        console.error('Could not load .env.local:', e.message);
    }
}

loadEnv();

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function sanitizeJson(text) {
    let json = text;
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        json = text.substring(firstBrace, lastBrace + 1);
    }
    json = json.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    let sanitized = '';
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
            else sanitized += char;
        } else {
            sanitized += char;
        }
    }
    sanitized = sanitized.replace(/,\s*([\]\}])/g, '$1');
    return sanitized;
}

async function generateLesson(lessonTitle, microObjective) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not found in .env.local');

    const prompt = buildPrompt(lessonTitle, microObjective);

    console.log(`\n🔮 Calling Gemini API for: "${lessonTitle}"\n`);
    const start = Date.now();

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json',
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API ${response.status}: ${err.slice(0, 300)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    console.log(`✅ Response received in ${((Date.now() - start) / 1000).toFixed(1)}s`);

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch {
        try {
            parsed = JSON.parse(sanitizeJson(text));
        } catch (e2) {
            throw new Error('Could not parse JSON response: ' + e2.message);
        }
    }

    return parsed;
}

function buildPrompt(lessonTitle, microObjective) {
    return `SYSTEM: You are an elite instructional designer producing a SINGLE LESSON object.

CRITICAL: Do NOT produce a markdown essay. Produce an array of typed blocks that map directly to UI components. The lesson should feel like an interactive magazine, NOT a textbook.

BLOCK TYPES AVAILABLE (use a mix — variety is key):
- "lesson_header": Tag, title, duration, difficulty.
- "objective": Learning objective statement
- "text": Short prose section (2-3 sentence paragraphs, heading optional)
- "full_image": Full-width image with caption
- "image_text_row": Side-by-side image + text (use reverse:true to alternate)
- "type_cards": 2-3 cards for comparing concepts
- "callout": Tip or warning box
- "industry_tabs": Tabbed real-world examples across industries
- "quiz": Inline knowledge check (3 questions)
- "key_terms": Glossary of 4-6 terms
- "completion": Clean lesson-end card showing 3 skills learned and a "Next Lesson →" CTA. No XP, no confetti.
- "interactive_vis": Interactive chart/code visualization
- "applied_case": A real-world scenario, challenge, and resolution
- "recap": Summary: "If you remember only three things..."
- "go_deeper": Expandable accordion for advanced detail
- "video_snippet": Cinematic 8-second video clip
- "punch_quote": Bold typographic statement — under 20 words
- "prediction": Inline mid-lesson question. Schema: { "type": "prediction", "question": "string", "options": ["string", "string", "string"], "correctIndex": 0|1|2, "reveal": "Full explanation string", "accentColour": "iris" }
  NOTE: options MUST be a plain array of 3 strings. correctIndex is 0, 1, or 2. Do NOT use letter/isCorrect objects.
- "mindmap": SVG concept map — central node + 4-6 branches
- "flow_diagram": Left-to-right process diagram (steps or contrast mode)
- "open_exercise": "Your Turn" active practice with 4 scaffold inputs

CRITICAL RULES:
1. Start with "lesson_header" block.
2. Second is the "objective" block.
3. Third: a foundation "text" block — 3-4 paragraphs. ONLY text block allowed to be this long.
4. ALL subsequent text blocks: 1-3 short paragraphs MAX. 2-3 sentences each.
5. Use a "full_image" after the foundation text, before the video snippet.
6. Alternate: text → visual → text → interaction.
7. Include at least 4-5 "callout" blocks spread throughout.
8. Include EXACTLY 2-4 "interactive_vis" blocks with REAL code/JSON in codeSnippet.
9. Include EXACTLY 1 "applied_case".
10. Include EXACTLY 1 "industry_tabs" (4-5 industries).
11. Include "videoScript" at root of JSON (not inside blocks).
12. Include EXACTLY 1 "video_snippet" block early as visual hook.
13. End core content with EXACTLY 1 "recap".
14. Finish with "quiz" (3 questions IN ONE BLOCK), then "key_terms", then "completion".
    NOTE: The quiz MUST be a SINGLE block with a "questions" array containing all 3 questions. Do NOT generate 3 separate quiz blocks.
15. TOTAL BLOCKS: 25-35+.
16. MANDATORY: EXACTLY 1 "punch_quote", 1 "prediction", 1 "mindmap", 1 "flow_diagram", 1 "open_exercise".

QUIZ SCHEMA — ONE block with a questions array:
{ "id": "...", "order": X, "type": "quiz", "title": "Knowledge Check", "questions": [
  { "questionNumber": 1, "totalQuestions": 3, "questionType": "multiple_choice", "questionText": "...", "options": [ { "letter": "A", "text": "...", "isCorrect": false }, { "letter": "B", "text": "...", "isCorrect": true }, { "letter": "C", "text": "...", "isCorrect": false } ], "correctFeedback": "...", "incorrectFeedback": "...", "xpReward": 40 },
  { "questionNumber": 2, "totalQuestions": 3, "questionType": "multiple_choice", "questionText": "...", "options": [ { "letter": "A", "text": "...", "isCorrect": true }, { "letter": "B", "text": "...", "isCorrect": false }, { "letter": "C", "text": "...", "isCorrect": false } ], "correctFeedback": "...", "incorrectFeedback": "...", "xpReward": 40 },
  { "questionNumber": 3, "totalQuestions": 3, "questionType": "multiple_choice", "questionText": "...", "options": [ { "letter": "A", "text": "...", "isCorrect": false }, { "letter": "B", "text": "...", "isCorrect": false }, { "letter": "C", "text": "...", "isCorrect": true } ], "correctFeedback": "...", "incorrectFeedback": "...", "xpReward": 40 }
] }

Write in plain British English. BANNED WORDS: demystify, delve, dive into, leverage, unlock, harness, empower, transformative, seamlessly, deep dive, buckle up, game-changer.

LESSON TITLE: ${lessonTitle}
OBJECTIVE: ${microObjective}

OUTPUT JSON FORMAT:
{
  "videoScript": { "hook": { "duration": 8, "script": "string" }, "totalDuration": 43 },
  "blocks": [ { "id": "blk_001", "order": 1, "type": "...", ... } ],
  "metadata": { "blockCount": 30, "estimatedDuration": 15 }
}`;
}

function printSummary(result) {
    const blocks = result.blocks || [];
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📦 BLOCKS GENERATED: ${blocks.length}`);
    console.log(`${'─'.repeat(60)}`);

    // Count by type
    const typeCounts = {};
    for (const b of blocks) {
        typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
    }
    for (const [type, count] of Object.entries(typeCounts)) {
        const icon = getIcon(type);
        console.log(`  ${icon} ${type.padEnd(25)} × ${count}`);
    }

    console.log(`\n📋 BLOCK SEQUENCE:`);
    blocks.forEach((b, i) => {
        const label = b.heading || b.title || b.quote?.slice(0, 40) || b.question?.slice(0, 40) || '';
        console.log(`  ${String(i + 1).padStart(2, '0')}. [${b.type}] ${label}`);
    });

    // Check mandatory blocks
    console.log(`\n✅ MANDATORY BLOCK CHECKS:`);
    const mandatoryTypes = ['lesson_header', 'objective', 'video_snippet', 'prediction', 'punch_quote', 'mindmap', 'flow_diagram', 'open_exercise', 'recap', 'quiz', 'key_terms', 'completion'];
    let allPassed = true;
    for (const t of mandatoryTypes) {
        const count = typeCounts[t] || 0;
        const pass = count >= 1;
        if (!pass) allPassed = false;
        console.log(`  ${pass ? '✅' : '❌'} ${t.padEnd(20)} (found: ${count})`);
    }

    if (result.videoScript) {
        console.log(`  ✅ videoScript present`);
    } else {
        console.log(`  ❌ videoScript MISSING`);
        allPassed = false;
    }

    console.log(`\n${allPassed ? '🎉 ALL CHECKS PASSED' : '⚠️  SOME CHECKS FAILED'}`);
    console.log(`${'─'.repeat(60)}\n`);
}

function getIcon(type) {
    const icons = {
        lesson_header: '🎯', objective: '🎓', text: '📝', full_image: '🖼️',
        image_text_row: '↔️', type_cards: '🃏', callout: '💡', industry_tabs: '🏭',
        quiz: '❓', key_terms: '📖', completion: '🏁', interactive_vis: '💻',
        applied_case: '🔬', recap: '🔁', go_deeper: '🔍', video_snippet: '🎬',
        punch_quote: '💬', prediction: '🔮', mindmap: '🗺️', flow_diagram: '➡️',
        open_exercise: '✏️', concept_illustration: '🎨', audio_recap_prominent: '🔊',
    };
    return icons[type] || '📦';
}

// ── MAIN ──────────────────────────────────────────────────────
const LESSON_TITLE = 'What Is a Neural Network?';
const MICRO_OBJECTIVE = 'Learner can explain how a neural network learns from examples using weights, layers, and activation functions — without needing any maths background.';

try {
    const result = await generateLesson(LESSON_TITLE, MICRO_OBJECTIVE);
    printSummary(result);

    const outPath = join(rootDir, 'tmp-test-lesson.json');
    writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`💾 Full output saved to: tmp-test-lesson.json`);
} catch (err) {
    console.error('\n❌ Generation failed:', err.message);
    process.exit(1);
}
