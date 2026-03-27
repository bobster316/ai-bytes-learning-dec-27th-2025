
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { videoGenerationService } from '../lib/services/video-generation';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function triggerBusinessCourseVideo() {
    console.log("🎬 Triggering Business Course Intro Video...");

    // 1. Find the target course
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .ilike('title', '%AI for Business: Understanding and Implementation%')
        .limit(1);

    if (error || !courses || courses.length === 0) {
        console.error("❌ Course not found");
        return;
    }

    const course = courses[0];
    console.log(`✅ Found Course: ${course.title} (${course.id})`);

    // Check if valid job ID already exists (just in case)
    if (course.intro_video_job_id && course.intro_video_job_id.length > 10) {
        console.log(`⚠️ Course already has a Job ID: ${course.intro_video_job_id}`);
        // Optional: Force overwrite if needed, but for now let's be safe.
        // Actually, user says it's missing, so let's check if we should overwrite.
        // If it was null in debug log, we are good.
    }

    // 2. Prepare Request
    const videoRequests: any[] = [{
        type: 'course_introduction',
        entityId: course.id,
        script: "Welcome to AI for Business. I'm Sarah, and in this course we'll explore how to implement AI strategies that drive real value. Let's get started.",
        avatarId: 'sarah-avatar-id' // Service will map this to real ID
    }];

    // 3. Trigger Generation
    try {
        const results = await videoGenerationService.triggerCourseVideoBatch(course.id, course.title, videoRequests, {
            useElevenLabs: true,
            useHeyGen: true,
            checkQuota: true
        });

        console.log("✅ Generation Triggered! Saving Job ID...");

        if (results[course.id]) {
            await supabase.from('courses').update({
                intro_video_job_id: results[course.id],
                intro_video_status: 'queued'
            }).eq('id', course.id);
            console.log(`Updated Course Job ID: ${results[course.id]}`);
        } else {
            console.error("❌ No Job ID returned for course intro");
        }

    } catch (e: any) {
        console.error("❌ Generation Failed:", e.message);
    }
}

triggerBusinessCourseVideo();
