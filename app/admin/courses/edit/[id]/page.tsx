'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
    ArrowLeft,
    Save,
    FileText,
    Video,
    Plus,
    Settings,
    Eye,
    Loader2,
    Upload,
    ImageIcon,
    CheckCircle2,
    RefreshCw,
    Headphones,
    PlayCircle,

} from 'lucide-react';

interface Lesson {
    id: string;
    title: string;
    order_index: number;
    content_type: string;
    duration_minutes: number;
    video_url?: string | null;
}

interface Topic {
    id: string;
    title: string;
    order_index: number;
    audio_url?: string | null;
    course_lessons: Lesson[];
}

interface Course {
    id: string;
    title: string;
    description: string;
    difficulty_level: string;
    price: number | string;
    published: boolean;
    thumbnail_url?: string;
    course_topics: Topic[];
}

export default function AdminCourseEditClientPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('beginner');
    const [price, setPrice] = useState<number>(0);
    const [thumbnailUrl, setThumbnailUrl] = useState<string>('');

    const supabase = createClient();

    useEffect(() => {
        async function fetchCourse() {
            const { data, error } = await supabase
                .from('courses')
                .select(`
                    *,
                    course_topics (
                        id,
                        title,
                        order_index,
                        audio_url,
                        course_lessons (
                            id,
                            title,
                            order_index,
                            content_type,
                            duration_minutes,
                            video_url
                        )
                    )
                `)
                .eq('id', courseId)
                .single();

            if (error || !data) {
                console.error('Error fetching course:', error);
                router.push('/admin/courses');
                return;
            }

            // Sort
            data.course_topics.sort((a: Topic, b: Topic) => a.order_index - b.order_index);
            data.course_topics.forEach((topic: Topic) => {
                topic.course_lessons?.sort((a: Lesson, b: Lesson) => a.order_index - b.order_index);
            });

            setCourse(data);
            setTitle(data.title);
            setDescription(data.description);
            setDifficulty(data.difficulty_level || 'beginner');
            setPrice(Number(data.price) || 0);
            setThumbnailUrl(data.thumbnail_url || '');
            setLoading(false);
        }

        if (courseId) {
            fetchCourse();
        }
    }, [courseId]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${courseId}-${Date.now()}.${fileExt}`;
            const filePath = `course-thumbnails/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('course-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                alert('Failed to upload image. Please try again.');
                return;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('course-images')
                .getPublicUrl(filePath);

            setThumbnailUrl(publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!course) return;

        setSaving(true);
        setSaveSuccess(false);

        try {
            const { error } = await supabase
                .from('courses')
                .update({
                    title,
                    description,
                    difficulty_level: difficulty,
                    price: Number(price),
                    thumbnail_url: thumbnailUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', courseId);

            if (error) {
                console.error('Save error:', error);
                alert('Failed to save changes. Please try again.');
                return;
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving course:', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const [regenerating, setRegenerating] = useState<Record<string, 'audio' | 'video' | 'video_block' | null>>({});
    const [generatingAll, setGeneratingAll] = useState(false);

    // Update a lesson's url in local state without re-fetching
    const updateLessonField = (lessonId: string, field: 'audio_url' | 'video_url', value: string | null) => {
        setCourse(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                course_topics: prev.course_topics.map(t => ({
                    ...t,
                    course_lessons: t.course_lessons?.map(l =>
                        l.id === lessonId ? { ...l, [field]: value } : l
                    )
                }))
            };
        });
    };

    const handleRegenerate = async (lessonId: string, type: 'audio' | 'video' | 'video_block') => {
        setRegenerating(prev => ({ ...prev, [lessonId]: type }));
        try {
            const res = await fetch('/api/admin/lessons/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, type })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Regeneration failed' }));
                throw new Error(err.error || 'Regeneration failed');
            }
            const data = await res.json();
            if (type === 'audio') updateLessonField(lessonId, 'audio_url', data.url);
            if (type === 'video') updateLessonField(lessonId, 'video_url', data.url);
            if (type === 'video_block') alert(`✅ Video block generated (${data.generated}/${data.total} videos). Refresh to see the update.`);
        } catch (error: any) {
            alert(`Failed: ${error.message}`);
        } finally {
            setRegenerating(prev => ({ ...prev, [lessonId]: null }));
        }
    };


    const handleGenerateAllAudio = async (force = false) => {
        if (!course) return;
        setGeneratingAll(true);
        try {
            const res = await fetch('/api/admin/courses/generate-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, force })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            alert(`Done — ${data.generated} generated, ${data.skipped} already had audio.${data.errors?.length ? `\n\nErrors:\n${data.errors.join('\n')}` : ''}`);
            window.location.reload();
        } catch (error: any) {
            alert(`Failed: ${error.message}`);
        } finally {
            setGeneratingAll(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#00FFB3]" />
                    <p className="text-white/50">Loading course...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-white/50">Course not found</p>
                    <Link href="/admin/courses">
                        <Button className="mt-4 bg-[#00FFB3] hover:bg-[#00FFB3]/90 text-black font-bold">Back to Courses</Button>
                    </Link>
                </div>
            </div>
        );
    }

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
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#00FFB3] hover:bg-[#00FFB3]/90 text-black font-bold gap-2 h-9 min-w-[120px] disabled:bg-white/[0.04] disabled:text-white/20 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">Saving...</span>
                            </>
                        ) : saveSuccess ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Saved!</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span className="hidden sm:inline">Save Changes</span>
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Col: Metadata */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Course Thumbnail */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/40">Course Thumbnail</label>
                        <div className="relative group">
                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.08] relative">
                                {thumbnailUrl ? (
                                    <Image
                                        src={thumbnailUrl}
                                        alt="Course thumbnail"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ImageIcon className="w-12 h-12 text-white/20" />
                                    </div>
                                )}
                                {uploadingImage && (
                                    <div className="absolute inset-0 bg-[var(--page-bg)]/80 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#00FFB3]" />
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="w-full mt-3 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white gap-2 disabled:bg-white/[0.04] disabled:text-white/20 disabled:cursor-not-allowed"
                            >
                                <Upload className="w-4 h-4" />
                                {uploadingImage ? 'Uploading...' : 'Upload New Image'}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-white/40">Title</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-white/[0.06] border-white/[0.10] text-white text-lg font-medium h-12 focus:bg-white/[0.08] focus:border-white/20 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-white/40">Description</label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-white/[0.06] border-white/[0.10] text-white min-h-[150px] focus:bg-white/[0.08] focus:border-white/20 transition-colors resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">Difficulty</label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
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
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
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
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateAllAudio(false)}
                                disabled={generatingAll}
                                className="border-[#00FFB3]/30 hover:bg-[#00FFB3]/10 text-[#00FFB3] gap-2 disabled:bg-white/[0.04] disabled:text-white/20 disabled:cursor-not-allowed"
                                title="Generate Gemini TTS audio overview for all lessons in this course"
                            >
                                {generatingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Headphones className="w-4 h-4" />}
                                {generatingAll ? 'Generating...' : 'Generate All Audio'}
                            </Button>
                            <Button size="sm" variant="outline" className="border-white/[0.08] hover:bg-white/[0.08] text-[#00FFB3] gap-2">
                                <Plus className="w-4 h-4" />
                                Add Module
                            </Button>
                        </div>
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
                                    <div className="flex items-center gap-2">
                                        {/* Module audio status */}
                                        {topic.audio_url && (
                                            <span title="Module audio ready" className="flex items-center gap-1 text-[10px] text-[#00FFB3] font-mono">
                                                <Headphones className="w-3 h-3" />
                                                Audio
                                            </span>
                                        )}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <Button
                                                size="sm" variant="ghost"
                                                disabled={!!regenerating[topic.id]}
                                                onClick={() => handleRegenerate(topic.id, 'audio')}
                                                className="h-7 px-2 text-[10px] font-bold text-white/40 hover:text-[#00FFB3] hover:bg-[#00FFB3]/10 gap-1"
                                                title={topic.audio_url ? 'Re-generate module audio' : 'Generate module audio'}
                                            >
                                                {regenerating[topic.id] === 'audio' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Headphones className="w-3 h-3" />}
                                                {topic.audio_url ? 'Re-gen Audio' : 'Gen Audio'}
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/[0.08]">
                                                <Settings className="w-4 h-4" />
                                            </Button>
                                        </div>
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
                                                {/* Media status dots */}
                                                <div className="flex items-center gap-1">
                                                    {lesson.video_url && (
                                                        <span title="Video ready" className="w-1.5 h-1.5 rounded-full bg-[#00FFB3] shadow-[0_0_6px_#00FFB3]" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-30 group-hover/lesson:opacity-100 transition-opacity">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={!!regenerating[lesson.id]}
                                                    onClick={(e) => { e.stopPropagation(); handleRegenerate(lesson.id, 'video'); }}
                                                    className="h-8 px-2 text-[10px] font-bold text-white/40 hover:text-[#00FFB3] hover:bg-[#00FFB3]/10 gap-1.5"
                                                    title={lesson.video_url ? 'Re-generate overview video' : 'Generate overview video'}
                                                >
                                                    {regenerating[lesson.id] === 'video' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                                                    {lesson.video_url ? 'Re-gen' : 'Video'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={!!regenerating[lesson.id]}
                                                    onClick={(e) => { e.stopPropagation(); handleRegenerate(lesson.id, 'video_block'); }}
                                                    className="h-8 px-2 text-[10px] font-bold text-white/40 hover:text-[#00FFB3] hover:bg-[#00FFB3]/10 gap-1.5"
                                                    title="Generate missing Kie video for video_snippet block in content"
                                                >
                                                    {regenerating[lesson.id] === 'video_block' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                                    Block Vid
                                                </Button>
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
