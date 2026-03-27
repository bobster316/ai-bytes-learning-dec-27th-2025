
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { heyGenService } from '../lib/services/heygen-service';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log("🔍 Finding course 'LLM Fundamentals'...");
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .ilike('title', '%LLM Fundamentals%')
        .limit(1);

    if (error || !courses || courses.length === 0) {
        console.error("❌ Course not found", error);
        return;
    }

    const course = courses[0];
    console.log(`✅ Found course: ${course.title} (${course.id})`);
    console.log(`   Intro Video Job ID: ${course.intro_video_job_id}`);
    console.log(`   Intro Video Status (DB): ${course.intro_video_status}`);
    console.log(`   Intro Video URL (DB): ${course.intro_video_url}`);

    if (course.intro_video_job_id) {
        console.log(`\n🔍 Checking HeyGen status for Job ID: ${course.intro_video_job_id}...`);
        try {
            const status = await heyGenService.checkVideoStatus(course.intro_video_job_id);
            console.log("HeyGen API Result:", JSON.stringify(status, null, 2));
        } catch (e: any) {
            console.error("❌ HeyGen API Check Failed:", e.message);
        }
    } else {
        console.log("⚠️ No intro video job ID found.");
    }

    // Check topics
    console.log("\n🔍 Checking Topics...");
    const { data: topics } = await supabase
        .from('course_topics')
        .select('*')
        .eq('course_id', course.id);

    if (topics) {
        for (const topic of topics) {
            console.log(`   Topic: ${topic.title}`);
            console.log(`   - Job ID: ${topic.intro_video_job_id}`);
            console.log(`   - Status: ${topic.intro_video_status}`);
            if (topic.intro_video_job_id) {
                try {
                    const status = await heyGenService.checkVideoStatus(topic.intro_video_job_id);
                    console.log(`     -> HeyGen Status: ${status.status} ${status.error ? `(${status.error})` : ''}`);
                    if (status.videoUrl) console.log(`     -> URL: ${status.videoUrl}`);
                } catch (e: any) {
                    console.log(`     -> Check failed: ${e.message}`);
                }
            }
        }
    }
}

main().catch(console.error);
