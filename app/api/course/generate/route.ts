
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AgentOrchestrator } from '@/lib/ai/agent-system';
import { imageService } from '@/lib/ai/image-service';
import { generateLessonHTML } from '@/lib/utils/lesson-renderer-v2';
import {
    safeParse,
    courseGenerationRequestSchema
} from '@/lib/validations/course-generator';
import type { CourseGenerationRequest } from '@/lib/types/course-generator';

export const runtime = 'nodejs'; // 1. Force Node.js runtime
export const maxDuration = 300; // 5 minutes

// Database helper functions
const db = {
    async createGenerationRecord(supabase: any, courseId: string) {
        const { data, error } = await supabase
            .from('course_generation_progress')
            .insert({
                course_id: courseId,
                status: 'in_progress',
                current_step: 'Initializing...',
                progress_percentage: 0
            })
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error("Failed to create generation record: no data returned");
        return data.id;
    },

    async updateGenerationProgress(generationId: string, step: string, percentage: number) {
        // Create a local client for updates to avoid passing the main client if needed
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabase
            .from('course_generation_progress')
            .update({
                current_step: step,
                progress_percentage: percentage,
                updated_at: new Date().toISOString()
            })
            .eq('id', generationId);
    },

    async markGenerationComplete(generationId: string, success: boolean, error?: string) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabase
            .from('course_generation_progress')
            .update({
                status: success ? 'completed' : 'failed',
                progress_percentage: success ? 100 : undefined,
                error_message: error,
                completed_at: new Date().toISOString()
            })
            .eq('id', generationId);
    }
};

