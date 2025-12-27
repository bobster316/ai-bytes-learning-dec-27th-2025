
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/groq';
import { imageService } from '@/lib/ai/image-service';
import { generateLessonHTML } from '@/lib/utils/lesson-renderer';
import {
    validateCourseGenerationRequest,
    safeParse,
    courseGenerationRequestSchema
} from '@/lib/validations/course-generator';
import type { CourseGenerationRequest } from '@/lib/types/course-generator';

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
    const supabase = await createClient(true);
    try {
        const body = await req.json();
        const validationResult = safeParse(courseGenerationRequestSchema, body);

        if (!validationResult.success) {
            console.error('[API] Validation failed:', validationResult.errors);
            return NextResponse.json({ success: false, errors: validationResult.errors }, { status: 400 });
        }

        const input = validationResult.data as CourseGenerationRequest;
        const { courseName, difficultyLevel, courseDescription, targetDuration } = input;

        // 1. Create Course Record
        console.log('[API] Creating course record:', courseName);
        const { data: course, error: cErr } = await supabase
            .from('courses')
            .insert({
                title: courseName,
                description: courseDescription || `AI-generated course on ${courseName}`,
                published: false
            })
            .select()
            .single();

        if (cErr) {
            console.error('[API] Course creation error:', JSON.stringify(cErr, null, 2));
            throw cErr;
        }

        // 2. Generate Outline
        console.log('[API] Generating outline for:', courseName);
        const outline = await aiClient.generateOutline({
            courseName,
            difficultyLevel,
            courseDescription,
            targetDuration: targetDuration || 60
        });

        // Update course metadata
        console.log('[API] Fetching thumbnail...');
        const thumbnail = await imageService.fetchCourseThumbnail(courseName);
        await supabase.from('courses').update({
            thumbnail_url: thumbnail
        }).eq('id', course.id);

        // 3. Generate Topics and Lessons
        console.log(`[API] Processing ${outline.topics.length} topics...`);
        for (let i = 0; i < outline.topics.length; i++) {
            const topic = outline.topics[i];
            const { data: topicData, error: tErr } = await supabase
                .from('course_topics')
                .insert({
                    course_id: course.id,
                    title: topic.title,
                    description: topic.description,
                    order_index: i
                })
                .select()
                .single();

            if (tErr) throw tErr;

            if (topicData) {
                // Generate Lessons in Parallel
                console.log(`[API] Topic "${topic.title}": Generating ${topic.lessons.length} lessons...`);
                await Promise.all(topic.lessons.map(async (lesson, j) => {
                    const lessonContent = await aiClient.generateLessonContent(
                        lesson.title,
                        topic.title,
                        difficultyLevel
                    );

                    const images = await imageService.fetchImages(lessonContent.imagePrompts);

                    let videoUrl = null;
                    if (i === 0 && j === 0) {
                        videoUrl = await imageService.fetchVideo(courseName);
                    }

                    const fullHtml = generateLessonHTML(courseName, lessonContent, images);

                    const { data: lessonData } = await supabase
                        .from('course_lessons')
                        .insert({
                            topic_id: topicData.id,
                            title: lesson.title,
                            content_markdown: JSON.stringify(lessonContent),
                            content_html: fullHtml,
                            order_index: j,
                            estimated_duration_minutes: 15,
                            video_url: videoUrl
                        })
                        .select()
                        .single();

                    if (lessonData && images.length > 0) {
                        const imgPayload = images.map((img, idx) => ({
                            lesson_id: lessonData.id,
                            image_url: img.url,
                            alt_text: img.alt,
                            caption: img.caption,
                            order_index: idx
                        }));
                        await supabase.from('lesson_images').insert(imgPayload);
                    }
                }));

                // 4. Generate Topic Quiz (Post-Lesson)
                const lessonContexts = topic.lessons.map(l => l.title);
                console.log(`[API] Generating quiz for topic: ${topic.title}`);
                const quizData = await aiClient.generateTopicQuiz(topic.title, lessonContexts, difficultyLevel);

                const { data: quizRecord } = await supabase
                    .from('course_quizzes')
                    .insert({
                        topic_id: topicData.id,
                        title: `${topic.title} Assessment`,
                        passing_score_percentage: 70
                    })
                    .select()
                    .single();

                if (quizRecord && quizData.questions) {
                    const qPayload = quizData.questions.map((q: any, idx: number) => ({
                        quiz_id: quizRecord.id,
                        question_text: q.question,
                        options: q.options,
                        correct_answer: q.correctAnswer,
                        explanation: q.explanation,
                        order_index: idx,
                        question_type: 'multiple_choice',
                        points: 10
                    }));
                    await supabase.from('quiz_questions').insert(qPayload);
                }
            }
        }

        console.log('[API] Generation completed successfully for course:', course.id);
        return NextResponse.json({
            success: true,
            courseId: course.id,
            message: 'Course generated successfully'
        });

    } catch (error: any) {
        console.error('[API] Generation failed:', JSON.stringify(error, null, 2));
        console.error('[API] Error Message:', error.message);
        console.error('[API] Stack:', error.stack);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}