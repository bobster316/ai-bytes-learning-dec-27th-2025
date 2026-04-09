/**
 * POST /api/student/slides/request
 *
 * Grants a student access to their personal copy of the course slides.
 * Each student must explicitly request slides — they are not shown automatically.
 *
 * Logic:
 *   1. Verify the student is authenticated
 *   2. Check slides_enabled on the course (admin can revoke)
 *   3. If student already has status=ready, return the URLs immediately
 *   4. If course-level slides exist, mark the student as ready and return them
 *   5. If no course-level slides exist, run generateSlides() to produce them,
 *      then mark the student as ready
 *
 * Body:  { courseId: string }
 * Returns: { success, status, slidesUrl?, slidesPdfUrl?, slidesPptxUrl? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSlides } from '@/lib/ai/generate-slides';

export const runtime = 'nodejs';
export const maxDuration = 300; // marp-cli PDF/PPTX conversion can take time

export async function POST(req: NextRequest) {
    // 1. Auth
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    let courseId: string;
    try {
        const body = await req.json();
        courseId = body.courseId;
        if (!courseId) throw new Error('missing courseId');
    } catch {
        return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const supabase = await createClient(true); // service role — bypasses RLS

    // 2. Check slides are enabled for this course
    const { data: course } = await supabase
        .from('courses')
        .select('slides_enabled, slides_url, slides_pdf_url, slides_pptx_url')
        .eq('id', courseId)
        .single();

    if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (!course.slides_enabled) {
        return NextResponse.json(
            { error: 'Slides are not available for this course' },
            { status: 403 },
        );
    }

    // 3. Return immediately if student already has slides
    const { data: existing } = await supabase
        .from('student_slides')
        .select('status')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

    if (existing?.status === 'ready') {
        return NextResponse.json({
            success: true,
            status: 'ready',
            slidesUrl: course.slides_url,
            slidesPdfUrl: course.slides_pdf_url,
            slidesPptxUrl: course.slides_pptx_url,
        });
    }

    // 4. Mark as generating (upsert — handles retries gracefully)
    await supabase
        .from('student_slides')
        .upsert(
            { user_id: user.id, course_id: courseId, status: 'generating', requested_at: new Date().toISOString() },
            { onConflict: 'user_id,course_id' },
        );

    try {
        // 5. Generate course-level slides if they don't exist yet
        if (!course.slides_url) {
            console.log(`[student/slides/request] No course-level slides — generating for course ${courseId}`);
            await generateSlides(courseId);
        }

        // 6. Fetch the (possibly newly generated) URLs
        const { data: updated } = await supabase
            .from('courses')
            .select('slides_url, slides_pdf_url, slides_pptx_url')
            .eq('id', courseId)
            .single();

        if (!updated?.slides_url) {
            throw new Error('Slide generation did not produce a URL');
        }

        // 7. Mark student as ready
        await supabase
            .from('student_slides')
            .update({ status: 'ready' })
            .eq('user_id', user.id)
            .eq('course_id', courseId);

        return NextResponse.json({
            success: true,
            status: 'ready',
            slidesUrl: updated.slides_url,
            slidesPdfUrl: updated.slides_pdf_url,
            slidesPptxUrl: updated.slides_pptx_url,
        });

    } catch (err: any) {
        console.error('[student/slides/request] Generation failed:', err);

        await supabase
            .from('student_slides')
            .update({ status: 'failed' })
            .eq('user_id', user.id)
            .eq('course_id', courseId);

        return NextResponse.json(
            { success: false, error: 'Slide generation failed — please try again' },
            { status: 500 },
        );
    }
}
