
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid "ids" array' }, { status: 400 });
        }

        console.log(`[Bulk Delete API] Deleting ${ids.length} courses...`);

        // Manual Cascade Helper
        const safeDelete = async (table: string, column: string, ids: string[]) => {
            try {
                const { error } = await supabase.from(table).delete().in(column, ids);
                if (error) {
                    // Ignore "relation does not exist" (code 42P01) or other expected errors
                    if (error.code === '42P01') {
                        console.warn(`[Bulk Delete] Table ${table} skipped (not found).`);
                    } else {
                        console.warn(`[Bulk Delete] Failed to clear ${table}:`, error.message);
                    }
                }
            } catch (e) {
                console.warn(`[Bulk Delete] Exception clearing ${table}:`, e);
            }
        };

        // 1. Delete dependent progress/certificates (safely) in PARALLEL
        await Promise.all([
            safeDelete('user_course_progress', 'course_id', ids),
            safeDelete('user_lesson_progress', 'course_id', ids),
            safeDelete('certificates', 'course_id', ids),
            safeDelete('quiz_attempts', 'course_id', ids),
            safeDelete('ai_generated_courses', 'course_id', ids),
            safeDelete('course_generation_progress', 'course_id', ids)
        ]);

        // 2. Fetch Hierarchy for Manual Cascade (Topics -> Lessons/Quizzes)
        const { data: topics } = await supabase.from('course_topics').select('id').in('course_id', ids);
        const topicIds = topics?.map(t => t.id) || [];

        if (topicIds.length > 0) {
            // Fetch Quizzes & Lessons
            const [{ data: quizzes }, { data: lessons }] = await Promise.all([
                supabase.from('course_quizzes').select('id').in('topic_id', topicIds),
                supabase.from('course_lessons').select('id').in('topic_id', topicIds)
            ]);

            const quizIds = quizzes?.map(q => q.id) || [];
            const lessonIds = lessons?.map(l => l.id) || [];

            // A. Deepest Level: Quiz Questions & Lesson Images
            const deepDeletes = [];
            if (quizIds.length > 0) deepDeletes.push(supabase.from('quiz_questions').delete().in('quiz_id', quizIds));
            if (lessonIds.length > 0) deepDeletes.push(supabase.from('lesson_images').delete().in('lesson_id', lessonIds));

            await Promise.all(deepDeletes);

            // B. Mid Level: Quizzes & Lessons
            const midDeletes = [];
            if (quizIds.length > 0) midDeletes.push(supabase.from('course_quizzes').delete().in('id', quizIds));
            if (topicIds.length > 0) midDeletes.push(supabase.from('course_lessons').delete().in('topic_id', topicIds)); // Bulk delete lessons by topic

            await Promise.all(midDeletes);

            // C. Top Level Content: Topics
            await supabase.from('course_topics').delete().in('course_id', ids);
        }

        // 3. Delete the Course itself
        const { error, count } = await supabase
            .from('courses')
            .delete({ count: 'exact' })
            .in('id', ids);

        if (error) {
            console.error("Bulk delete Supabase error:", error);
            throw error;
        }

        console.log(`[Bulk Delete API] Successfully deleted ${count ?? 'unknown'} courses.`);

        // Force cache refresh
        revalidatePath('/courses');
        revalidatePath('/admin/courses');

        return NextResponse.json({ success: true, count });

    } catch (error: any) {
        console.error("Bulk delete failed:", error);

        // Ensure Error objects are serialized correctly
        const errorDetails = error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause
        } : error;

        return NextResponse.json({
            error: error.message || 'Unknown Bulk Delete Error',
            details: errorDetails
        }, { status: 500 });
    }
}
