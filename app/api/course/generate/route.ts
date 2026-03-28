
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AgentOrchestrator } from '@/lib/ai/agent-system';
import fs from 'fs';
import path from 'path';
import { imageService } from '@/lib/ai/image-service';
// AI Avatar Integration - Using dynamic import in route handler
// import { videoGenerationService } from '@/lib/services/video-generation';
import { generateLessonHTML } from '@/lib/utils/lesson-renderer-v2';
import {
    safeParse,
    courseGenerationRequestSchema
} from '@/lib/validations/course-generator';
import type { CourseGenerationRequest } from '@/lib/types/course-generator';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pcmToWav } from '@/lib/utils/audio-utils';
import { generateCourseDNA, deriveDNAFingerprint } from "@/lib/ai/generate-course-dna";

export const runtime = 'nodejs'; // 1. Force Node.js runtime
export const maxDuration = 600; // 10 minutes — extended for audio generation

const AUDIO_OVERVIEW_PROMPT = `Generate a high-velocity, high-impact audio overview of this lesson.
Focus on explaining concepts through everyday metaphors. Use a friendly, expert-yet-approachable tone.
Both speakers MUST speak with a clear, professional, and natural British English accent. Avoid any Americanized inflections.

CRITICAL CONSTRAINTS:
1. TERMINOLOGY: Always refer to the content as a "lesson" or "deep dive". NEVER use the word "module".
2. OPENING: NEVER start with "Alright", "Okay", or "So". 
3. HOOK: Host A MUST start with a unique, compelling hook tailored to the specific lesson content below. 
4. VARIETY: Use conversational transitions like "Imagine a world where...", "Have you ever wondered why...", or "Let's cut straight to the chase."

Keep it under 3 minutes of speaking time.`;

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
        console.error('[API] ========================================');
        console.error('[API] VALIDATION ERROR');
        console.error('[API] ========================================');
        console.error('[API] Request Body:', JSON.stringify(body, null, 2));
        console.error('[API] Validation Errors:', JSON.stringify(validationResult.errors, null, 2));
        console.error('[API] ========================================');

        // Write to a log file for remote debugging
        try {
            const logPath = path.join(process.cwd(), 'logs', 'api-validation-error.log');
            fs.writeFileSync(logPath, JSON.stringify({ body, errors: validationResult.errors }, null, 2));
        } catch (e) {
            console.error('Failed to write validation log:', e);
        }

        const firstError = validationResult.errors?.[0];
        const errorMessage = firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Validation Failed';
        return NextResponse.json({ success: false, errors: validationResult.errors, message: errorMessage }, { status: 400 });
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

            const { courseName, difficultyLevel, courseDescription, targetDuration, videoSettings: rawVideoSettings } = input;

            // Synchronize hosts if gemma is selected for either, to avoid mixed instructors
            const videoSettings = rawVideoSettings ? {
                courseHost: (rawVideoSettings.courseHost === 'gemma' || rawVideoSettings.moduleHost === 'gemma') ? 'gemma' as const : 'sarah' as const,
                moduleHost: (rawVideoSettings.courseHost === 'gemma' || rawVideoSettings.moduleHost === 'gemma') ? 'gemma' as const : 'sarah' as const,
            } : undefined;

            console.log('[API] Processing with synchronized videoSettings:', JSON.stringify(videoSettings, null, 2));

            // 1. Create Course Record
            let course = { id: 'mock-course-id', title: courseName };
            if (!DRY_RUN) {
                const { data: c, error: cErr } = await supabase
                    .from('courses')
                    .insert({
                        title: courseName,
                        description: (courseDescription || `A comprehensive course on ${courseName}`) + (videoSettings?.courseHost === 'gemma' ? ' [gemma]' : ''),
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

            // Generate and persist CourseDNA — deterministic from course identity
            const courseDNA = generateCourseDNA(course.id, courseName, difficultyLevel);
            const dnaFingerprint = deriveDNAFingerprint(course.id, courseName, difficultyLevel);

            if (!DRY_RUN) {
                const { error: dnaError } = await supabase
                    .from("courses")
                    .update({ course_dna: courseDNA, dna_fingerprint: dnaFingerprint })
                    .eq("id", course.id);
                if (dnaError) {
                    console.warn("[API] CourseDNA persist failed (non-blocking):", dnaError.message);
                }
            }

            // Note: this v1 route is no longer the primary generation path.
            // New courses are generated via /api/course/generate-v2 (OrchestratorV2).
            // This route is retained for backwards-compatible dry-run testing only.

            // 2. Initialize Orchestrator
            const orchestrator = new AgentOrchestrator();

            // 3. Generate with Progress Callback
            await sendEvent({ stage: 'planning', progress: 10, message: 'Drafting curriculum structure...' });

            const completeCourse = await orchestrator.generateCourse({
                courseName,
                difficultyLevel,
                courseDescription,
                targetDuration: targetDuration || 60,
                topicCount: (input as any).topicCount,
                lessonsPerTopic: (input as any).lessonsPerTopic
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
            await sendEvent({ stage: 'finalizing', progress: 80, message: 'Finalizing course assets...' });

            if (!DRY_RUN && generationId) {
                await db.updateGenerationProgress(generationId, 'Fetching course thumbnail...', 80);
            }

            const thumbnail = !DRY_RUN
                ? await imageService.fetchCourseThumbnail(
                    courseName,
                    courseDescription,
                    completeCourse.courseStructure.courseMetadata.thumbnailPrompt
                )
                : "dry-run.jpg";
            if (!DRY_RUN) {
                const updates: any = {
                    thumbnail_url: thumbnail,
                    course_outcome: completeCourse.courseStructure.courseOutcome,
                    is_micro: completeCourse.courseStructure.isMicro ?? true
                };
                if (completeCourse.courseStructure.refinedCourseTitle) {
                    updates.title = completeCourse.courseStructure.refinedCourseTitle;
                }
                const seo = completeCourse?.courseStructure?.courseMetadata?.seo;
                if (seo) {
                    updates.seo_title = seo.title;
                    updates.seo_description = seo.description;
                    updates.seo_keywords = Array.isArray(seo.keywords) ? seo.keywords.join(", ") : seo.keywords;
                    updates.seo_slug = seo.slug;
                }
                const { error: updateError } = await supabase.from('courses').update(updates).eq('id', course.id);
                if (updateError) {
                    console.warn("[API] SEO update failed (non-blocking):", updateError.message);
                }
            }

            // Persist content (Topics/Lessons)
            // Note: This logic was largely inside POST previously. 
            // We need to keep the exact same logic (simplified here for brevity of the diff, 
            // but effectively we must run the whole logic).
            // Since the logic is long, let's keep the existing logic structure but wrapped.

            // ... [Insert the Topic/Lesson Persistence Logic Here] ...
            // FOR SAFETY: I will paste the persistence logic from previous view, adapted to use `sendEvent`.

            // ... [Insert the Topic/Lesson Persistence Logic Here] ...
            // FOR SAFETY: I will paste the persistence logic from previous view, adapted to use `sendEvent`.

            // AI Avatar Integration - ENABLED
            const { videoGenerationService } = await import('@/lib/services/video-generation');
            await processPersistence(completeCourse, course, generationId, supabase, DRY_RUN, sendEvent, videoGenerationService, videoSettings);

            if (generationId && !DRY_RUN) {
                await db.markGenerationComplete(generationId, true);
            }

            await sendEvent({ stage: 'completed', progress: 100, message: 'Course created! Your 45-second AI intro video is rendering in the background (ready in ~5-10 mins).', courseId: course.id });

        } catch (error: any) {
            console.error('[API] ========================================');
            console.error('[API] COURSE GENERATION ERROR');
            console.error('[API] ========================================');
            console.error('[API] Error Message:', error.message);
            console.error('[API] Error Stack:', error.stack);
            console.error('[API] Error Object:', JSON.stringify(error, null, 2));
            console.error('[API] ========================================');

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
    sendEvent: (data: any) => Promise<void>,
    videoService: any,
    videoSettings?: { courseHost: 'sarah' | 'gemma', moduleHost: 'sarah' | 'gemma' }
) {
    console.log(`[API] Processing ${completeCourse.courseStructure.topics.length} topics...`);

    // Map settings to IDs
    const getAvatarId = (key: string | undefined): 'sarah' | 'gemma' => {
        if (key === 'gemma') return 'gemma';
        return 'sarah';
    };

    console.log('[API] Received videoSettings:', JSON.stringify(videoSettings, null, 2));

    const courseAvatar = getAvatarId(videoSettings?.courseHost);

    console.log(`[API] Resolved Avatar - Course: ${courseAvatar}`);

    const videoRequests: any[] = [];
    // Collects lesson IDs + brief text for audio generation after all lessons are saved
    const lessonMediaQueue: { lessonId: string; brief: string }[] = [];

    // 1. Queue Course Intro
    console.log('[API] ========================================');
    console.log('[API] VIDEO SCRIPT GENERATION CHECK');
    console.log('[API] ========================================');
    console.log('[API] Course intro script exists:', !!completeCourse.courseStructure.introVideoScript);
    if (completeCourse.courseStructure.introVideoScript) {
        console.log('[API] Course intro script keys:', Object.keys(completeCourse.courseStructure.introVideoScript));
        console.log('[API] Course intro script sample:', JSON.stringify(completeCourse.courseStructure.introVideoScript).substring(0, 200));
    }
    console.log('[API] ========================================');

    if (completeCourse.courseStructure.introVideoScript) {
        console.log('[API] ✅ Queuing course intro video...');
        videoRequests.push({
            type: 'course_introduction',
            entityId: course.id,
            script: completeCourse.courseStructure.introVideoScript,
            avatar: courseAvatar
        });
        console.log('[API] ✅ Course intro video queued. Total requests:', videoRequests.length);
    } else {
        console.log('[API] ⚠️  No intro video script found in course structure');
    }
    let lessonPointer = 0;

    for (let i = 0; i < completeCourse.courseStructure.topics.length; i++) {
        const topic = completeCourse.courseStructure.topics[i];
        const topicTitle = topic.topicName || topic['title'] || `Topic ${i + 1}`;

        let topicData = { id: `mock-topic-${i}` };
        if (!DRY_RUN) {
            const { data, error } = await supabase.from('course_topics').insert({
                course_id: course.id,
                title: topicTitle,
                description: topic.description + (videoSettings?.moduleHost === 'gemma' ? ' [gemma]' : ''),
                order_index: i,
                thumbnail_url: await (async () => {
                    if (DRY_RUN || !topic.moduleImagePrompt) return null;
                    try {
                        const imgs = await imageService.fetchImages([topic.moduleImagePrompt]);
                        return imgs[0]?.url || null;
                    } catch (e) {
                        console.error(`[API] Topic thumbnail generation failed for ${topicTitle}:`, e);
                        return null;
                    }
                })()
            }).select().single();
            if (error) throw error;
            topicData = data;
        }

        // 2. Module intro videos intentionally skipped - only 1 course intro video per course

        const lessonPlans = completeCourse.lessons;
        const topicLessons = lessonPlans.slice(lessonPointer, lessonPointer + topic.lessons.length);

        for (let j = 0; j < topicLessons.length; j++) {
            const lessonContent = topicLessons[j];

            // Progress Update during persistence (Simulated)
            // It's fast, but good to show activity
            // Progress Update during persistence (Simulated)
            // Calculate progress between 80% and 95%
            const totalItems = completeCourse.courseStructure.topics.reduce((acc: number, t: any) => acc + (t.lessons?.length || 0), 0) || 1;
            const currentItem = completeCourse.courseStructure.topics.slice(0, i).reduce((acc: number, t: any) => acc + (t.lessons?.length || 0), 0) + j + 1;
            const persistenceProgress = 80 + Math.floor((currentItem / totalItems) * 15);

            await sendEvent({
                stage: 'persisting',
                progress: Math.min(persistenceProgress, 95),
                message: `Saving lesson: ${lessonContent.lessonTitle} (${persistenceProgress}%)`
            });

            const fullHtml = generateLessonHTML(lessonContent);

            // Image Persistence Logic (Single Optimized Service Call)
            const rawPrompts = DRY_RUN ? [] : (lessonContent.imagePrompts || []);
            const prompts = rawPrompts.map((p: any) => typeof p === 'string' ? p : p.prompt);

            console.log(`[API] Processing ${prompts.length} unique visuals for lesson: ${lessonContent.lessonTitle}`);

            // Fetch all images in ONE batch to ensure unique seeds/indexing
            let images: any[] = [];
            if (!DRY_RUN && prompts.length > 0) {
                try {
                    images = await imageService.fetchImages(prompts);
                } catch (e) {
                    console.error(`[API] Batch image generation failed for ${lessonContent.lessonTitle}:`, e);
                }
            }

            let lessonData = { id: `mock-lesson-${j}` };
            if (!DRY_RUN) {
                const lessonPlan = topic.lessons[j];
                const { data, error } = await supabase.from('course_lessons').insert({
                    topic_id: topicData.id,
                    title: lessonContent.lessonTitle,
                    content_markdown: JSON.stringify({
                        ...lessonContent,
                        instructor: videoSettings?.moduleHost || 'sarah'
                    }),
                    content_html: fullHtml,
                    order_index: j,
                    estimated_minutes: lessonPlan.estimatedDuration || 7,
                    micro_objective: lessonPlan.microObjective,
                    lesson_action: lessonPlan.lessonAction,
                    key_takeaways: lessonContent.metadata?.keyTakeaways || []
                }).select().single();
                if (error) throw error;
                lessonData = data;

                // Queue this lesson for audio generation after all lessons are saved
                const brief = (lessonContent.topicContent || JSON.stringify(lessonContent)).slice(0, 3000);
                lessonMediaQueue.push({ lessonId: lessonData.id, brief });
            }

            if (!DRY_RUN && images.length > 0) {
                await supabase.from('lesson_images').insert(images.map((img: any, idx: number) => ({
                    lesson_id: lessonData.id,
                    image_url: img.url,
                    alt_text: img.alt,
                    caption: img.caption,
                    order_index: idx,
                    source: 'ai_generated',
                    source_attribution: 'AI Bytes Learning'
                })));
            }

            // Lesson intro videos intentionally skipped - only 1 course intro video per course
        }
        lessonPointer += topic.lessons.length;

        // Quiz Persistence
        const assessments = (completeCourse as any).assessments || [];
        console.log(`[API] Checking for quizzes... Assessments found: ${assessments.length}`);

        // Find questions for this topic (robust matching)
        const quizQuestions = assessments.filter((q: any) => {
            const qTopic = (q.topicTitle || q.topicName || "").trim().toLowerCase();
            const cTopic = (topicTitle || topic.topicName || "").trim().toLowerCase();
            return qTopic.includes(cTopic) || cTopic.includes(qTopic);
        });

        console.log(`[API] Found ${quizQuestions.length} questions for topic "${topicTitle}"`);

        if (quizQuestions.length > 0 && !DRY_RUN) {
            const { data: quiz, error: quizError } = await supabase.from('course_quizzes').insert({
                topic_id: topicData.id,
                title: `${topicTitle} Assessment`,
                passing_score_percentage: 70
            }).select().single();

            if (quizError) {
                console.error(`[API] Failed to create quiz for topic ${topicTitle}:`, quizError);
            } else if (quiz) {
                const questionsToInsert = quizQuestions.map((q: any, idx: number) => {
                    // map "A" -> "Actual Answer Text"
                    const correctOption = q.options.find((o: any) => o.letter === q.correctAnswer);
                    const correctAnswerText = correctOption ? correctOption.text : q.correctAnswer;

                    return {
                        quiz_id: quiz.id,
                        question_text: q.questionText,
                        options: q.options.map((o: any) => o.text), // Array of strings
                        correct_answer: correctAnswerText,
                        explanation: JSON.stringify({
                            text: q.difficultyRationale || "Review the lesson content.",
                            correct: q.correctFeedback || "Correct!",
                            incorrect: q.incorrectFeedback || "Incorrect. Try again.",
                            cognitive: q.cognitiveLevel,
                            timer: q.timeLimit || 30,
                            objective: q.learningObjective
                        }),
                        order_index: idx,
                        question_type: 'multiple_choice',
                        points: 10
                    };
                });

                const { error: qError } = await supabase.from('quiz_questions').insert(questionsToInsert);
                if (qError) {
                    console.error(`[API] Failed to insert questions for quiz ${quiz.id}:`, qError);
                } else {
                    console.log(`[API] ✅ Successfully created quiz with ${questionsToInsert.length} questions for "${topicTitle}"`);
                }
            }
        }
    }

    // --- AUDIO GENERATION PASS ---
    // Generate a 2-speaker Gemini TTS overview for every lesson (fire sequentially, skip on error)
    if (!DRY_RUN && lessonMediaQueue.length > 0) {
        await sendEvent({ stage: 'audio', progress: 92, message: `Generating audio overviews for ${lessonMediaQueue.length} lessons...` });
        try {
            const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
            const audioModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-tts' });
            let audioGenerated = 0;

            for (const item of lessonMediaQueue) {
                try {
                    const audioResult = await (audioModel as any).generateContent({
                        contents: [{ role: 'user', parts: [{ text: `${AUDIO_OVERVIEW_PROMPT}\n\nLESSON BRIEF:\n${item.brief}` }] }],
                        generationConfig: {
                            responseModalities: ['AUDIO'],
                            speechConfig: {
                                multiSpeakerVoiceConfig: {
                                    speakerVoiceConfigs: [
                                        { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Sadaltager' } }, speaker: 'Host A' },
                                        { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }, speaker: 'Host B' }
                                    ]
                                }
                            }
                        } as any
                    });

                    const audioPart = audioResult.response.candidates[0].content.parts
                        .find((p: any) => p.inlineData?.mimeType?.startsWith('audio/'));

                    if (audioPart?.inlineData?.data) {
                        const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
                        const audioBuffer = pcmToWav(pcmBuffer);
                        const fileName = `lessons/${course.id}/${item.lessonId}/overview.wav`;

                        await supabase.storage
                            .from('course-assets')
                            .upload(fileName, audioBuffer, { contentType: 'audio/wav', upsert: true });

                        const { data: { publicUrl } } = supabase.storage.from('course-assets').getPublicUrl(fileName);
                        await supabase.from('course_lessons').update({ audio_url: publicUrl }).eq('id', item.lessonId);
                        audioGenerated++;
                    }
                } catch (audioErr) {
                    console.error(`[API] Audio generation failed for lesson ${item.lessonId} (non-fatal):`, audioErr);
                }

                await sendEvent({
                    stage: 'audio',
                    progress: 92 + Math.floor((audioGenerated / lessonMediaQueue.length) * 3),
                    message: `Audio overview generated (${audioGenerated}/${lessonMediaQueue.length})`
                });
            }

            console.log(`[API] ✅ Audio generation complete: ${audioGenerated}/${lessonMediaQueue.length} lessons`);
        } catch (audioSetupErr) {
            console.error('[API] Audio generation setup failed (non-fatal):', audioSetupErr);
        }
    }

    // AI Avatar Integration - Trigger Video Generation
    console.log('[API] ========================================');
    console.log('[API] VIDEO GENERATION CHECK');
    console.log('[API] ========================================');
    console.log('[API] Total video requests:', videoRequests.length);
    console.log('[API] DRY_RUN:', DRY_RUN);
    console.log('[API] videoService available:', !!videoService);
    console.log('[API] ========================================');

    if (videoRequests.length > 0 && !DRY_RUN && videoService) {
        await sendEvent({ stage: 'videos', progress: 95, message: `Starting generation of ${videoRequests.length} AI avatar videos...` });
        try {
            console.log('[API] 🎬 Starting video batch generation...');
            const videoResults = await videoService.triggerCourseVideoBatch(course.id, course.title, videoRequests, {
                useElevenLabs: true,  // ✅ Using ElevenLabs for audio
                useHeyGen: true,      // ✅ Using HeyGen for video
                checkQuota: true
            });

            console.log('[API] ========================================');
            console.log('[API] VIDEO GENERATION RESULTS');
            console.log('[API] ========================================');
            console.log('[API] videoResults type:', typeof videoResults);
            console.log('[API] videoResults keys:', Object.keys(videoResults));
            console.log('[API] videoResults entries:', Object.entries(videoResults).length);
            console.log('[API] videoResults:', JSON.stringify(videoResults, null, 2));
            console.log('[API] ========================================');

            // Persist Job IDs to database
            for (const [entityId, jobId] of Object.entries(videoResults)) {
                try {
                    console.log(`[API] Processing entity ${entityId} with jobId: ${jobId}`);
                    console.log(`[API] Comparing entityId (${typeof entityId}): "${entityId}" with course.id (${typeof course.id}): "${course.id}"`);

                    // Convert both to strings for comparison (course.id might be number, entityId is string)
                    if (String(entityId) === String(course.id)) {
                        // Update course with intro video job ID
                        console.log(`[API] ✅ MATCH! This is the course intro video`);
                        const { data: courseData, error: courseError } = await supabase.from('courses').update({
                            intro_video_job_id: jobId,
                            intro_video_status: 'queued'
                        }).eq('id', entityId).select();

                        if (courseError) {
                            console.error(`[API] ❌ Failed to update Course Video Job ID:`, courseError);
                            throw new Error(`Database update failed: ${courseError.message}`);
                        } else if (!courseData || courseData.length === 0) {
                            console.error(`[API] ❌ Course update returned no rows for ID: ${entityId}`);
                            throw new Error(`Course ID ${entityId} not found in database`);
                        } else {
                            console.log(`[API] ✅ Course Intro Video Job ID saved: ${jobId}`);
                            console.log(`[API]    Verified in database: ${courseData[0].intro_video_job_id}`);
                        }
                    } else {
                        // Try updating Lesson first
                        const { count: lessonCount, error: lessonError } = await supabase.from('course_lessons').update({
                            intro_video_job_id: jobId,
                            intro_video_status: 'queued'
                        }).eq('id', entityId).select('id', { count: 'exact' });

                        if (lessonCount && lessonCount > 0) {
                            console.log(`[API] ✅ Lesson Video Job ID saved: ${jobId} for lesson ${entityId}`);
                        } else {
                            // If not a lesson, try Topic
                            const { count: topicCount, error: topicError } = await supabase.from('course_topics').update({
                                intro_video_job_id: jobId,
                                intro_video_status: 'queued'
                            }).eq('id', entityId).select('id', { count: 'exact' });

                            if (topicCount && topicCount > 0) {
                                console.log(`[API] ✅ Topic Video Job ID saved: ${jobId} for topic ${entityId}`);
                            } else {
                                console.warn(`[API] ⚠️ Video Job ID ${jobId} matched no Lesson or Topic for entity ${entityId}`);
                            }
                        }
                    }
                } catch (e) {
                    console.error(`[API] ❌ Failed to save video job ID for ${entityId}`, e);
                }
            }
        } catch (videoError) {
            console.error("[API] Video Generation Failed:", videoError);
            // Don't fail the whole course generation, just log
            await sendEvent({ stage: 'warning', message: 'Video generation failed, but course is saved.' });
        }
    }
}
