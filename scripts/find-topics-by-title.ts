
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function findByTitle() {
    console.log('--- SEARCHING FOR TOPICS ---');
    const { data: topics, error } = await supabase.from('course_topics').select('*').ilike('title', '%Constellation%');
    console.log(`Found: ${topics?.length || 0}`);
    topics?.forEach(t => console.log(`ID: ${t.id} | CID: ${t.course_id} | Title: ${t.title} | Job: ${t.video_job_id}`));
    if (error) console.error('Error:', error);

    console.log('\n--- SEARCHING FOR TOPICS (ALL) ---');
    const { data: all } = await supabase.from('course_topics').select('*').limit(20);
    all?.forEach(t => console.log(`ID: ${t.id} | CID: ${t.course_id} | Title: ${t.title} | Job: ${t.video_job_id}`));
}

findByTitle();
