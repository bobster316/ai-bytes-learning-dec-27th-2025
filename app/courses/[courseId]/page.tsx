
import React from 'react';
import type { Metadata } from "next";
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, CirclePlay, Lock, BookOpen, ChevronRight, Clock } from 'lucide-react';
import { PremiumCurriculum } from '@/components/course/premium-curriculum';
import { AvatarImage } from '@/components/course/avatar-image';
import { VoiceAvatar } from '@/components/voice/voice-avatar';
import { AutoVideoSync } from '@/components/video/auto-video-sync';
import { ContextUpdater } from '@/components/voice/ContextUpdater';
import { MobileStats } from "@/components/course/mobile-stats";
import { buildMetadata } from "@/lib/seo";

// Force dynamic rendering to fix hydration/stale cache issues
export const dynamic = 'force-dynamic';

export async function generateMetadata(
    props: { params: Promise<{ courseId: string }> }
): Promise<Metadata> {
    const params = await props.params;
    const supabase = await createClient(true);
    const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', params.courseId)
        .single();

    const title = course?.seo_title || course?.title || "AI Bytes Course";
    const rawDescription = (course?.seo_description || course?.description || "")
        .replace('[gemma]', '')
        .trim();
    const description = rawDescription || "Master AI in 15-minute lessons with AI Bytes Learning.";
    const keywords = course?.seo_keywords
        ? String(course.seo_keywords).split(",").map((k: string) => k.trim()).filter(Boolean)
        : undefined;
    const image = course?.thumbnail_url || undefined;

    return buildMetadata({
        title,
        description,
        path: `/courses/${params.courseId}`,
        image,
        keywords,
    });
}

