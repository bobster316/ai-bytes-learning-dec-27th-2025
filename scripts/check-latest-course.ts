import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLatestCourse() {
    console.log('🔍 Checking Latest Generated Course...\n');

    // Get the most recently created course
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, intro_video_job_id, intro_video_status, intro_video_url, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('❌ Error fetching courses:', error);
        return;
    }

    if (!courses || courses.length === 0) {
        console.log('No courses found');
        return;
    }

    console.log('📚 Latest Courses:\n');
    for (const course of courses) {
        console.log(`Course: ${course.title}`);
        console.log(`  ID: ${course.id}`);
        console.log(`  Created: ${course.created_at}`);
        console.log(`  Job ID: ${course.intro_video_job_id || 'MISSING ❌'}`);
        console.log(`  Status: ${course.intro_video_status || 'NULL'}`);
        console.log(`  Video URL: ${course.intro_video_url || 'MISSING ❌'}`);
        console.log('');
    }

    // Check topics for the latest course
    const latestCourse = courses[0];
    const { data: topics } = await supabase
        .from('course_topics')
        .select('id, title, intro_video_job_id, intro_video_status, video_url')
        .eq('course_id', latestCourse.id)
        .order('order_index', { ascending: true });

    if (topics && topics.length > 0) {
        console.log(`📖 Modules/Topics for "${latestCourse.title}":\n`);
        for (const topic of topics) {
            console.log(`  Module: ${topic.title}`);
            console.log(`    ID: ${topic.id}`);
            console.log(`    Job ID: ${topic.intro_video_job_id || 'MISSING ❌'}`);
            console.log(`    Status: ${topic.intro_video_status || 'NULL'}`);
            console.log(`    Video URL: ${topic.video_url || 'MISSING ❌'}`);
            console.log('');
        }
    }
}

checkLatestCourse().catch(console.error);
