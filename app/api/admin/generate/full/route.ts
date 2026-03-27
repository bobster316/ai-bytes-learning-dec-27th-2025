
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiClient } from '@/lib/ai/groq';
import { imageService } from '@/lib/ai/image-service';
import { generateLessonHTML } from '@/lib/utils/lesson-renderer';

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
    const supabase = await createClient(true);
    try {
        const body = await req.json();
        const { title, difficulty, description } = body;

        // 1. Create Course Record
        const { data: course, error: cErr } = await supabase
            .from('courses')
            .insert({
                title,
                description,
                published: false
            })
            .select()
            .single();

        if (cErr) throw cErr;

        // 2. Generate Outline
        const outline = await aiClient.generateOutline({
            courseName: title,
            difficultyLevel: difficulty,
            courseDescription: description,
            targetDuration: 60
        });

        // Calculate Price based on Difficulty
        let price = 15.00; // Default / Beginner
        const diffLower = difficulty.toLowerCase();
        if (diffLower.includes('intermediate')) price = 20.00;
        else if (diffLower.includes('advanced')) price = 25.00;

        // Update course with objectives and thumbnail
        const thumbnail = await imageService.fetchCourseThumbnail(title);

        // 1. Update Core Fields
        await supabase.from('courses').update({
            learning_objectives: outline.learningObjectives,
            image_url: thumbnail,
            difficulty_level: difficulty,
        }).eq('id', course.id);

        // 2. Try to update Price (fails gracefully if db column missing)
        try {
            await supabase.from('courses').update({
                price: price
            }).eq('id', course.id);
        } catch (e) {
            console.warn("Could not update course price. 'price' column might be missing.");
        }

        // 3. Generate Topics and Lessons (Optimal Parallelization)
        // We process topics sequentially to maintain order and avoid hitting rate limits too hard,
        // but parallelize lessons within each topic.
        for (let i = 0; i < outline.topics.length; i++) {
            const topic = outline.topics[i];

            // Fetch Topic Thumbnail (100% relevant high quality)
            let topicThumbnail = null;
            try {
                const topicImages = await imageService.fetchImages([topic.title + " abstract technology"]);
                if (topicImages.length > 0) topicThumbnail = topicImages[0].url;
            } catch (e) {
                console.warn(`Failed to fetch thumbnail for topic ${topic.title}`);
            }

            const { data: topicData, error: tErr } = await supabase
                .from('course_topics')
                .insert({
                    course_id: course.id,
                    title: topic.title,
                    description: topic.description,
                    order_index: i,
                    thumbnail_url: topicThumbnail
                })
                .select()
                .single();

            if (tErr) throw tErr;

            if (topicData) {
                // Parallel Lesson Generation for this topic
                await Promise.all(topic.lessons.map(async (lesson, j) => {
                    // Generate rich content
                    const lessonContent = await aiClient.generateLessonContent(
                        lesson.title,
                        topic.title,
                        difficulty
                    );

                    // Fetch exactly 6 unique high-relevance images
                    const imagePromptsToFetch = lessonContent.metadata?.imagePrompts || [];
                    const images = await imageService.fetchImages(imagePromptsToFetch);

                    // Fetch a 100% relevant video for the FIRST lesson only (Course Introduction)
                    let videoUrl = null;
                    if (i === 0 && j === 0) {
                        // Use the Course Title primarily for the intro video to ensure high relevance
                        // We strip "Advanced" or other modifiers if needed, but usually the Title is best.
                        const query = title;
                        console.log(`[Content] Fetching relevant video for course intro: ${query}`);
                        videoUrl = await imageService.fetchVideo(query);
                    }

                    // Render HTML with new en-GB content
                    const fullHtml = generateLessonHTML(title, lessonContent, images);

                    // Create Lesson Record
                    const { data: lessonData } = await supabase
                        .from('course_lessons')
                        .insert({
                            topic_id: topicData.id,
                            title: lesson.title,
                            content_markdown: "Replaced by structurally generated JSON blocks.",
                            content_html: fullHtml || "",
                            content_blocks: lessonContent.blocks || lessonContent,
                            order_index: j,
                            estimated_duration_minutes: difficulty === 'advanced' ? 20 : (difficulty === 'intermediate' ? 15 : 10),
                            video_url: videoUrl // New: Persist video URL
                        })
                        .select()
                        .single();

                    // Save Images
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
                const quizData = await aiClient.generateTopicQuiz(topic.title, lessonContexts, difficulty);

                // Save Quiz
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

        return NextResponse.json({ success: true, courseId: course.id });

    } catch (error: any) {
        console.error('[API] Full generation failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
