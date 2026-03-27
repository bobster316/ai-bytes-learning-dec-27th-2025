
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugCourse() {
    const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .ilike('title', '%Business%')
        .limit(1);

    if (!courses || courses.length === 0) {
        console.log("Course not found");
        return;
    }

    const course = courses[0];
    console.log(`COURSE: ${course.title} (${course.id})`);
    console.log(`- Intro Job ID: ${course.intro_video_job_id}`);
    console.log(`- Intro Status: ${course.intro_video_status}`);
    console.log(`- Intro URL: ${course.intro_video_url}`);

    const { data: topics } = await supabase
        .from('course_topics')
        .select('*')
        .eq('course_id', course.id);

    console.log(`\nTOPICS (${topics?.length}):`);
    topics?.forEach(t => {
        console.log(`- Topic: ${t.title}`);
        console.log(`  Job ID: ${t.intro_video_job_id}`);
        console.log(`  Status: ${t.intro_video_status}`);
        console.log(`  Video URL: ${t.video_url}`);
    });
}

debugCourse();
