import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { heyGenService } from '@/lib/services/heygen-service';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    console.log('🔄 Auto-sync: Checking for completed videos...');

    let updatedCount = 0;

    try {
        // 1. Check Course Intros
        const { data: courses } = await supabase
            .from('courses')
            .select('id, title, intro_video_job_id, intro_video_status')
            .not('intro_video_job_id', 'is', null)
            .not('intro_video_status', 'in', '("completed","failed")');

        if (courses) {
            for (const course of courses) {
                try {
                    const status = await heyGenService.checkVideoStatus(course.intro_video_job_id);
                    if (status.status === 'completed' && status.videoUrl) {
                        await supabase
                            .from('courses')
                            .update({
                                intro_video_status: 'completed',
                                intro_video_url: status.videoUrl
                            })
                            .eq('id', course.id);
                        console.log(`✅ Updated course: ${course.title}`);
                        updatedCount++;
                    } else if (status.status === 'failed') {
                        await supabase
                            .from('courses')
                            .update({ intro_video_status: 'failed' })
                            .eq('id', course.id);
                        console.log(`⚠️ Course HeyGen job permanently failed: ${course.title}`);
                    }
                } catch (e: any) {
                    console.error(`Error checking course ${course.id}:`, e.message);
                }
            }
        }

        // 2. Check Topic Intros
        const { data: topics } = await supabase
            .from('course_topics')
            .select('id, title, intro_video_job_id, intro_video_status')
            .not('intro_video_job_id', 'is', null)
            .not('intro_video_status', 'in', '("completed","failed")');

        if (topics) {
            for (const topic of topics) {
                try {
                    const status = await heyGenService.checkVideoStatus(topic.intro_video_job_id);
                    if (status.status === 'completed' && status.videoUrl) {
                        await supabase
                            .from('course_topics')
                            .update({
                                intro_video_status: 'completed',
                                video_url: status.videoUrl
                            })
                            .eq('id', topic.id);
                        console.log(`✅ Updated topic: ${topic.title}`);
                        updatedCount++;
                    } else if (status.status === 'failed') {
                        await supabase
                            .from('course_topics')
                            .update({ intro_video_status: 'failed' })
                            .eq('id', topic.id);
                        console.log(`⚠️ Topic HeyGen job permanently failed: ${topic.title}`);
                    }
                } catch (e: any) {
                    console.error(`Error checking topic ${topic.id}:`, e.message);
                }
            }
        }

        return NextResponse.json({
            success: true,
            updatedCount,
            message: `Sync complete. Updated ${updatedCount} videos.`
        });

    } catch (error: any) {
        console.error('❌ Auto-sync error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
