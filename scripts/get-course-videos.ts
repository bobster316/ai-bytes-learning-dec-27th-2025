
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getCourseVideos() {
    const courseId = 653;
    console.log(`🔍 Fetching videos for Course ${courseId}...`);

    // 1. Check Course Intro Video
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('title, intro_video_job_id, intro_video_status, intro_video_generated_at')
        .eq('id', courseId)
        .single();

    if (courseError) {
        console.error('Error fetching course:', JSON.stringify(courseError, null, 2));
    } else {
        console.log('\n📘 Course Intro:');
        console.log(`Title: ${course.title}`);
        console.log(`Job ID: ${course.intro_video_job_id}`);
        console.log(`Status: ${course.intro_video_status}`);
    }

    // 2. Check Topic/Module Videos
    // Trying 'modules' table first, then 'topics' if that fails or returns nothing.
    // The schema output said "Topics Columns", so likely 'topics'.
    const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('title, intro_video_job_id, intro_video_status')
        .eq('course_id', courseId);

    if (topicsError) {
        // Try modules?
        console.log('Topics table query failed, trying modules...');
        const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('title, intro_video_job_id, intro_video_status')
            .eq('course_id', courseId);

        if (modules) {
            console.log(`\n📚 Modules (${modules.length}):`);
            modules.forEach(m => {
                console.log(`   - ${m.title}: ${m.intro_video_job_id} [${m.intro_video_status}]`);
            });
        }
    } else {
        console.log(`\n📚 Topics (${topics.length}):`);
        topics.forEach(t => {
            console.log(`   - ${t.title}: ${t.intro_video_job_id} [${t.intro_video_status}]`);
        });
    }
}

getCourseVideos();
