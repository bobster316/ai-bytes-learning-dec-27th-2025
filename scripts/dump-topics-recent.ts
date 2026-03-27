
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function dumpRecentTopics() {
    const { data: topics } = await supabase.from('course_topics').select('id, course_id, title, video_job_id').order('id', { ascending: false }).limit(20);
    console.log('--- RECENT TOPICS ---');
    topics?.forEach(t => console.log(`ID: ${t.id} | CourseID: ${t.course_id} | Title: ${t.title} | Job: ${t.video_job_id}`));
}

dumpRecentTopics();
