
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function listCourseIds() {
    const { data: topics } = await supabase.from('course_topics').select('course_id').limit(100);
    const ids = Array.from(new Set(topics?.map(t => t.course_id)));
    console.log('Unique Course IDs in course_topics:', ids);

    const { data: recent } = await supabase.from('courses').select('id, title').order('id', { ascending: false }).limit(5);
    console.log('Recent Courses in courses table:', recent);
}

listCourseIds();
