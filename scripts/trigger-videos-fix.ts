
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { videoGenerationService } from '@/lib/services/video-generation';
import { VideoScript } from '@/lib/types/course-generator';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVideos() {
    console.log("🚀 Starting Video Generation Fix for 'Prompt Engineering Fundamentals'...");

    // 1. Fetch the specific course
    const { data: course, error } = await supabase
        .from('courses')
        .select('*')
        .ilike('title', 'Prompt Engineering Fundamentals%')
        .single();

    if (error || !course) {
        console.error("Course not found!", error);
        return;
    }
    console.log(`✅ Found Course: ${course.title} (${course.id})`);

    // 2. Fetch Topics
    const { data: topics } = await supabase
        .from('course_topics')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index');

    if (!topics || topics.length === 0) {
        console.error("No topics found!");
        return;
    }
    console.log(`✅ Found ${topics.length} topics.`);

    // 3. Define Scripts (High Quality)
    const courseIntroScript = `
        Hello and welcome to Prompt Engineering Fundamentals. I'm Sarah, your AI instructor.
        Prompt engineering is the single most in-demand AI skill today, commanding a significant wage premium.
        In this course, you will move beyond basic queries and master the RTCROS framework—Role, Task, Context, Reasoning, Output, and Stopping condition.
        By the end of this hour, you'll have ten reusable templates and the confidence to drive powerful results from any LLM.
        Let's get started.
    `.trim().replace(/\s+/g, ' ');

    const moduleScripts = [
        `In Module 1, we dismantle the "Garbage In, Available Out" problem. You'll learn exactly why most prompts fail and how to fix them using the RTCROS framework. We'll break down Role, Task, Context, and Reasoning to build a solid foundation for your prompt library.`,
        `Module 2 takes us into advanced territory. We'll explore Few-Shot prompting to control style, and Chain-of-Thought reasoning to improve logic. These techniques are the difference between an average answer and an expert-level output.`,
        `Finally, in Module 3, we scale up. You'll learn how to build a personal prompt library to save time, and we'll introduce multi-step agent workflows. This is where you transition from a user to an AI architect.`
    ];

    // 4. Prepare Video Requests
    const videoRequests: any[] = [];

    // Course Intro
    videoRequests.push({
        type: 'course_introduction',
        entityId: course.id,
        script: courseIntroScript,
        avatarId: 'dca5f0bcd8524f079791fbb46f808c01' // Correct Sarah ID (Scene API)
    });

    // Topic Intros
    topics.forEach((topic, idx) => {
        if (moduleScripts[idx]) {
            videoRequests.push({
                type: 'module_introduction',
                entityId: topic.id,
                script: moduleScripts[idx],
                topicName: topic.title,
                avatarId: 'dca5f0bcd8524f079791fbb46f808c01'
            });
        }
    });

    console.log(`Generated ${videoRequests.length} video requests.`);

    // 5. Trigger Batch Generation
    try {
        console.log("🎬 Triggering Video Service (ElevenLabs + HeyGen)...");
        const results = await videoGenerationService.triggerCourseVideoBatch(
            course.id,
            course.title,
            videoRequests,
            {
                useElevenLabs: true,
                useHeyGen: true,
                checkQuota: true
            }
        );

        console.log("✅ Generation triggered. Results:", results);

        // 6. Update Database with Job IDs
        // Note: The service generates the videos but we must save the Job IDs to track them.
        for (const [entityId, jobId] of Object.entries(results)) {
            if (entityId === course.id) {
                const { data, error, count } = await supabase.from('courses').update({
                    intro_video_job_id: jobId,
                    intro_video_status: 'queued'
                }).eq('id', entityId).select();

                if (error) {
                    console.error(`❌ Failed to update Course Video Job ID:`, error);
                } else if (!data || data.length === 0) {
                    console.error(`❌ Course update returned no rows. ID might not exist: ${entityId}`);
                } else {
                    console.log(`✅ Updated Course Video Job ID: ${jobId}`);
                    console.log(`   Rows affected: ${data.length}`);
                }
            } else {
                const { data, error, count } = await supabase.from('course_topics').update({
                    intro_video_job_id: jobId,
                    intro_video_status: 'queued'
                }).eq('id', entityId).select();

                if (error) {
                    console.error(`❌ Failed to update Topic Video Job ID:`, error);
                } else if (!data || data.length === 0) {
                    console.error(`❌ Topic update returned no rows. ID might not exist: ${entityId}`);
                } else {
                    console.log(`✅ Updated Topic Video Job ID: ${jobId}`);
                    console.log(`   Rows affected: ${data.length}`);
                }
            }
        }

        console.log("✨ All done! Videos are queuing. Check the Course Page in 5-10 minutes.");

    } catch (e: any) {
        console.error("❌ Generation Failed:", e.message);
    }
}

fixVideos().catch(console.error);
