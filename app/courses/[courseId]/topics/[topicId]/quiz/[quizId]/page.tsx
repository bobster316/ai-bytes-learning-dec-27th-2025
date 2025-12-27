import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopicQuizRenderer } from "@/components/course/topic-quiz-renderer";

interface PageProps {
    params: Promise<{
        courseId: string;
        topicId: string;
        quizId: string;
    }>;
}

export default async function TopicQuizPage(props: { params: Promise<{ courseId: string; topicId: string; quizId: string }> }) {
    const params = await props.params;
    const { courseId, quizId } = params;

    // We can't access canvas-confetti in server components, so logic is in Renderer (Client)
    const supabase = await createClient();

    const { data: quiz, error } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

    if (error || !quiz) {
        notFound();
    }

    // Try the main quiz_questions table first, then fall back to course_quiz_questions
    let questionsData = null;

    // Try primary table
    const { data: primaryQuestions } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId);

    if (primaryQuestions && primaryQuestions.length > 0) {
        questionsData = primaryQuestions;
    } else {
        // Fallback to course_quiz_questions (used by newer generation)
        const { data: courseQuestions } = await supabase
            .from('course_quiz_questions')
            .select('*')
            .eq('quiz_id', quizId);
        questionsData = courseQuestions;
    }

    // Attach questions to quiz object manually
    (quiz as any).questions = questionsData || [];

    if (error || !quiz) {
        notFound();
    }

    // Sort questions by order_index
    const questions = quiz.questions?.sort((a: any, b: any) => a.order_index - b.order_index) || [];

    return (
        <TopicQuizRenderer
            quizTitle={quiz.title}
            questions={questions}
            courseId={courseId}
        />
    );
}
