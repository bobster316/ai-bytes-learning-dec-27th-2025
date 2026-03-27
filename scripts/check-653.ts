
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCourse() {
    const { data: course, error } = await supabase.from('courses').select('id, title, status').eq('id', 653).single();
    if (error) {
        console.error('Course Not Found:', error.message);
        // List last 5 courses to find the real ID
        const { data: recent } = await supabase.from('courses').select('id, title').order('id', { ascending: false }).limit(5);
        console.log('Recent Courses:', recent);
    } else {
        console.log('✅ Found Course:', course);
    }
}

checkCourse();
