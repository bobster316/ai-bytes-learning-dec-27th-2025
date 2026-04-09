import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { imageService } from "@/lib/ai/image-service";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes — thumbnails are slow

/**
 * POST /api/admin/courses/regenerate-thumbnails
 * Regenerates thumbnails for all courses (or a subset via body.courseIds).
 * Body (optional): { courseIds: number[] }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const courseIds: number[] | undefined = body.courseIds;

        const supabase = await createClient(true);

        let query = supabase
            .from('courses')
            .select('id, title, description, category, difficulty_level');

        if (courseIds && courseIds.length > 0) {
            query = query.in('id', courseIds);
        }

        const { data: courses, error: fetchError } = await query.order('created_at', { ascending: false });

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!courses || courses.length === 0) {
            return NextResponse.json({ message: 'No courses found', results: [] });
        }

        console.log(`[regenerate-thumbnails] Processing ${courses.length} courses...`);

        const results: { id: number; title: string; status: 'ok' | 'error'; url?: string; error?: string }[] = [];

        for (const course of courses) {
            try {
                console.log(`[regenerate-thumbnails] Generating thumbnail for course ${course.id}: "${course.title}"`);

                const url = await imageService.fetchCourseThumbnail(
                    course.title,
                    course.description ?? '',
                    undefined,
                    course.category ?? undefined,
                    course.difficulty_level ?? undefined
                );

                const { error: updateError } = await supabase
                    .from('courses')
                    .update({ thumbnail_url: url })
                    .eq('id', course.id);

                if (updateError) {
                    throw new Error(`DB update failed: ${updateError.message}`);
                }

                console.log(`[regenerate-thumbnails] ✅ Course ${course.id} done → ${url}`);
                results.push({ id: course.id, title: course.title, status: 'ok', url });

            } catch (err: any) {
                console.error(`[regenerate-thumbnails] ❌ Course ${course.id} failed:`, err.message);
                results.push({ id: course.id, title: course.title, status: 'error', error: err.message });
            }
        }

        const ok = results.filter(r => r.status === 'ok').length;
        const failed = results.filter(r => r.status === 'error').length;

        return NextResponse.json({ total: courses.length, ok, failed, results });

    } catch (err: any) {
        console.error('[regenerate-thumbnails] Fatal error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
