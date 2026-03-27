import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QuizRenderer } from "@/components/course/quiz-renderer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function QuizPage(props: { params: Promise<{ courseId: string; quizId: string }> }) {
    const params = await props.params;
    const { courseId, quizId } = params;
    const supabase = await createClient();

    // 1. Fetch Quiz Details with flattened Questions
    const { data: quiz, error: quizError } = await supabase
        .from('course_quizzes')
        .select(`
            *,
            questions:quiz_questions(*)
        `)
        .eq('id', quizId)
        .single();

    if (quizError || !quiz) {
        console.error("Quiz fetch error:", quizError);
        notFound();
    }

    // 2. Fetch Course Details (for breadcrumbs/context)
    const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();

    // 3. Transform Data for Renderer
    console.log("Quiz Raw Data (First Question):", quiz.questions?.[0]);

    // The DB stores options as a JSON array ['A', 'B'] and correct_answer as string 'A'
    const transformedQuestions = (quiz.questions || []).map((q: any) => {
        // q.options is array of strings
        // q.correct_answer is string matching one of the options
        return {
            id: q.id,
            question_text: q.question_text || q.question, // Fallback
            options: Array.isArray(q.options) ? q.options.map((optText: string, idx: number) => ({
                id: `opt-${q.id}-${idx}`,
                text: optText,
                is_correct: optText === q.correct_answer,
                explanation: q.explanation // DB stores explanation on the question, not per option usually
            })) : []
        };
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
            <div className="max-w-screen-xl mx-auto px-4 py-8">
                {/* Header / Nav */}
                <div className="mb-8 flex items-center gap-4">
                    <Link
                        href={`/courses/${courseId}`}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {quiz.title}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {course?.title || 'Course Quiz'}
                        </p>
                    </div>
                </div>

                {/* Interactive Quiz Component */}
                <QuizRenderer
                    courseId={courseId}
                    courseTitle={course?.title || ''}
                    quizId={quizId}
                    quizTitle={quiz.title}
                    questions={transformedQuestions}
                    passingScore={70}
                />
            </div>
        </div>
    );
}
