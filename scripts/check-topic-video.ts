
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTopicVideo() {
    // 1. Get the business course
    const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .ilike('title', '%Business%')
        .limit(1);

    if (!courses || courses.length === 0) return;

    // 2. Get the topic
    const { data: topics } = await supabase
        .from('course_topics')
        .select('*')
        .eq('course_id', courses[0].id)
        .limit(1);

    if (topics && topics.length > 0) {
        const t = topics[0];
        console.log(`Topic: ${t.title}`);
        console.log(`Video URL: ${t.video_url}`);
        console.log(`Intro Status: ${t.intro_video_status}`);
        console.log(`Job ID: ${t.intro_video_job_id}`);
    }
}

checkTopicVideo();
