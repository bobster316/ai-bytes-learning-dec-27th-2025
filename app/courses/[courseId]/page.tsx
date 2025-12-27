
import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, PlayCircle, Lock, BookOpen, ChevronRight } from 'lucide-react';

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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500/30 selection:text-cyan-900">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-violet-200/40 rounded-full blur-[150px] mix-blend-multiply" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-cyan-200/40 rounded-full blur-[120px] mix-blend-multiply" />
            </div>

            {/* Hero Section */}
            <div className="relative z-10 pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="flex justify-center gap-4">
                        <Badge variant="outline" className="border-cyan-600/30 text-cyan-700 bg-cyan-50/50 tracking-widest uppercase py-1 px-4 backdrop-blur-md">
                            {course.difficulty_level || "Advanced AI"}
                        </Badge>
                        <Badge variant="outline" className="border-violet-600/30 text-violet-700 bg-violet-50/50 tracking-widest uppercase py-1 px-4 backdrop-blur-md">
                            Premium Course
                        </Badge>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-tight">
                        {course.title}
                    </h1>

                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        {course.description}
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
                        {hasAccess && firstLessonId ? (
                            <Link href={`/courses/${courseId}/lessons/${firstLessonId}`} className="w-full md:w-auto">
                                <Button className="h-14 px-8 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg transition-all shadow-lg shadow-cyan-500/20 w-full">
                                    <PlayCircle className="w-5 h-5 mr-2" />
                                    Start Learning {isAdmin && '(Admin)'}
                                </Button>
                            </Link>
                        ) : (
                            <Button className="h-14 px-8 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg transition-all shadow-lg shadow-cyan-500/20 w-full md:w-auto">
                                {(course.price || 0) > 0 ? (
                                    <>
                                        <Lock className="w-5 h-5 mr-2" />
                                        Unlock Course (£{course.price})
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle className="w-5 h-5 mr-2" />
                                        Start Learning (Free)
                                    </>
                                )}
                            </Button>
                        )}
                        <Button variant="outline" className="h-14 px-8 rounded-full border-slate-300 hover:bg-slate-100 text-slate-700 w-full md:w-auto">
                            View Syllabus
                        </Button>
                    </div>
                </div>
            </div>

            {/* Locked Content Preview */}
            <div className="relative z-10 max-w-3xl mx-auto px-6 pb-32 space-y-12">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-12 border-b border-slate-200">
                    <div className="p-6 bg-gradient-to-br from-white to-slate-50 rounded-2xl text-center border border-slate-200 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-violet-100 to-violet-200 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-violet-600" />
                        </div>
                        <div className="text-3xl font-black text-slate-900">{course.course_topics.length}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-medium">Modules</div>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-white to-emerald-50 rounded-2xl text-center border border-emerald-100 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-3xl font-black text-emerald-600">
                            {(course.price || 0) === 0 ? "FREE" : `£${course.price}`}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-medium">Price</div>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-white to-amber-50 rounded-2xl text-center border border-amber-100 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div className="text-3xl font-black text-amber-600">Projects</div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-medium">Hands-On</div>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-white to-cyan-50 rounded-2xl text-center border border-cyan-100 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <div className="text-3xl font-black text-cyan-600">Certificate</div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-medium">Included</div>
                    </div>
                </div>

                {/* Topics List - Admin Full Access */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-cyan-500" />
                            Course Curriculum
                        </h3>
                        {isAdmin && (
                            <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 bg-emerald-50 backdrop-blur-md">
                                🔓 Admin Access
                            </Badge>
                        )}
                    </div>

                    {course.course_topics.map((topic: any, idx: number) => (
                        <div key={topic.id} className="group relative">
                            <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* Topic Header */}
                                <div className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-mono text-slate-500">
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <div>
                                            <h4 className="text-lg text-slate-900 font-medium">{topic.title}</h4>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {topic.course_lessons?.length || 0} lessons
                                                {topic.course_quizzes?.length > 0 && ' • Interactive quiz'}
                                            </p>
                                        </div>
                                    </div>
                                    {hasAccess ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <Lock className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>

                                {/* Lessons List - Only show for admin/free courses */}
                                {hasAccess && topic.course_lessons && topic.course_lessons.length > 0 && (
                                    <div className="border-t border-slate-100 bg-slate-50/50">
                                        {topic.course_lessons.map((lesson: any, lessonIdx: number) => (
                                            <Link
                                                key={lesson.id}
                                                href={`/courses/${courseId}/lessons/${lesson.id}`}
                                                className="flex items-center justify-between p-4 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0 group/lesson"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <PlayCircle className="w-4 h-4 text-cyan-500 group-hover/lesson:text-cyan-600" />
                                                    <span className="text-sm text-slate-600 group-hover/lesson:text-slate-900">
                                                        {lesson.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {lesson.estimated_duration_minutes && (
                                                        <span className="text-xs text-slate-400">
                                                            {lesson.estimated_duration_minutes} min
                                                        </span>
                                                    )}
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover/lesson:text-slate-400" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

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
