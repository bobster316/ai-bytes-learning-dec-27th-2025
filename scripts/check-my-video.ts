
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { heyGenService } from '../lib/services/heygen-service';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSpecificVideo() {
    // 1. Get the course again to find the Job ID
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
    const jobId = course.intro_video_job_id;

    console.log(`Checking Course: ${course.title}`);
    console.log(`Job ID: ${jobId}`);

    if (!jobId) {
        console.log("No Job ID found.");
        return;
    }

    // 2. Direct Status Check via HeyGen API
    try {
        console.log("Contacting HeyGen API...");
        const status = await heyGenService.checkVideoStatus(jobId);
        console.log("--- HeyGen Response ---");
        console.log(JSON.stringify(status, null, 2));
        console.log("-----------------------");

        if (status.status === 'completed' && status.videoUrl) {
            console.log("✅ Video is READY! Updating DB...");
            const { error } = await supabase
                .from('courses')
                .update({
                    intro_video_status: 'completed',
                    intro_video_url: status.videoUrl
                })
                .eq('id', course.id);

            if (error) console.error("DB Update Error", error);
            else console.log("DB Updated Successfully.");
        } else {
            console.log(`Video is effectively: ${status.status}`);
        }

    } catch (e: any) {
        console.error("Error checking specific video:", e.message);
    }
}

checkSpecificVideo();
