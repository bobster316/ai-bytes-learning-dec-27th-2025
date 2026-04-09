/**
 * POST /api/admin/courses/revoke-slides
 *
 * Disables slides for a course and removes all student slide access records.
 * Students will no longer see the slides panel on the completion page.
 *
 * Body: { courseId: string }
 *
 * POST /api/admin/courses/revoke-slides with { enable: true }
 * re-enables slides without regenerating — students can request again.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    let courseId: string;
    let enable = false;

    try {
        const body = await req.json();
        courseId = body.courseId;
        enable = body.enable === true;
        if (!courseId) throw new Error('missing courseId');
    } catch {
        return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const supabase = await createClient(true);

    if (enable) {
        // Re-enable slides for the course (students can request again)
        const { error } = await supabase
            .from('courses')
            .update({ slides_enabled: true })
            .eq('id', courseId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, slides_enabled: true });
    }

    // Revoke: disable + wipe all student access records
    const { error: courseErr } = await supabase
        .from('courses')
        .update({ slides_enabled: false })
        .eq('id', courseId);

    if (courseErr) {
        return NextResponse.json({ error: courseErr.message }, { status: 500 });
    }

    const { error: wipeErr } = await supabase
        .from('student_slides')
        .delete()
        .eq('course_id', courseId);

    if (wipeErr) {
        console.error('[revoke-slides] Failed to wipe student_slides:', wipeErr.message);
        // Non-fatal — course is already disabled
    }

    return NextResponse.json({ success: true, slides_enabled: false });
}
