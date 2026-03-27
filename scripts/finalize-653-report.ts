
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function finalizeReport() {
    const courseId = 653;
    console.log(`\n--- COURSE 653 REPORT ---`);

    try {
        const { data: topics } = await supabase.from('course_topics').select('*').eq('course_id', courseId);
        console.log(`\nMODULES (${topics?.length || 0}):`);
        for (const t of topics || []) {
            console.log(`- ${t.title}: [Job: ${t.video_job_id}] (${t.video_status})`);
        }

        const topicIds = topics?.map(t => t.id) || [];
        const { data: lessons } = await supabase.from('course_lessons').select('*').in('topic_id', topicIds);
        console.log(`\nLESSONS (${lessons?.length || 0}):`);
        for (const l of lessons || []) {
            console.log(`- ${l.title}: [Job: ${l.video_job_id}] (${l.video_status})`);
        }
    } catch (e) {
        console.error('Report Error:', e);
    }
}

finalizeReport();