export async function POST(req: NextRequest) {
    // 2. Explicitly use Service Role Key
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[API] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing! RLS bypass will fail.');
        return NextResponse.json({ success: false, error: 'Configuration Error' }, { status: 500 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const validationResult = safeParse(courseGenerationRequestSchema, body);
    if (!validationResult.success) {
        return NextResponse.json({ success: false, errors: validationResult.errors }, { status: 400 });
    }

    const input = validationResult.data as CourseGenerationRequest;
    const DRY_RUN = (body as any).dryRun === true;

    // --- STREAMING SETUP ---
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendEvent = async (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(message));
    };

    // Start background processing
    (async () => {
        let generationId: string | null = null;
        let courseId: string | null = null;

        try {
            await sendEvent({ stage: 'init', message: 'Initializing generation channel...' });

            const { courseName, difficultyLevel, courseDescription, targetDuration } = input;

            // 1. Create Course Record
            let course = { id: 'mock-course-id', title: courseName };
            if (!DRY_RUN) {
                const { data: c, error: cErr } = await supabase
                    .from('courses')
                    .insert({
                        title: courseName,
                        description: courseDescription || `AI-generated course on ${courseName}`,
                        difficulty_level: difficultyLevel,
                        published: false
                    })
                    .select()
                    .single();

                if (cErr) throw cErr;
                course = c;
            }
            courseId = course.id;

            // Create generation tracking record
            if (!DRY_RUN) {
                generationId = await db.createGenerationRecord(supabase, course.id);
            }

            await sendEvent({
                stage: 'setup',
                progress: 5,
                message: 'Course shell created.',
                courseId: course.id,
                generationId: generationId
            });

            // 2. Initialize Orchestrator
            const orchestrator = new AgentOrchestrator();

            // 3. Generate with Progress Callback
            await sendEvent({ stage: 'planning', progress: 10, message: 'Drafting curriculum structure...' });

            const completeCourse = await orchestrator.generateCourse({
                courseName,
                difficultyLevel,
                courseDescription,
                targetDuration: targetDuration || 60
            }, async (progress, message) => {
                // Bridge Orchestrator progress to Stream
                // Orchestrator progress 10-90 maps to our stream
                await sendEvent({
                    stage: 'generating', // generic stage
                    progress: progress,
                    message: message
                });

                // Also update DB if real run
                if (generationId && !DRY_RUN) {
                    // Fire and forget DB update to avoid slowing down stream?
                    // Better to await to ensure consistency but maybe throttle?
                    await db.updateGenerationProgress(generationId, message, progress);
                }
            });

            // 4. Post-Processing
            await sendEvent({ stage: 'finalizing', progress: 95, message: 'Finalizing course assets...' });

            if (!DRY_RUN && generationId) {
                await db.updateGenerationProgress(generationId, 'Fetching course thumbnail...', 96);
            }

            const thumbnail = !DRY_RUN ? await imageService.fetchCourseThumbnail(courseName) : "dry-run.jpg";
            if (!DRY_RUN) {
                const updates: any = { thumbnail_url: thumbnail };
                if (completeCourse.courseStructure.refinedCourseTitle) {
                    updates.title = completeCourse.courseStructure.refinedCourseTitle;
                }
                await supabase.from('courses').update(updates).eq('id', course.id);
            }

            // Persist content (Topics/Lessons)
            // Note: This logic was largely inside POST previously. 
            // We need to keep the exact same logic (simplified here for brevity of the diff, 
            // but effectively we must run the whole logic).
            // Since the logic is long, let's keep the existing logic structure but wrapped.

            // ... [Insert the Topic/Lesson Persistence Logic Here] ...
            // FOR SAFETY: I will paste the persistence logic from previous view, adapted to use `sendEvent`.

            await processPersistence(completeCourse, course, generationId, supabase, DRY_RUN, sendEvent);

            if (generationId && !DRY_RUN) {
                await db.markGenerationComplete(generationId, true);
            }

            await sendEvent({ stage: 'completed', progress: 100, message: 'Course generated successfully!', courseId: course.id });

        } catch (error: any) {
            console.error('[API] Stream Error:', error);
            if (generationId && !DRY_RUN) {
                await db.markGenerationComplete(generationId, false, error.message);
            }
            await sendEvent({ stage: 'error', message: error.message || 'Internal Server Error' });
        } finally {
            await writer.close();
        }
    })();

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

// Helper to keep the main function clean
async function processPersistence(
    completeCourse: any,
    course: any,
    generationId: string | null,
    supabase: any,
    DRY_RUN: boolean,
    sendEvent: (data: any) => Promise<void>
) {
    console.log(`[API] Processing ${completeCourse.courseStructure.topics.length} topics...`);
    let lessonPointer = 0;

    for (let i = 0; i < completeCourse.courseStructure.topics.length; i++) {
        const topic = completeCourse.courseStructure.topics[i];
        const topicTitle = topic.topicName || topic['title'] || `Topic ${i + 1}`;

        let topicData = { id: `mock-topic-${i}` };
        if (!DRY_RUN) {
            const { data, error } = await supabase.from('course_topics').insert({
                course_id: course.id,
                title: topicTitle,
                description: topic.description,
                order_index: i
            }).select().single();
            if (error) throw error;
            topicData = data;
        }

        const lessonPlans = completeCourse.lessons;
        const topicLessons = lessonPlans.slice(lessonPointer, lessonPointer + topic.lessons.length);

        for (let j = 0; j < topicLessons.length; j++) {
            const lessonContent = topicLessons[j];

            // Progress Update during persistence (Simulated)
            // It's fast, but good to show activity
            if (j === 0) await sendEvent({ stage: 'persisting', message: `Saving topic: ${topicTitle}` });

            const fullHtml = generateLessonHTML(lessonContent);

            // Image Persistence Logic (Parallelized)
            const images: any[] = [];
            const prompts = DRY_RUN ? [] : (lessonContent.imagePrompts || []); // Removed .slice(0, 3) limit

            console.log(`[API] Processing ${prompts.length} images for lesson: ${lessonContent.lessonTitle}`);

            // Fetch all images in parallel for this lesson
            const imageResults = await Promise.all(prompts.map(async (p) => {
                try {
                    // console.log(`[API] Generating image for prompt: "${p}"`);
                    const results = await imageService.fetchImages([p]);
                    return results && results.length > 0 ? results[0] : null;
                } catch (e) {
                    console.error(`[API] Image generation failed for prompt: "${p}"`, e);
                    return null;
                }
            }));

            // Filter out failures
            imageResults.forEach(img => {
                if (img) images.push(img);
            });

            let lessonData = { id: `mock-lesson-${j}` };
            if (!DRY_RUN) {
                const { data, error } = await supabase.from('course_lessons').insert({
                    topic_id: topicData.id,
                    title: lessonContent.lessonTitle,
                    content_markdown: JSON.stringify(lessonContent),
                    content_html: fullHtml,
                    order_index: j,
                    estimated_duration_minutes: lessonContent.metadata.estimatedDuration,
                    key_takeaways: lessonContent.metadata.keyTakeaways || []
                }).select().single();
                if (error) throw error;
                lessonData = data;
            }

            if (!DRY_RUN && images.length > 0) {
                await supabase.from('lesson_images').insert(images.map((img: any, idx: number) => ({
                    lesson_id: lessonData.id,
                    image_url: img.url,
                    alt_text: img.alt,
                    caption: img.caption,
                    order_index: idx,
                    source: 'ai_generated',
                    source_attribution: 'Generated by AI'
                })));
            }
        }
        lessonPointer += topic.lessons.length;

        // Quiz Persistence
        const assessments = (completeCourse as any).assessments || [];
        const quizQuestions = assessments.filter((q: any) => q.topicTitle === topicTitle || q.topicTitle === topic.topicName);

        if (quizQuestions.length > 0 && !DRY_RUN) {
            const { data: quiz } = await supabase.from('course_quizzes').insert({
                topic_id: topicData.id,
                title: `${topicTitle} Assessment`,
                passing_score_percentage: 70
            }).select().single();

            if (quiz) {
                await supabase.from('quiz_questions').insert(quizQuestions.map((q: any, idx: number) => ({
                    quiz_id: quiz.id,
                    question_text: q.question,
                    options: q.options,
                    correct_answer: q.correctAnswer,
                    explanation: q.explanation,
                    order_index: idx,
                    question_type: 'multiple_choice',
                    points: 10
                })));
            }
        }
    }
}