export default async function CourseOverviewPage(props: { params: Promise<{ courseId: string }> }) {
    const params = await props.params;
    const { courseId } = params;
    const supabase = await createClient(true);

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.email?.includes('admin') || user?.email?.includes('ravkh') || false;

    const { data: course, error } = await supabase
        .from('courses')
        .select(`
            *,
            course_topics (
                id,
                title,
                description,
                order_index,
                video_url,
                intro_video_job_id,
                intro_video_status,
                thumbnail_url,
                course_lessons (
                    id,
                    title,
                    order_index,
                    estimated_duration_minutes,
                    key_takeaways,
                    thumbnail_url,
                    video_job_id,
                    video_status,
                    micro_objective,
                    lesson_action
                ),
                course_quizzes (
                    id,
                    title
                )
            )
        `)
        .eq('id', courseId)
        .single();

    if (error || !course) {
        notFound();
    }

    // Sort topics and lessons
    course.course_topics.sort((a: any, b: any) => a.order_index - b.order_index);
    course.course_topics.forEach((topic: any) => {
        topic.course_lessons.sort((a: any, b: any) => a.order_index - b.order_index);
    });

    const firstLessonId = course.course_topics[0]?.course_lessons[0]?.id;

    // If admin, grant full access
    const hasAccess = isAdmin || (course.price || 0) === 0;

    // Check if course is completed
    const { data: progressData } = user ? await supabase
        .from('user_course_progress')
        .select('status')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle() : { data: null };

    const isCourseCompleted = progressData?.status === 'completed';
    const isCompleted = isCourseCompleted;

    // Fetch COMPLETED lessons for this user/course
    const { data: lessonProgress } = user ? await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('status', 'completed') : { data: null };

    // Fetch PASSED quizzes for this user/course
    const { data: quizAttempts } = user ? await supabase
        .from('quiz_attempts')
        .select('quiz_id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('passed', true) : { data: null };

    const completedLessonIds = lessonProgress?.map(p => String(p.lesson_id)) || [];
    const passedQuizIds = quizAttempts?.map(a => String(a.quiz_id)) || [];

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

    const displayTitle = cleanTitle(course.title);

    // Standardise instructor based on course description tag (added during generation)
    const isGemma = course.description?.toLowerCase().includes('[gemma]');
    const instructorName = isGemma ? "Gemma" : "Sarah";
    const instructorPoster = isGemma ? "/gemma_host.png?v=2" : "/sarah_host.png?v=2";
    const cleanDescription = course.description?.replace(/\[gemma\]/gi, '').replace(/\[sarah\]/gi, '').trim();

    const lessonCount = course.course_topics.reduce((acc: number, t: any) => acc + (t.course_lessons?.length || 0), 0);
    const priceDisplay = (course.price || 0) === 0 ? "Free" : `£${course.price}`;

    return (
        <section className="min-h-screen flex flex-col bg-[var(--page-bg)] font-sans selection:bg-[#00FFB3]/30 selection:text-[#00FFB3]">
            {/* Client-side Utilities Hub */}
            <div className="hidden">
                <AutoVideoSync courseId={courseId} />
                <ContextUpdater context={{
                    courseId,
                    courseTitle: displayTitle,
                    moduleId: course.course_topics[0]?.id,
                    moduleName: course.course_topics[0]?.title
                }} />
            </div>

            {/* --- PREMIUM HERO SECTION (Floating Card Style) --- */}
            {/* Added container wrapper to constrain width and standard spacing */}
            <div className="mx-auto w-[95%] max-w-screen-2xl pt-24 pb-8">
                <div className="relative bg-[#0F1117] text-white keep-dark rounded-[2.5rem] p-8 md:p-12 lg:p-16 overflow-hidden shadow-2xl">

                    {/* Dynamic Background Mesh */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-[#00FFB3]/15 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#00FFB3]/8 rounded-full blur-[100px]" />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                        {/* Left Column: Content */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-3">
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-[#00FFB3]/15 border border-[#00FFB3]/30 text-[#00FFB3]">
                                    {course.difficulty_level || "Premium Course"}
                                </span>
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-white/5 border border-white/10 text-white/50">
                                    {lessonCount} {lessonCount === 1 ? 'Byte' : 'Bytes'}
                                </span>
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-[#00FFB3]/10 border border-[#00FFB3]/25 text-[#00FFB3]">
                                    <Clock className="w-2.5 h-2.5 inline mr-1" />
                                    15m / Byte
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1] line-clamp-2">
                                {displayTitle}
                            </h1>

                            {cleanDescription?.split('\n').filter(Boolean).slice(0, 1).map((para: string, i: number) => (
                                <p key={i} className="font-body text-white/60 text-base leading-relaxed line-clamp-2 max-w-xl">{para.trim()}</p>
                            ))}

                            {course.course_outcome && (
                                <div className="bg-[#00FFB3]/8 border border-[#00FFB3]/20 rounded-2xl p-6 max-w-xl">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 bg-[#00FFB3]/15 p-2 rounded-lg">
                                            <CheckCircle2 className="w-5 h-5 text-[#00FFB3]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[#00FFB3] uppercase tracking-widest mb-1">After this course you can</p>
                                            <p className="text-white/80 text-sm leading-relaxed font-medium">
                                                {course.course_outcome}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                {hasAccess && firstLessonId ? (
                                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                        {isCompleted ? (
                                            <Link href={`/courses/${courseId}/complete`} className={cn(buttonVariants({ variant: "default" }), "h-14 px-8 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold text-base transition-all w-full sm:w-auto shadow-[0_0_20px_-5px_rgba(251,191,36,0.5)] border border-yellow-300/50")}>
                                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                                View Certificate
                                            </Link>
                                        ) : (
                                            <Link href={`/courses/${courseId}/lessons/${firstLessonId}`} suppressHydrationWarning className={cn(buttonVariants({ variant: "default" }), "h-14 px-8 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-base transition-all w-full sm:w-auto")}>
                                                <CirclePlay className="w-5 h-5 mr-2" suppressHydrationWarning />
                                                Continue Learning
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <Button className="h-14 px-8 rounded-full bg-[#00FFB3] hover:bg-[#8a7fee] text-[#080810] font-bold text-base transition-all shadow-[0_0_30px_-5px_rgba(155,143,255,0.4)] w-full sm:w-auto border-0">
                                        {(course.price || 0) > 0 ? (
                                            <>
                                                <Lock className="w-5 h-5 mr-2" />
                                                Unlock for £{course.price}
                                            </>
                                        ) : (
                                            <>
                                                <CirclePlay className="w-5 h-5 mr-2" />
                                                Start for Free
                                            </>
                                        )}
                                    </Button>
                                )}
                                <Link href="#curriculum" className={cn(buttonVariants({ variant: "outline" }), "h-14 px-8 rounded-full border-white/10 hover:bg-white/5 text-slate-300 hover:text-white w-full sm:w-auto transition-colors")}>
                                    View Syllabus
                                </Link>
                            </div>
                        </div>

                        {/* Right Column: Course Intro Video */}
                        <div className="relative hidden lg:block lg:col-span-4 h-full">
                            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/50 aspect-video">
                                <div className="relative w-full h-full">
                                    <VoiceAvatar
                                        src={course.intro_video_url}
                                        poster={instructorPoster}
                                        instructor={instructorName.toLowerCase() as any}
                                        transparent={false}
                                        controls={true}
                                        overlayControls={true}
                                        className="w-full h-full"
                                    />

                                    {/* Loading / Generating Overlay */}
                                    {(!course.intro_video_url && course.intro_video_job_id) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 backdrop-blur-[2px]">
                                            <div className="text-center p-6 bg-slate-900/90 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
                                                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                                                <p className="text-white font-semibold text-lg">Creating Your Video</p>
                                                <p className="text-sm text-violet-200/70 mt-2 max-w-[200px] mx-auto">
                                                    {instructorName} is preparing the course introduction...
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT SECTION --- */}
            <div suppressHydrationWarning className="relative z-10 mx-auto w-[95%] max-w-screen-2xl pb-32 space-y-12">

                {/* Mobile Stats (Visible only on small screens) */}
                {/* Mobile Stats (Visible only on small screens) */}
                <MobileStats lessonCount={lessonCount} priceDisplay={priceDisplay} />

                {/* Topics List - Premium Redesign */}
                <div id="curriculum" className="scroll-mt-32">
                    <PremiumCurriculum
                        course={course}
                        hasAccess={hasAccess}
                        completedLessons={completedLessonIds}
                        completedQuizzes={passedQuizIds}
                    />
                </div>

                {/* Subscription CTA Card - Only show if not admin */}
                {!hasAccess && (
                    <div className="relative overflow-hidden rounded-3xl bg-[#0f0f1a] keep-dark p-8 md:p-12 text-center border border-[#00FFB3]/20 shadow-2xl">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#00FFB3]/15 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-[#00FFB3]/8 blur-[80px] rounded-full pointer-events-none" />
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl font-bold text-white tracking-tight">Ready to start learning?</h2>
                            <p className="text-white/50 max-w-xl mx-auto text-lg">
                                Get unlimited access to this course and 50+ others with our Pro subscription.
                            </p>
                            <Button className="h-12 px-8 bg-[#00FFB3] hover:bg-[#8a7fee] text-[#080810] font-bold text-base rounded-full border-0">
                                Get All-Access Pass
                            </Button>
                            <p className="text-xs text-white/25 mt-4">
                                Includes 7-day money back guarantee. Cancel anytime.
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </section>
    );
}
