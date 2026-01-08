
import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, PlayCircle, Lock, BookOpen, ChevronRight } from 'lucide-react';
import { PremiumCurriculum } from '@/components/course/premium-curriculum';

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
                order_index,
                course_lessons (
                    id,
                    title,
                    order_index,
                    estimated_duration_minutes
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

    // Helper to clean raw prompt titles
    const cleanTitle = (t: string) => {
        if (!t) return "";
        // Split by common "prompt injection" keywords and take the first part
        return t.split(/Target Audience:/i)[0]
            .split(/Difficulty:/i)[0]
            .split(/Number of Modules:/i)[0]
            .split(/\.\s*$/)[0] // Remove trailing dot
            .trim();
    };

    const displayTitle = cleanTitle(course.title);

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-violet-500/30 selection:text-violet-900">

            {/* --- PREMIUM HERO SECTION (Floating Card Style) --- */}
            {/* Added container wrapper to constrain width and standard spacing */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
                <div className="relative bg-[#0F1117] text-white rounded-[2.5rem] p-8 md:p-12 lg:p-16 overflow-hidden shadow-2xl">

                    {/* Dynamic Background Mesh (Contained within card) */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] mix-blend-screen" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2] mix-blend-overlay" />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Left Column: Content */}
                        <div className="space-y-8">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-3">
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 text-violet-300">
                                    {course.difficulty_level || "Premium Course"}
                                </span>
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-slate-800 border border-slate-700 text-slate-400">
                                    {course.course_topics.length} Modules
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] text-balance">
                                {displayTitle}
                            </h1>

                            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                                {course.description}
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                {hasAccess && firstLessonId ? (
                                    <Link href={`/courses/${courseId}/lessons/${firstLessonId}`} className="w-full sm:w-auto">
                                        <Button className="h-14 px-8 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-base transition-all w-full sm:w-auto">
                                            <PlayCircle className="w-5 h-5 mr-2" />
                                            Continue Learning
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button className="h-14 px-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base transition-all shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)] w-full sm:w-auto border border-violet-500/50">
                                        {(course.price || 0) > 0 ? (
                                            <>
                                                <Lock className="w-5 h-5 mr-2" />
                                                Unlock for £{course.price}
                                            </>
                                        ) : (
                                            <>
                                                <PlayCircle className="w-5 h-5 mr-2" />
                                                Start for Free
                                            </>
                                        )}
                                    </Button>
                                )}
                                <Button variant="outline" className="h-14 px-8 rounded-full border-white/10 hover:bg-white/5 text-slate-300 hover:text-white w-full sm:w-auto transition-colors">
                                    View Syllabus
                                </Button>
                            </div>
                        </div>

                        {/* Right Column: Visual / Stats Hud */}
                        <div className="relative hidden lg:block">
                            {/* Glass HUD Card */}
                            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                                {/* Floating Elements */}
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 z-20">
                                    <BookOpen className="w-10 h-10 text-white" />
                                </div>

                                <div className="space-y-8 divide-y divide-white/10">
                                    <div className="space-y-2">
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-widest">Pricing</div>
                                        <div className="text-3xl font-mono text-white">
                                            {(course.price || 0) === 0 ? "Free Access" : `£${course.price}`}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-6">
                                        <div>
                                            <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Duration</div>
                                            <div className="text-lg text-slate-200 font-semibold">Self-Paced</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Certificate</div>
                                            <div className="text-lg text-emerald-400 font-semibold flex items-center gap-1">
                                                Included <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">Hands-On Projects</div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full w-3/4 bg-cyan-500" />
                                            </div>
                                            <span className="text-xs text-cyan-400 font-mono">CODE-READY</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT SECTION --- */}
            {/* Removed negative margin since we are now in a stacked card layout */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pb-32 space-y-12">

                {/* Mobile Stats (Visible only on small screens) */}
                <div className="lg:hidden grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Lessons</div>
                        <div className="text-2xl font-bold text-white">{course.course_topics.reduce((acc: any, t: any) => acc + (t.course_lessons?.length || 0), 0)}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Price</div>
                        <div className="text-2xl font-bold text-white">{(course.price || 0) === 0 ? "Free" : `£${course.price}`}</div>
                    </div>
                </div>

                {/* Topics List - Premium Redesign */}
                <PremiumCurriculum course={course} hasAccess={hasAccess} />

                {/* Subscription CTA Card - Only show if not admin */}
                {!hasAccess && (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-900 to-blue-900 p-8 md:p-12 text-center border border-white/10 shadow-2xl">
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl font-bold text-white">Ready to start learning?</h2>
                            <p className="text-cyan-100 max-w-xl mx-auto text-lg">
                                Get unlimited access to this course and 50+ others with our Pro subscription.
                            </p>
                            <Button className="h-12 px-8 bg-white text-cyan-900 hover:bg-cyan-50 font-bold text-lg rounded-full">
                                Get All-Access Pass
                            </Button>
                            <p className="text-xs text-cyan-200/60 mt-4">
                                Includes 7-day money back guarantee. Cancel anytime.
                            </p>
                        </div>

                        {/* Decorative */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/20 blur-[80px] rounded-full"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full"></div>
                    </div>
                )}

            </div>
        </div>
    );
}
