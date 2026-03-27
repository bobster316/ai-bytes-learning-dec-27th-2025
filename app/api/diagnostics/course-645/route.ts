import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check course 645
    const { data: course } = await supabase
        .from('courses')
        .select('id, title, intro_video_job_id, intro_video_status')
        .eq('id', 645)
        .single();

    const { data: topics } = await supabase
        .from('course_topics')
        .select('id, title, intro_video_job_id, intro_video_status')
        .eq('course_id', 645)
        .order('order_index');

    return NextResponse.json({
        course,
        topics,
        diagnosis: {
            courseHasJobId: !!course?.intro_video_job_id,
            topicsWithJobIds: topics?.filter(t => !!t.intro_video_job_id).length || 0,
            totalTopics: topics?.length || 0,
            recommendation: !course?.intro_video_job_id
                ? "Video generation is not working. Videos are not being queued to Magic Hour."
                : "Videos are queued successfully!"
        }
    });
}
