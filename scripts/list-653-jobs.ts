
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listJobs(courseId: number) {
    console.log(`📊 Video Status for Course ${courseId}:\n`);

    // Course Intro
    const { data: course } = await supabase.from('courses').select('title, intro_video_job_id, intro_video_status').eq('id', courseId).single();
    console.log(`[COURSE] ${course?.title}`);
    console.log(`  - Intro Job: ${course?.intro_video_job_id} (${course?.intro_video_status})`);

    // Modules
    const { data: topics } = await supabase.from('course_topics').select('id, title, video_job_id, video_status').eq('course_id', courseId);
    console.log(`\n[MODULES]`);
    for (const t of topics || []) {
        console.log(`  - ${t.title}: ${t.video_job_id} (${t.video_status})`);
    }

    // Lessons
    const topicIds = topics?.map(t => t.id) || [];
    const { data: lessons } = await supabase.from('course_lessons').select('id, title, video_job_id, video_status').in('topic_id', topicIds);
    console.log(`\n[LESSONS]`);
    for (const l of lessons || []) {
        console.log(`  - ${l.title}: ${l.video_job_id} (${l.video_status})`);
    }
}

listJobs(653);
