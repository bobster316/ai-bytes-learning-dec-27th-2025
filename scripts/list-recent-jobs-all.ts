
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listRecentJobs() {
    console.log('--- RECENT VIDEO JOBS ---');

    console.log('\n[COURSES]');
    const { data: c } = await supabase.from('courses').select('id, title, intro_video_job_id').order('id', { ascending: false }).limit(5);
    c?.forEach(x => console.log(`ID: ${x.id} | Job: ${x.intro_video_job_id} | Title: ${x.title}`));

    console.log('\n[TOPICS]');
    const { data: t } = await supabase.from('course_topics').select('id, course_id, title, video_job_id').order('id', { ascending: false }).limit(10);
    t?.forEach(x => console.log(`ID: ${x.id} | CID: ${x.course_id} | Job: ${x.video_job_id} | Title: ${x.title}`));

    console.log('\n[LESSONS]');
    const { data: l } = await supabase.from('course_lessons').select('id, title, video_job_id').order('id', { ascending: false }).limit(10);
    l?.forEach(x => console.log(`ID: ${x.id} | Job: ${x.video_job_id} | Title: ${x.title}`));
}

listRecentJobs();
