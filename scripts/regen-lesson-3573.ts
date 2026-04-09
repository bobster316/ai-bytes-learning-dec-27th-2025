/**
 * Regenerates lessons for course 834, topic 1469
 * ("Decoding Attention: Mastering Attention Mechanisms in Transformers")
 * Uses LessonExpanderAgent directly to produce v2 block-based content.
 */

import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { LessonExpanderAgent } from '../lib/ai/agent-system-v2';
import { sanitizeBlocks } from '../lib/ai/content-sanitizer';
import { CourseStateManager, CourseState } from '../lib/ai/course-state';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const COURSE_ID = 834;
const TOPIC_ID = 1469;
const COURSE_TITLE = 'Decoding Attention: Mastering Attention Mechanisms in Transformers';
const TOPIC_TITLE = 'Decoding Attention Mechanisms in Transformers';
const DIFFICULTY = 'Intermediate';

// lessonTitle and microObjective must match the field names the prompt uses
const LESSON_PLANS = [
    {
        lessonTitle: 'What Is Attention? The Intuition Behind the Mechanism',
        microObjective: 'Explain the information bottleneck problem in encoder-decoder RNNs, describe attention as a dynamic weighting of encoder states, and trace how attention scores are computed and normalised.',
    },
    {
        lessonTitle: 'Self-Attention and Scaled Dot-Product Attention',
        microObjective: 'Define Query, Key, and Value projections, calculate scaled dot-product attention step by step, and explain why the sqrt(dk) scaling keeps gradients stable.',
    },
    {
        lessonTitle: 'Multi-Head Attention and Positional Encoding',
        microObjective: 'Describe how multi-head attention concatenates subspace results, identify what different heads specialise in, and explain sinusoidal vs learned positional encodings.',
    },
];

async function main() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const expander = new LessonExpanderAgent();

    // Verify topic has no lessons
    const { data: existing } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('topic_id', TOPIC_ID);

    if (existing && existing.length > 0) {
        console.log(`Topic ${TOPIC_ID} already has ${existing.length} lessons. Aborting to avoid duplicates.`);
        process.exit(0);
    }

    const courseContext = {
        title: COURSE_TITLE,
        difficulty: DIFFICULTY,
        targetAudience: 'ML practitioners and software engineers learning transformer architectures',
    };

    const moduleContext = {
        title: TOPIC_TITLE,
        description: 'Deep dive into how transformer attention mechanisms work under the hood — from intuition to implementation.',
        lessons: LESSON_PLANS.map(l => ({ title: l.lessonTitle, description: l.microObjective })),
    };

    // Initialise CourseState for variety tracking
    const courseState = CourseStateManager.getState(`course_${COURSE_ID}`, TOPIC_TITLE);

    for (let i = 0; i < LESSON_PLANS.length; i++) {
        const lessonPlan = LESSON_PLANS[i];
        const lessonNumber = i + 1;
        console.log(`\n[${lessonNumber}/${LESSON_PLANS.length}] Generating: ${lessonPlan.lessonTitle}`);

        let lesson;
        try {
            lesson = await expander.expandLesson(
                lessonPlan,
                moduleContext,
                courseContext,
                [], // no RAG chunks
                lessonNumber,
                courseState,
                null // no CourseDNA override
            );
        } catch (err) {
            console.error(`  ERROR expanding lesson ${lessonNumber}:`, err);
            continue;
        }

        if (!lesson.blocks || lesson.blocks.length === 0) {
            console.warn(`  WARNING: lesson ${lessonNumber} returned no blocks — skipping`);
            continue;
        }

        // Sanitize
        const sanitizedBlocks = sanitizeBlocks(lesson.blocks);
        console.log(`  Sanitized: ${sanitizedBlocks.length} blocks`);

        // Insert into DB
        const { data: inserted, error } = await supabase
            .from('course_lessons')
            .insert({
                topic_id: TOPIC_ID,
                title: lessonPlan.lessonTitle,
                content_markdown: '',
                content_html: '',
                content_blocks: sanitizedBlocks,
                order_index: i,
                estimated_duration_minutes: 12,
            })
            .select('id')
            .single();

        if (error) {
            console.error(`  DB INSERT ERROR for lesson ${lessonNumber}:`, error.message);
        } else {
            console.log(`  Inserted lesson ID: ${inserted.id}`);
            // Update CourseState
            // track domain usage to avoid repetition
            if (courseState.domain_history) courseState.domain_history.push('Technology');
            CourseStateManager.saveState(courseState);
        }
    }

    console.log('\nDone. Verifying lesson count...');
    const { data: final } = await supabase
        .from('course_lessons')
        .select('id, title')
        .eq('topic_id', TOPIC_ID)
        .order('order_index');
    console.log(`Topic ${TOPIC_ID} now has ${final?.length ?? 0} lessons:`);
    final?.forEach((l, i) => console.log(`  ${i + 1}. [${l.id}] ${l.title}`));
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
