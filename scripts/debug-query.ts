
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugQuery() {
    const courseId = 653;
    console.log(`--- Debugging Query for Course ${courseId} ---`);

    const { data, error } = await supabase
        .from('courses')
        .select(`
            *,
            course_topics (
                id,
                title,
                order_index,
                video_url,
                video_job_id,
                thumbnail_url,
                course_lessons (
                    id,
                    title,
                    order_index,
                    estimated_duration_minutes
                ),
                course_quizzes (
                    id,
                    title
                )
            )
        `)
        .eq('id', courseId)
        .single();

    if (error) {
        console.error('QUERY ERROR:', error);
    } else {
        console.log('QUERY SUCCESS');
        console.log('Topics Count:', data.course_topics?.length);
    }
}

debugQuery();
