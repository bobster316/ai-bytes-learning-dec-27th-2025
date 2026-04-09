/**
 * POST /api/admin/courses/generate-slides
 *
 * Generates a MARP slide deck for an existing course.
 * Use this to backfill slides for courses that were generated before
 * the MARP feature was added, or to regenerate stale slides after edits.
 *
 * Body: { courseId: string }
 * Returns: { success: boolean, slidesUrl?: string, error?: string }
 *
 * Auth: middleware protects /api/admin/* — no additional role check needed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSlides } from '@/lib/ai/generate-slides';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    let courseId: string;
    try {
        const body = await req.json();
        courseId = body.courseId;
        if (!courseId) throw new Error('missing courseId');
    } catch {
        return NextResponse.json({ success: false, error: 'courseId is required' }, { status: 400 });
    }

    const slidesUrl = await generateSlides(courseId);

    if (!slidesUrl) {
        return NextResponse.json(
            { success: false, error: 'Slide generation failed — check server logs' },
            { status: 500 }
        );
    }

    // Fetch the freshly saved URLs to return all three formats
    const supabase = await createClient(true);
    const { data } = await supabase
        .from('courses')
        .select('slides_url, slides_pdf_url, slides_pptx_url')
        .eq('id', courseId)
        .single();

    return NextResponse.json({
        success: true,
        slidesUrl: data?.slides_url ?? slidesUrl,
        slidesPdfUrl: data?.slides_pdf_url ?? null,
        slidesPptxUrl: data?.slides_pptx_url ?? null,
    });
}
