
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { heyGenService } from '../lib/services/heygen-service';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncVideos() {
    console.log("🔄 Starting Video Sync...");

    // 1. Find Course Intros
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title, intro_video_job_id, intro_video_status')
        .not('intro_video_job_id', 'is', null)
        .neq('intro_video_status', 'completed');

    if (courses) {
        for (const course of courses) {
            console.log(`Checking Course: ${course.title} (${course.intro_video_job_id})`);
            try {
                const status = await heyGenService.checkVideoStatus(course.intro_video_job_id);
                if (status.status === 'completed' && status.videoUrl) {
                    console.log(`✅ COMPLETED! Updating DB with URL: ${status.videoUrl.substring(0, 30)}...`);
                    await supabase
                        .from('courses')
                        .update({
                            intro_video_status: 'completed',
                            intro_video_url: status.videoUrl
                        })
                        .eq('id', course.id);
                } else if (status.status === 'failed') {
                    console.error(`❌ FAILED: ${status.error}`);
                    await supabase
                        .from('courses')
                        .update({
                            intro_video_status: 'failed',
                            intro_video_url: null // Clear if failed? Or keep logs?
                        })
                        .eq('id', course.id);
                } else {
                    console.log(`⏳ Status: ${status.status}`);
                }
            } catch (e: any) {
                console.error(`Error checking course video:`, e.message);
            }
        }
    }

    // 2. Find Topic Intros
    const { data: topics } = await supabase
        .from('course_topics')
        .select('id, title, intro_video_job_id, intro_video_status')
        .not('intro_video_job_id', 'is', null)
        .neq('intro_video_status', 'completed');

    if (topics) {
        for (const topic of topics) {
            console.log(`Checking Topic: ${topic.title} (${topic.intro_video_job_id})`);
            try {
                const status = await heyGenService.checkVideoStatus(topic.intro_video_job_id);
                if (status.status === 'completed' && status.videoUrl) {
                    console.log(`✅ COMPLETED! Updating DB with URL: ${status.videoUrl.substring(0, 30)}...`);
                    await supabase
                        .from('course_topics')
                        .update({
                            intro_video_status: 'completed',
                            video_url: status.videoUrl // Note: field might be 'video_url' or 'intro_video_url'? code says 'video_url' usually for topics
                        })
                        .eq('id', topic.id);
                } else if (status.status === 'failed') {
                    console.error(`❌ FAILED: ${status.error}`);
                    await supabase
                        .from('course_topics')
                        .update({ intro_video_status: 'failed' })
                        .eq('id', topic.id);
                } else {
                    console.log(`⏳ Status: ${status.status}`);
                }
            } catch (e: any) {
                console.error(`Error checking topic video:`, e.message);
            }
        }
    }

    // 3. Find Lesson Intros
    const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, title, intro_video_job_id, intro_video_status')
        .not('intro_video_job_id', 'is', null)
        .neq('intro_video_status', 'completed');

    if (lessons) {
        for (const lesson of lessons) {
            console.log(`Checking Lesson: ${lesson.title} (${lesson.intro_video_job_id})`);
            try {
                const status = await heyGenService.checkVideoStatus(lesson.intro_video_job_id);
                if (status.status === 'completed' && status.videoUrl) {
                    console.log(`✅ COMPLETED! Updating DB with URL: ${status.videoUrl.substring(0, 30)}...`);
                    await supabase
                        .from('course_lessons')
                        .update({
                            intro_video_status: 'completed',
                            intro_video_url: status.videoUrl // Assuming field is intro_video_url
                        })
                        .eq('id', lesson.id);
                } else if (status.status === 'failed') {
                    console.error(`❌ FAILED: ${status.error}`);
                    await supabase
                        .from('course_lessons')
                        .update({ intro_video_status: 'failed' })
                        .eq('id', lesson.id);
                } else {
                    console.log(`⏳ Status: ${status.status}`);
                }
            } catch (e: any) {
                console.error(`Error checking lesson video:`, e.message);
            }
        }
    }

    console.log("Sync complete.");
}

syncVideos();
