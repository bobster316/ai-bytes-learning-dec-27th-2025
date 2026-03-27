/**
 * trim_text_blocks.ts — Micro-learning text trimmer
 *
 * Condenses over-long text/image_text_row blocks back to 1-2 tight paragraphs.
 * Targets blocks with > 800 chars (micro-learning max is ~150-200 words / ~1000 chars).
 *
 * Usage: npx tsx trim_text_blocks.ts
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aysqedgkpdbcbubadrrr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c3FlZGdrcGRiY2J1YmFkcnJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUzOTc5MCwiZXhwIjoyMDc4MTE1NzkwfQ.TLTdqATsMYiSRZM1HziWZ9wYNsPRvfCrYmjg9roP5RM";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genai = new GoogleGenerativeAI(GEMINI_API_KEY);

// Lessons to trim (pilot — can extend to all lessons later)
const LESSON_IDS = ['3568', '3567'];

// Any text block over this length gets trimmed
const MAX_CHARS = 800;

async function condense(text: string, title: string, lessonTitle: string): Promise<string | null> {
    const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are writing content for a MICRO-LEARNING platform. Lessons must be bite-sized.

STRICT RULES:
- Maximum 2 short paragraphs total
- Each paragraph: 2-3 sentences only
- Total word count: 80-120 words maximum
- Tone: expert, direct, no filler words
- No bullet points, no headings — just clean prose
- Preserve the core technical insight, cut everything else

Section title: "${title || 'Untitled'}"
Lesson: "${lessonTitle}"

Existing text to condense:
${text}

Return ONLY the condensed text. No markdown, no extra commentary.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (e: any) {
        console.error('   ❌ Gemini error:', e?.message);
        return null;
    }
}

function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

async function trimLesson(lessonId: string) {
    console.log(`\n📐 Trimming lesson ${lessonId}...`);

    const { data: lesson, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

    if (error || !lesson) {
        console.error(`   ❌ Could not fetch lesson ${lessonId}`);
        return;
    }

    const blocks = lesson.content_blocks as any[];
    let updated = false;

    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.type !== 'text' && b.type !== 'image_text_row') continue;

        const currentText = b.text || b.content || '';
        if (currentText.length <= MAX_CHARS) continue;

        console.log(`   ✂️  Block ${i} | "${b.title || 'untitled'}" | ${currentText.length} chars → trimming`);

        const condensed = await condense(currentText, b.title || '', lesson.title);
        await sleep(500);

        if (condensed && condensed.length > 50 && condensed.length < currentText.length) {
            b.text = condensed;
            b.content = condensed;
            updated = true;
            console.log(`      ✅ ${currentText.length} chars → ${condensed.length} chars`);
            console.log(`      Preview: "${condensed.slice(0, 120)}..."`);
        } else {
            console.log(`      ⚠️  Trim result unusable — keeping original`);
        }
    }

    if (updated) {
        const { error: writeErr } = await supabase
            .from('course_lessons')
            .update({ content_blocks: blocks })
            .eq('id', lessonId);

        if (writeErr) {
            console.error(`   ❌ DB write failed:`, writeErr.message);
        } else {
            console.log(`   🎉 Lesson ${lessonId} saved`);
        }
    } else {
        console.log(`   ✓ No blocks needed trimming`);
    }
}

async function run() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  MICRO-LEARNING TEXT TRIMMER');
    console.log(`  Target: blocks over ${MAX_CHARS} chars → max 1-2 paragraphs`);
    console.log('═══════════════════════════════════════════════════');

    for (const id of LESSON_IDS) {
        await trimLesson(id);
    }

    console.log('\n✅ All lessons trimmed.\n');
}

run().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
