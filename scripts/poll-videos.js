
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fetch = require('node-fetch'); // Needs node-fetch installed or use built-in global fetch in Node 18+

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const magicHourKey = process.env.MAGIC_HOUR_API_KEY;

if (!supabaseUrl || !supabaseKey || !magicHourKey) {
    console.error("Missing credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function pollVideos() {
    console.log("🔍 Polling for pending videos...");

    // 1. Get pending lessons
    const { data: lessons, error } = await supabase
        .from('course_lessons')
        .select('id, video_url')
        .like('video_url', 'JOB_PENDING:%');

    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    if (!lessons || lessons.length === 0) {
        console.log("✅ No pending videos found.");
        return;
    }

    console.log(`Found ${lessons.length} pending videos.`);

    for (const lesson of lessons) {
        const jobId = lesson.video_url.replace('JOB_PENDING:', '');
        console.log(`Checking Job ${jobId} for Lesson ${lesson.id}...`);

        try {
            const res = await fetch(`https://api.magichour.ai/v1/videos/${jobId}`, {
                headers: { 'Authorization': `Bearer ${magicHourKey}` }
            });

            if (!res.ok) {
                console.error(`Magic Hour API Error: ${res.status}`);
                continue;
            }

            const videoData = await res.json();
            // Assuming structure: { status: 'completed', download_url: '...' } 
            // Need to verify response structure from client.ts checks or docs.
            // client.ts uses `getVideoStatus`.

            if (videoData.status === 'completed') {
                const downloadUrl = videoData.download_url || videoData.url; // Fallback
                console.log(`✅ Job ${jobId} COMPLETED. URL: ${downloadUrl}`);

                if (downloadUrl) {
                    await supabase
                        .from('course_lessons')
                        .update({ video_url: downloadUrl })
                        .eq('id', lesson.id);
                    console.log(`   -> Database updated.`);
                }
            } else if (videoData.status === 'failed') {
                console.error(`❌ Job ${jobId} FAILED.`);
                await supabase
                    .from('course_lessons')
                    .update({ video_url: null }) // Clear it or mark error
                    .eq('id', lesson.id);
            } else {
                console.log(`   -> Status: ${videoData.status}`);
            }

        } catch (e) {
            console.error(`Error checking job ${jobId}:`, e);
        }
    }
}

// Run immediately
pollVideos();
