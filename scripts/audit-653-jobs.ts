
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function exportJobs() {
    const courseId = 653;
    console.log(`[AUDIT] Course ${courseId}`);

    const { data: intro } = await supabase.from('courses').select('intro_video_job_id').eq('id', courseId).single();
    console.log(`[INTRO] Job: ${intro?.intro_video_job_id}`);

    const { data: topics } = await supabase.from('course_topics').select('id, title, video_job_id').eq('course_id', courseId);
    console.log(`[TOPICS] Found: ${topics?.length || 0}`);
    topics?.forEach(t => console.log(`  - Topic: ${t.title} | Job: ${t.video_job_id}`));

    const topicIds = topics?.map(t => t.id) || [];
    const { data: lessons } = await supabase.from('course_lessons').select('id, title, video_job_id').in('topic_id', topicIds);
    console.log(`[LESSONS] Found: ${lessons?.length || 0}`);
    lessons?.forEach(l => console.log(`  - Lesson: ${l.title} | Job: ${l.video_job_id}`));
}

exportJobs();
