import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data, error } = await supabase
        .from('courses')
        .select(`
            *,
            course_topics (
                id,
                title,
                description,
                order_index,
                video_url,
                intro_video_job_id,
                intro_video_status,
                thumbnail_url,
                course_lessons (
                    id,
                    title,
                    order_index,
                    estimated_duration_minutes,
                    key_takeaways,
                    thumbnail_url,
                    video_job_id,
                    video_status,
                    micro_objective,
                    lesson_action
                ),
                course_quizzes (
                    id,
                    title
                )
            )
        `)
        .eq('id', '670')
        .single();
    if (error) {
        console.error("SUPABASE ERROR:", error);
    } else {
        console.log("SUCCESS, found course:", data.title);
    }
}
run();
