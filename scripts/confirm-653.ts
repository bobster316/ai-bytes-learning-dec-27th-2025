
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStructure() {
    console.log('--- Checking Course 653 ---');

    // 1. Get Course
    const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', 653)
        .single();

    console.log('Course Title:', course?.title || 'Not found');

    // 2. Get Topics (Modules)
    const { data: topics } = await supabase
        .from('course_topics')
        .select('id, title')
        .eq('course_id', 653);

    console.log('Total Modules:', topics?.length || 0);

    for (const topic of topics || []) {
        // 3. Get Lessons for each topic
        const { data: lessons } = await supabase
            .from('course_lessons')
            .select('id, title')
            .eq('topic_id', topic.id);

        console.log(`- Module: ${topic.title} (${lessons?.length || 0} lessons)`);
        for (const lesson of lessons || []) {
            console.log(`  * Lesson: ${lesson.title}`);
        }
    }
}

checkStructure();
