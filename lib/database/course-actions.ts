import { SupabaseClient } from '@supabase/supabase-js';
import { CourseGenerated } from '@/lib/types/course-generator';

export async function saveCourseTemplate(
    supabase: SupabaseClient,
    data: CourseGenerated
) {
    // 1. Insert Template Path Info
    const { data: template, error: templateError } = await supabase
        .from('course_templates')
        .insert({
            title: data.courseTitle,
            difficulty: data.difficultyLevel,
            description: data.description,
            estimated_duration_hours: data.estimatedDurationHours,
            learning_objectives: data.learningObjectives,
            thumbnail_prompt: data.courseThumbnailPrompt,
        })
        .select()
        .single();

    if (templateError) throw templateError;

    // 2. Insert Topics
    // We need to loop because we need IDs for lessons
    for (const [tIndex, topic] of data.topics.entries()) {
        const { data: topicData, error: topicError } = await supabase
            .from('template_topics')
            .insert({
                template_id: template.id,
                title: topic.topicTitle,
                introduction: topic.introduction,
                key_outcomes: topic.keyOutcomes,
                image_prompt: topic.topicImagePrompt,
                position: tIndex,
            })
            .select()
            .single();

        if (topicError) throw topicError;

        // 3. Insert Lessons
        for (const [lIndex, lesson] of topic.lessons.entries()) {
            await supabase.from('template_lessons').insert({
                topic_id: topicData.id,
                title: lesson.lessonTitle,
                summary: lesson.lessonSummary,
                content: lesson.content,
                image_prompts: lesson.imagePrompts,
                position: lIndex,
            });
        }

        // 4. Insert Quiz
        const { data: quizData, error: quizError } = await supabase
            .from('template_quizzes')
            .insert({
                topic_id: topicData.id,
            })
            .select()
            .single();

        if (quizError) throw quizError;

        // 5. Insert Quiz Questions
        const questionsPayload = topic.quiz.questions.map((q, qIndex) => ({
            quiz_id: quizData.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correctAnswer,
            explanation: q.explanation,
            position: qIndex,
        }));

        if (questionsPayload.length > 0) {
            await supabase.from('template_quiz_questions').insert(questionsPayload);
        }
    }

    return template.id;
}

export async function publishTemplateToCourse(
    supabase: SupabaseClient,
    templateId: string
) {
    // 1. Fetch entire template tree
    const { data: template } = await supabase.from('course_templates').select('*').eq('id', templateId).single();
    if (!template) throw new Error("Template not found");

    // 2. Insert Course Parent
    const { data: course, error: courseActionError } = await supabase.from('courses').insert({
        template_id: template.id,
        title: template.title,
        difficulty: template.difficulty,
        description: template.description,
        estimated_duration_hours: template.estimated_duration_hours,
        learning_objectives: template.learning_objectives,
        thumbnail_prompt: template.thumbnail_prompt,
        // thumbnail_url: null (generation usually happens later or we assume prompt is enough for now)
        published: true
    }).select().single();

    if (courseActionError) throw courseActionError;

    // 3. Migrate Topics
    const { data: topics } = await supabase.from('template_topics').select('*').eq('template_id', templateId);

    if (topics) {
        for (const topic of topics) {
            const { data: newTopic } = await supabase.from('course_topics').insert({
                course_id: course.id,
                title: topic.title,
                introduction: topic.introduction,
                key_outcomes: topic.key_outcomes,
                image_prompt: topic.image_prompt,
                position: topic.position
            }).select().single();

            if (!newTopic) continue;

            // Lessons
            const { data: lessons } = await supabase.from('template_lessons').select('*').eq('topic_id', topic.id);
            if (lessons) {
                const lessonPayload = lessons.map(l => ({
                    topic_id: newTopic.id,
                    title: l.title,
                    summary: l.summary,
                    content: l.content,
                    position: l.position
                }));
                // Note: we're dropping lesson_images here or we need a table for them. 
                // The schema has course_lesson_images.
                // We should iterate to handle image prompts as placeholders?
                // For now, let's insert lessons, then handle images if needed.

                // Simpler: iterate lessons to insert images too
                for (const l of lessons) {
                    const { data: newLesson } = await supabase.from('course_lessons').insert({
                        topic_id: newTopic.id,
                        title: l.title,
                        summary: l.summary,
                        content: l.content,
                        position: l.position
                    }).select().single();

                    // Transfer image prompts to image table?
                    // Spec says: "Images (via prompts for now)"
                    // Template has image_prompts array. Course schema has course_lesson_images table.
                    if (l.image_prompts && newLesson) {
                        const imgPayload = l.image_prompts.map((p: string, i: number) => ({
                            lesson_id: newLesson.id,
                            image_prompt: p,
                            position: i
                        }));
                        await supabase.from('course_lesson_images').insert(imgPayload);
                    }
                }
            }

            // Quizzes
            const { data: quizzes } = await supabase.from('template_quizzes').select('*').eq('topic_id', topic.id);
            if (quizzes) {
                for (const q of quizzes) {
                    const { data: newQuiz } = await supabase.from('course_quizzes').insert({
                        topic_id: newTopic.id
                    }).select().single();

                    if (newQuiz) {
                        const { data: questions } = await supabase.from('template_quiz_questions').select('*').eq('quiz_id', q.id);
                        if (questions) {
                            const qPayload = questions.map(qq => ({
                                quiz_id: newQuiz.id,
                                question: qq.question,
                                options: qq.options,
                                correct_answer: qq.correct_answer,
                                explanation: qq.explanation,
                                position: qq.position
                            }));
                            await supabase.from('course_quiz_questions').insert(qPayload);
                        }
                    }
                }
            }
        }
    }

    // 4. Lock Template
    await supabase.from('course_templates').update({ is_locked: true }).eq('id', templateId);

    return course.id;
}
