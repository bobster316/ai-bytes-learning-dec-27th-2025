
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { videoGenerationService } from '../lib/services/video-generation';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateTestVideos() {
    console.log("🎬 Starting TEST Video Generation...");

    // 1. Find the target course
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .ilike('title', '%LLM Fundamentals%')
        .limit(1);

    if (error || !courses || courses.length === 0) {
        console.error("❌ Course not found");
        return;
    }

    const course = courses[0];
    console.log(`✅ Found Course: ${course.title} (${course.id})`);

    // 2. Prepare Requests
    const videoRequests: any[] = [];

    // Course Intro Request
    videoRequests.push({
        type: 'course_introduction',
        entityId: course.id,
        script: "Hi! Welcome to LLM Fundamentals. I'm Sarah, and in this short course, we'll explore how Large Language Models like GPT-4 work. Let's get started!", // Short 5s script
        avatarId: 'sarah-avatar-id'
    });

    // Module Intro Requests
    const { data: topics } = await supabase
        .from('course_topics')
        .select('*')
        .eq('course_id', course.id);

    if (topics) {
        for (const topic of topics) {
            videoRequests.push({
                type: 'module_introduction',
                entityId: topic.id,
                script: `Welcome to ${topic.title}. In this module, I'll guide you through the key concepts you need to know. Let's dive in!`, // Short 5s script
                topicName: topic.title,
                avatarId: 'sarah-avatar-id'
            });
        }
    }

    console.log(`📋 Queued ${videoRequests.length} videos for generation.`);

    // 3. Trigger Batch Generation
    try {
        const results = await videoGenerationService.triggerCourseVideoBatch(course.id, course.title, videoRequests, {
            useElevenLabs: true,
            useHeyGen: true,
            checkQuota: true
        });

        console.log("✅ Generation Triggered! Saving Job IDs...");
        console.log(JSON.stringify(results, null, 2));

        // 4. Save Job IDs manually (since we are bypassing the main route logic)
        // Course Intro
        if (results[course.id]) {
            await supabase.from('courses').update({
                intro_video_job_id: results[course.id],
                intro_video_status: 'queued'
            }).eq('id', course.id);
            console.log(`Updated Course Job ID: ${results[course.id]}`);
        }

        // Topic Intros
        for (const topic of topics || []) {
            if (results[topic.id]) {
                await supabase.from('course_topics').update({
                    intro_video_job_id: results[topic.id],
                    intro_video_status: 'queued'
                }).eq('id', topic.id);
                console.log(`Updated Topic ${topic.title} Job ID: ${results[topic.id]}`);
            }
        }

    } catch (e: any) {
        console.error("❌ Generation Failed:", e.message);
    }
}

generateTestVideos();
