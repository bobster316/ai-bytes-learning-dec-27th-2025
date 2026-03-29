import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonContentRenderer from "@/components/course/lesson-content-renderer";
import { LessonSidebar } from "@/components/course/lesson-sidebar";
import { LessonNavigation } from "@/components/course/lesson-navigation";
import { SimpleLessonNavigation } from "@/components/course/simple-lesson-navigation";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { checkLessonAccess, recordLessonAccess } from "@/lib/subscriptions/check-access";
import { AccessBlocked } from "@/components/subscription/access-blocked";
import { buildMetadata } from "@/lib/seo";
import { LessonClientUtils } from "@/components/course/lesson-client-utils";
import { LessonTopNav } from "@/components/course/lesson-top-nav";
import { LessonClientWrapper } from "@/components/course/lesson-client-wrapper";

function stripHtml(input: string) {
    return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, max = 160) {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, "").trim() + "…";
}

// Helper to clean raw prompt titles
const cleanTitle = (t: string) => {
    if (!t) return "";
    let cleaned = t
        .split(/Target Audience:/i)[0]
        .split(/Difficulty:/i)[0]
        .split(/Number of Modules:/i)[0];

    // Remove standalone difficulty levels or those followed by a colon
    cleaned = cleaned.replace(/\b(Beginner|Intermediate|Advanced|Mastery)\b\s*:/gi, '');
    cleaned = cleaned.replace(/:\s*\b(Beginner|Intermediate|Advanced|Mastery)\b/gi, '');

    // Remove "Level X"
    cleaned = cleaned.replace(/\bLevel\s+\d+\b/gi, '');

    // Clean up resulting punctuation/spacing
    return cleaned
        .replace(/^:\s*/, '') // Leading colon
        .replace(/:\s*$/, '') // Trailing colon
        .replace(/\s+:\s+/g, ': ') // Fix spacing around colons
        .replace(/\s+/g, ' ') // Collapse spaces
        .replace(/\.\s*$/, '') // Trailing dot
        .trim();
};

export async function generateMetadata(
    props: { params: Promise<{ courseId: string; lessonId: string }> }
): Promise<Metadata> {
    const params = await props.params;
    const supabase = await createClient(true);
    const { data: lesson } = await supabase
        .from('course_lessons')
        .select('id, title, content_markdown, content_html, content_blocks, lesson_personality, micro_variation_seed, topic:course_topics(id, title, course_id)')
        .eq('id', params.lessonId)
        .single();

    let courseTitle = "AI Bytes Course";

    // Handle Supabase joining returning an Array for foreign tables in some configurations
    const topicData = Array.isArray(lesson?.topic) ? lesson.topic[0] : lesson?.topic;

    if (topicData?.course_id) {
        const { data: course } = await supabase
            .from('courses')
            .select('title')
            .eq('id', topicData.course_id)
            .single();
        if (course?.title) courseTitle = cleanTitle(course.title);
    }

    let description = "";
    try {
        if (lesson?.content_markdown && lesson.content_markdown.trim().startsWith("{")) {
            const parsed = JSON.parse(lesson.content_markdown);
            if (typeof parsed?.topicContent === "string") description = parsed.topicContent;
        }
    } catch {
        // ignore
    }
    if (!description && lesson?.content_html) {
        description = stripHtml(lesson.content_html);
    }
    description = truncate(description || `Lesson from ${courseTitle}.`);

    const title = lesson?.title ? `${lesson.title} | ${courseTitle}` : courseTitle;

    return buildMetadata({
        title,
        description,
        path: `/courses/${params.courseId}/lessons/${params.lessonId}`,
    });
}


