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
    const { courseId, topicId, quizId } = params;

    const supabase = await createClient();

    // 1. Fetch Quiz Data
    const { data: quiz, error } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

    if (error || !quiz) {
        notFound();
    }

    // 2. Fetch Questions (Primary or Fallback)
    let questionsData = null;
    const { data: primaryQuestions } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId);

    if (primaryQuestions && primaryQuestions.length > 0) {
        questionsData = primaryQuestions;
    } else {
        const { data: courseQuestions } = await supabase
            .from('course_quiz_questions')
            .select('*')
            .eq('quiz_id', quizId);
        questionsData = courseQuestions;
    }

    // Attach questions manually
    (quiz as any).questions = questionsData || [];

    // 3. Determine Next Step (Next Module or Course Complete)
    // Fetch minimal structure: Topics ordered by index
    const { data: course } = await supabase
        .from('courses')
        .select(`
            id,
            topics:course_topics(
                id,
                title,
                order_index,
                lessons:course_lessons(
                    id,
                    order_index
                )
            )
        `)
        .eq('id', courseId)
        .single();

    let nextUrl: string | null = null;
    let nextLabel: string = "Finish Course";

    if (course && course.topics) {
        const sortedTopics = course.topics.sort((a, b) => a.order_index - b.order_index);
        // Find current topic index. Note: topicId from params is string, DB might be number (bigint)
        // We should compare loosely or parse.
        const currentTopicIndex = sortedTopics.findIndex(t => String(t.id) === String(topicId));

        if (currentTopicIndex !== -1 && currentTopicIndex < sortedTopics.length - 1) {
            // There is a next topic
            const nextTopic = sortedTopics[currentTopicIndex + 1];
            // Get first lesson of next topic
            if (nextTopic.lessons && nextTopic.lessons.length > 0) {
                const sortedLessons = nextTopic.lessons.sort((a: any, b: any) => a.order_index - b.order_index);
                nextUrl = `/courses/${courseId}/lessons/${sortedLessons[0].id}`;
                nextLabel = `Next: ${nextTopic.title}`;
            }
        } else {
            // Last topic -> Finish Course
            nextUrl = `/courses/${courseId}/complete`; // New completion page we need to build
            nextLabel = "Finish Course";
        }
    }

    const questions = quiz.questions?.sort((a: any, b: any) => a.order_index - b.order_index) || [];

    return (
        <TopicQuizRenderer
            quizTitle={quiz.title}
            questions={questions}
            courseId={courseId}
            topicId={topicId} // Pass topicId for attempts
            quizId={quizId}   // Pass quizId for attempts
            nextUrl={nextUrl}
            nextLabel={nextLabel}
        />
    );
}

