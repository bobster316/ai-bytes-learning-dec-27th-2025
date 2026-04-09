import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Save,
    FileText,
    Video,
    Plus,
    Settings,
    Eye,
} from 'lucide-react';

interface Lesson {
    id: string;
    title: string;
    order_index: number;
    content_type: string;
    duration_minutes: number;
}

interface Topic {
    id: string;
    title: string;
    order_index: number;
    course_lessons: Lesson[];
}

interface Course {
    id: string;
    title: string;
    description: string;
    difficulty_level: string;
    price: number | string;
    published: boolean;
    course_topics: Topic[];
}

export default async function AdminCourseEditPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id: courseId } = params;
    const supabase = await createClient();

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
                    content_type,
                    duration_minutes
                )
            )
        `)
        .eq('id', courseId)
        .single();

    if (error || !course) {
        notFound();
    }

    // Sort
    course.course_topics.sort((a: Topic, b: Topic) => a.order_index - b.order_index);
    course.course_topics.forEach((topic: Topic) => {
        topic.course_lessons?.sort((a: Lesson, b: Lesson) => a.order_index - b.order_index);
    });

    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] font-sans selection:bg-[#9B8FFF]/30">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-[var(--page-bg)]/80 backdrop-blur-md border-b border-[var(--page-border)] h-16 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/courses">
                        <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/[0.08]">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-white/20" />
                    <h1 className="text-lg font-semibold tracking-tight text-white/90">
                        Course Editor
                    </h1>
                    <Badge variant="outline" className="border-[#00FFB3]/50 text-[#00FFB3] text-xs">
                        {course.published ? 'Live' : 'Draft'}
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Link href={`/courses/${courseId}`} target="_blank">
                        <Button variant="outline" size="sm" className="border-white/[0.08] hover:bg-white/[0.08] text-white/50 hover:text-white gap-2 h-9">
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Preview</span>
                        </Button>
                    </Link>
                    <Button size="sm" className="bg-[#00FFB3] hover:bg-[#00FFB3]/90 text-black font-bold gap-2 h-9">
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">Save Changes</span>
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Col: Metadata */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-white/40">Title</label>
                            <Input
                                defaultValue={course.title}
                                className="bg-white/[0.06] border-white/[0.10] text-white text-lg font-medium h-12 focus:bg-white/[0.08] focus:border-white/20 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-white/40">Description</label>
                            <Textarea
                                defaultValue={course.description}
                                className="bg-white/[0.06] border-white/[0.10] text-white min-h-[150px] focus:bg-white/[0.08] focus:border-white/20 transition-colors resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Difficulty</label>
                                <select
                                    defaultValue={course.difficulty_level || "beginner"}
                                    className="w-full bg-white/[0.06] border border-white/[0.10] rounded-md h-10 px-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Price (£)</label>
                                <Input
                                    type="number"
                                    defaultValue={course.price || 0}
                                    className="bg-white/[0.06] border-white/[0.10] text-white h-10 focus:bg-white/[0.08] focus:border-white/20"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Curriculum */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Curriculum</h2>
                        <Button size="sm" variant="outline" className="border-white/[0.08] hover:bg-white/[0.08] text-[#00FFB3] gap-2">
                            <Plus className="w-4 h-4" />
                            Add Module
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {course.course_topics.map((topic: Topic, idx: number) => (
                            <div key={topic.id} className="group border border-white/[0.08] rounded-xl bg-white/[0.04] backdrop-blur-sm overflow-hidden transition-all hover:border-white/20">
                                <div className="flex items-start justify-between p-4 bg-white/[0.02]">
                                    <div className="flex items-center gap-4">
                                        <div className="h-6 w-6 rounded flex items-center justify-center bg-white/[0.06] text-xs text-white/40 font-mono">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">{topic.title}</h3>
                                            <div className="text-[10px] text-white/40 uppercase tracking-wide mt-0.5">
                                                {topic.course_lessons?.length || 0} Lessons
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/[0.08]">
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="border-t border-white/[0.05] p-2 space-y-1">
                                    {topic.course_lessons?.map((lesson: Lesson) => (
                                        <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.06] group/lesson transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="text-white/20">
                                                    {lesson.content_type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                </div>
                                                <span className="text-sm text-white/65 font-medium group-hover/lesson:text-white transition-colors">
                                                    {lesson.title}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
