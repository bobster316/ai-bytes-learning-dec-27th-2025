
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key to bypass RLS and ensure we can delete everything
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {

    try {
        const { searchParams } = new URL(req.url);
        let courseId = searchParams.get('id');

        // Fallback for body parsing if needed (sometimes tools send body)
        if (!courseId) {
            try {
                const body = await req.json();
                courseId = body.id;
            } catch (e) { }
        }

        if (!courseId) {
            return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });
        }

        console.log(`[Delete API] Deleting course ${courseId}...`);

        // 1. Get Course Topics
        const { data: topics } = await supabase
            .from('course_topics')
            .select('id')
            .eq('course_id', courseId);

        const topicIds = topics?.map(t => t.id) || [];

        if (topicIds.length > 0) {
            // 2. Delete Quiz Data (Questions -> Quizzes)
            // Find quizzes for these topics
            const { data: quizzes } = await supabase
                .from('course_quizzes')
                .select('id')
                .in('topic_id', topicIds);

            const quizIds = quizzes?.map(q => q.id) || [];

            if (quizIds.length > 0) {
                // Delete questions
                await supabase.from('quiz_questions').delete().in('quiz_id', quizIds);
                // Delete quizzes
                await supabase.from('course_quizzes').delete().in('id', quizIds);
            }

            // 3. Delete Lesson Data (Images -> Lessons)
            const { data: lessons } = await supabase
                .from('course_lessons')
                .select('id')
                .in('topic_id', topicIds);

            const lessonIds = lessons?.map(l => l.id) || [];

            if (lessonIds.length > 0) {
                // Delete images
                await supabase.from('lesson_images').delete().in('lesson_id', lessonIds);
                // Delete lessons
                await supabase.from('course_lessons').delete().in('topic_id', topicIds);
            }

            // 4. Delete Topics
            await supabase.from('course_topics').delete().eq('course_id', courseId);
        }

        // 5. Delete Course
        const { error } = await supabase.from('courses').delete().eq('id', courseId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Delete failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
