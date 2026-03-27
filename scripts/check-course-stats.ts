
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCourse() {
    console.log('🔍 Checking Course Video Status...');

    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, intro_video_url, intro_video_job_id, intro_video_status')
        .ilike('title', '%Prompt Engineering%');

    if (error) {
        console.error('Error fetching courses:', error);
        return;
    }

    if (!courses || courses.length === 0) {
        console.log('❌ No "Prompt Engineering" course found.');
    } else {
        courses.forEach(c => {
            console.log(`\n📘 Course: ${c.title} (${c.id})`);
            console.log(`   - Intro Video URL: ${c.intro_video_url || 'MISSING'}`);
            console.log(`   - Intro Video Job ID: ${c.intro_video_job_id || 'MISSING'}`);
            console.log(`   - Intro Video Status: ${c.intro_video_status || 'MISSING'}`);
        });
    }
}

checkCourse();