export default async function LessonPage(props: { params: Promise<{ courseId: string; lessonId: string }> }) {
    const params = await props.params;
    const { courseId, lessonId } = params;

    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Check subscription access
    const accessCheck = await checkLessonAccess(user?.id, lessonId);

    // Fetch Lesson with Topic and Course info
    const { data: lesson, error } = await supabase
        .from('course_lessons')
        .select(`
      *,
      topic:course_topics(
        id,
        title,
        course_id,
        audio_url
      )
    `)
        .eq('id', lessonId)
        .single();

    if (error || !lesson) {
        notFound();
    }

    const topicData = Array.isArray(lesson.topic) ? lesson.topic[0] : lesson.topic;
    const resolvedCourseId = topicData?.course_id || courseId;

    // If user doesn't have access, show upgrade prompt
    // BYPASSED TEMPORARILY
    if (false && !accessCheck.hasAccess) {
        return (
            <div className="min-h-screen bg-background text-foreground font-sans">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Show lesson title but block content */}
                    <div className="py-8 px-4">
                        <Link
                            href={`/courses/${resolvedCourseId}`}
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Course Overview
                        </Link>
                        <h1 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight mb-2">
                            {lesson.title}
                        </h1>
                        <p className="text-muted-foreground">
                            {lesson.topic?.title || 'Module'}
                        </p>
                    </div>

                    {/* Access blocked component */}
                    <AccessBlocked
                        reason={accessCheck.reason || 'Upgrade to access this content.'}
                        plan={accessCheck.plan}
                        bytesUsed={accessCheck.bytesUsed}
                        bytesLimit={accessCheck.bytesLimit}
                        isLoggedOut={!user}
                    />
                </div>
            </div>
        );
    }

    // Record access if this is a new byte (first time accessing)
    if (user && accessCheck.isNewByte) {
        await recordLessonAccess(user.id, lessonId);
    }

    // Fetch Full Course Outline for Sidebar
    const { data: courseOutline } = await supabase
        .from('courses')
        .select(`
            title,
            course_type,
            difficulty,
            topics:course_topics(
                id,
                title,
                order_index,
                lessons:course_lessons(
                    id,
                    title,
                    order_index
                ),
                quizzes:course_quizzes(
                    id,
                    title
                )
            )
        `)
        .eq('id', resolvedCourseId)
        .single();

    // Sort outline
    if (courseOutline && courseOutline.topics) {
        courseOutline.topics.sort((a, b) => a.order_index - b.order_index);
        courseOutline.topics.forEach((t: any) => {
            if (t.lessons) t.lessons.sort((a: any, b: any) => a.order_index - b.order_index);
        });
    }

    // Fetch Images
    const { data: images } = await supabase
        .from('lesson_images')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

    // Safe JSON Parse
    let contentJson: any = null;
    try {
        if (lesson.content_markdown && lesson.content_markdown.trim().startsWith('{')) {
            contentJson = JSON.parse(lesson.content_markdown);
            // Inject the video_url from the DB column into the content JSON
            if (lesson.video_url) {
                contentJson.video_url = lesson.video_url;
            } else if (lesson.video_job_id) {
                // Inject placeholder for pending job
                contentJson.video_url = `JOB_PENDING:${lesson.video_job_id}`;
            }
        }
    } catch (e) {
        // Silent fail, fallback to HTML or Blocks
    }

    const hasBlocks = lesson.content_blocks && Array.isArray(lesson.content_blocks) && lesson.content_blocks.length > 0;

    // Determine Render Mode
    const useNativeRender = !!contentJson || hasBlocks;
    const htmlContent = lesson.content_html; // valid HTML string

    // Fetch Completed Quizzes for Sidebar status
    const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, passed')
        .eq('user_id', user?.id)
        .eq('course_id', courseId)
        .eq('passed', true); // Only care about passed ones

    const completedQuizzes: Record<string, boolean> = {};
    quizAttempts?.forEach((attempt: any) => {
        completedQuizzes[attempt.quiz_id] = true;
    });

    // Prepare Context for Voice Assistant
    const voiceContext = {
        courseId: resolvedCourseId,
        courseTitle: cleanTitle(courseOutline?.title || topicData?.title) || 'Unknown Course',
        moduleId: lesson.topic?.id,
        moduleName: lesson.topic?.title,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonContent: contentJson?.topicContent || lesson.content_html || '',
        studentProgress: {
            completedLessons: 0,
            totalLessons: courseOutline?.topics?.reduce((acc: number, t: any) => acc + (t.lessons?.length || 0), 0) || 0,
            currentPosition: `Module ${(lesson.topic?.order_index || 0) + 1}, Lesson ${lesson.order_index + 1}`
        }
    };

    const difficulty = (courseOutline as any)?.difficulty || "Intermediate";

    return (
        <div className="min-h-screen bg-obsidian text-slate-200 font-sans">
            <LessonTopNav
                lessonTitle={lesson.title}
                difficulty={difficulty}
                courseId={resolvedCourseId}
            />
            
            <div className="flex relative">
                {/* Client-side Utilities Hub - Rendered inside the main wrapper for stability */}
                <LessonClientWrapper voiceContext={voiceContext} courseId={courseId} lessonId={lessonId} />

                {/* Sidebar Navigation - Fixed Width */}

            {/* Sidebar Navigation - Fixed Width */}
            {courseOutline && (
                <div className="w-[320px] shrink-0 h-screen sticky top-[52px] border-r border-white/10 overflow-y-auto hidden xl:block bg-obsidian z-50">
                    <div className="p-6">
                        <LessonSidebar
                            outline={courseOutline}
                            completedQuizzes={completedQuizzes}
                            isFreePreview={accessCheck.plan === 'free'}
                        />
                    </div>
                </div>
            )}

            <main className="flex-1 min-w-0 min-h-screen relative border-l border-white/5">
                {useNativeRender ? (
                    <>
                        <div className="absolute top-8 left-8 z-50">
                            <Link
                                href={`/courses/${resolvedCourseId}#curriculum`}
                                className="group flex items-center gap-2 text-sm font-semibold text-[#8A8AB0] hover:text-white transition-colors bg-[#1E1E35]/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                            >
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                Back to Course
                            </Link>
                        </div>
                        <LessonContentRenderer
                            content={hasBlocks ? { blocks: lesson.content_blocks } : contentJson}
                            images={images || []}
                            audioUrl={topicData?.audio_url}
                            videoUrl={lesson.video_url}
                            videoOverviewUrl={lesson.video_overview_url}
                            lessonMetadata={{
                                duration: lesson.estimated_duration_minutes || 10,
                                difficulty,
                                instructor: contentJson?.instructor || 'sarah'
                            }}
                            pipelineType={(courseOutline as any)?.course_type || 'conceptual'}
                            isFreePreview={accessCheck.plan === 'free'}
                            lessonTitle={lesson.title}
                            lessonIndex={lesson.order_index ?? 0}
                            lessonPersonality={(lesson as any).lesson_personality ?? 'calm'}
                            microVariationSeed={(lesson as any).micro_variation_seed ?? 0}
                            footerNode={
                                <div className="mt-16">
                                    {hasBlocks ? (
                                        <SimpleLessonNavigation courseId={resolvedCourseId} lessonId={lessonId} />
                                    ) : (
                                        <LessonNavigation
                                            currentLessonId={lessonId}
                                            courseOutline={courseOutline as any}
                                            courseId={resolvedCourseId}
                                        />
                                    )}
                                </div>
                            }
                        />
                    </>
                ) : htmlContent ? (
                    <div className="w-full h-full flex flex-col p-8 overflow-y-auto">
                        <div className="mb-6">
                            <Link
                                href={`/courses/${resolvedCourseId}#curriculum`}
                                className="inline-flex items-center text-xs font-black uppercase tracking-[0.3em] text-[#00FFB3] hover:text-[#b8afff] transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Return to Hub
                            </Link>
                        </div>
                        <iframe
                            srcDoc={htmlContent}
                            className="w-full flex-1 border border-white/10 bg-white rounded-[2rem] shadow-2xl"
                            title="Lesson Content"
                            sandbox="allow-scripts allow-same-origin"
                        />
                        <div className="mt-8">
                            {courseOutline && (
                                <LessonNavigation
                                    courseId={courseId}
                                    currentLessonId={lessonId}
                                    courseOutline={courseOutline as any}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full w-full flex items-center justify-center p-8">
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-12 rounded-[3rem] max-w-lg text-center backdrop-blur-md">
                            <h3 className="font-black text-2xl mb-4 uppercase tracking-[0.3em]">Data Corruption</h3>
                            <p className="font-medium text-lg">The neural stream for this lesson could not be established.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    </div>
    );
}
