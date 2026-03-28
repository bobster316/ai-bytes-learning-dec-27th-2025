/**
 * Regenerates lesson 3577 only.
 * Deletes the existing record and re-generates with the v2 pipeline so
 * the new sanitizer fixes (compound type names, paragraph splitting) apply.
 */

import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { LessonExpanderAgent } from '../lib/ai/agent-system-v2';
import { sanitizeBlocks } from '../lib/ai/content-sanitizer';
import { CourseStateManager } from '../lib/ai/course-state';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const LESSON_ID_TO_DELETE = 3577;
const TOPIC_ID = 1469;
const COURSE_ID = 834;

const LESSON_PLAN = {
    lessonTitle: 'What Is Attention? The Intuition Behind the Mechanism',
    microObjective: 'Explain the information bottleneck problem in encoder-decoder RNNs, describe attention as a dynamic weighting of encoder states, and trace how attention scores are computed and normalised.',
};

const COURSE_CONTEXT = {
    title: 'Decoding Attention: Mastering Attention Mechanisms in Transformers',
    difficulty: 'Intermediate',
    targetAudience: 'ML practitioners and software engineers learning transformer architectures',
};

const MODULE_CONTEXT = {
    title: 'Decoding Attention Mechanisms in Transformers',
    description: 'Deep dive into how transformer attention mechanisms work under the hood — from intuition to implementation.',
    lessons: [
        { title: LESSON_PLAN.lessonTitle, description: LESSON_PLAN.microObjective },
        { title: 'Self-Attention and Scaled Dot-Product Attention', description: 'Query, Key, Value projections and scaled dot-product attention.' },
        { title: 'Multi-Head Attention and Positional Encoding', description: 'Multi-head attention concatenation and positional encodings.' },
    ],
};

async function main() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const expander = new LessonExpanderAgent();

    // Delete old lesson
    console.log(`Deleting lesson ${LESSON_ID_TO_DELETE}...`);
    const { error: deleteError } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', LESSON_ID_TO_DELETE);
    if (deleteError) {
        console.error('Delete failed:', deleteError.message);
        process.exit(1);
    }
    console.log('Deleted.');

    // Generate
    console.log(`Generating: ${LESSON_PLAN.lessonTitle}`);
    const courseState = CourseStateManager.getState(`course_${COURSE_ID}`, MODULE_CONTEXT.title);

    let lesson;
    try {
        lesson = await expander.expandLesson(
            LESSON_PLAN,
            MODULE_CONTEXT,
            COURSE_CONTEXT,
            [],
            1,          // lesson number 1 in module
            courseState,
            null
        );
    } catch (err) {
        console.error('Expansion failed:', err);
        process.exit(1);
    }

    if (!lesson.blocks || lesson.blocks.length === 0) {
        console.error('No blocks returned — aborting');
        process.exit(1);
    }

    // Sanitize
    const sanitizedBlocks = sanitizeBlocks(lesson.blocks);
    console.log(`Sanitized: ${sanitizedBlocks.length} blocks`);

    // Log block types so we can verify no compound types slipped through
    const types = sanitizedBlocks.map((b: any) => b.type);
    console.log('Block types:', types.join(' → '));

    // Warn on any unrecognised types
    const KNOWN_TYPES = new Set(['lesson_header','objective','text','full_image','image_text_row','type_cards','callout','industry_tabs','quiz','completion','key_terms','applied_case','recap','go_deeper','interactive_vis','video_snippet','audio_recap_prominent','punch_quote','prediction','mindmap','flow_diagram','concept_illustration','open_exercise','instructor_insight']);
    const unknown = types.filter((t: string) => !KNOWN_TYPES.has(t));
    if (unknown.length) console.warn('⚠️  Unknown block types after sanitize:', unknown);
    else console.log('✅ All block types recognised');

    // Check for completion block
    if (!types.includes('completion')) console.warn('⚠️  No completion block — lesson will end abruptly');
    else console.log('✅ completion block present');

    // Check paragraph lengths
    sanitizedBlocks.forEach((b: any) => {
        if (b.type === 'text' && Array.isArray(b.paragraphs)) {
            b.paragraphs.forEach((p: string, i: number) => {
                if (p.length > 400) console.warn(`⚠️  Long para (${p.length} chars) in text block "${b.heading}", para ${i}`);
            });
        }
    });

    // Insert
    const { data: inserted, error: insertError } = await supabase
        .from('course_lessons')
        .insert({
            topic_id: TOPIC_ID,
            title: LESSON_PLAN.lessonTitle,
            content_markdown: '',
            content_html: '',
            content_blocks: sanitizedBlocks,
            order_index: 0,
            estimated_duration_minutes: 12,
        })
        .select('id')
        .single();

    if (insertError) {
        console.error('Insert failed:', insertError.message);
        process.exit(1);
    }

    console.log(`\n✅ New lesson inserted: ID ${inserted.id}`);
    console.log(`   http://localhost:3000/courses/834/lessons/${inserted.id}`);
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
