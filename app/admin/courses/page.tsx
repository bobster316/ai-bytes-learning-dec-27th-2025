"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    BookOpen,
    Trash2,
    Edit,
    Image as ImageIcon,
    Clock,
    ShieldCheck,
    MoreHorizontal,
    Eye,
    Archive,
    CheckCircle,
    Wand2,
    Headphones,
    Loader2,
    Server,
    Film,
    RefreshCw,
    FileText,
    FileImage,
    Presentation,
    Download,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// ─── Slide generation notification ───────────────────────────────────────────
type SlideNotification = {
    status: 'generating' | 'success' | 'error';
    courseName: string;
    message: string;
};

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
    const [slideNotification, setSlideNotification] = useState<SlideNotification | null>(null);
    const supabase = createClient();

    const categories = [
        { id: "all", label: "All Courses" },
        { id: "foundational", label: "Foundational AI" },
        { id: "generative", label: "Generative AI" },
        { id: "applications", label: "AI Applications" },
        { id: "prompt-engineering", label: "Prompt Engineering" },
        { id: "machine-learning", label: "Machine Learning" },
        { id: "data-science", label: "Data Science" },
        { id: "computer-vision", label: "Computer Vision" },
        { id: "nlp", label: "NLP" },
        { id: "robotics", label: "Robotics & IoT" },
        { id: "security", label: "Security & Ethics" },
        { id: "business", label: "Business AI" },
    ];

    const fetchCourses = useCallback(async () => {
        try {
            const response = await fetch(`/api/admin/courses/list?t=${Date.now()}`, { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                setCourses(data.courses || []);
            } else if (response.status === 404) {
                // Valid state: No courses yet or endpoint not ready
                setCourses([]);
            } else if (response.status === 500) {
                const errText = await response.text();
                console.error("Server 500 Error:", errText);
                // alert(`Server Error: ${errText}`); // Optional: alert for visibility
                // return;

            } else {
                console.warn(`Fetch courses status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    async function deleteCourse(id: string) {
        // if (!confirm("Are you sure? This will delete all topics, lessons, and quizzes permanently.")) {
        //     return;
        // }
        console.log("Delete triggered for:", id);

        try {
            // setLoading(true); // Don't hide the list while deleting
            const response = await fetch('/api/course/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] })
            });

            if (response.ok) {
                // Optimistic Update: Remove immediately from UI
                setCourses(current => current.filter(c => c.id !== id));
                // await fetchCourses(); // No need to re-fetch immediately if optimistic update works
            } else {
                const err = await response.json();
                console.error("Delete failed:", err);
                alert(`Failed to delete course: ${err.error || 'Unknown error'}`);
                setLoading(false);
            }
        } catch (e) {
            console.error("Delete exception:", e);
            alert("An error occurred while deleting the course.");
            setLoading(false);
        }
    }

    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all'
                ? true
                : statusFilter === 'published' ? course.published : !course.published;
            return matchesSearch && matchesStatus;
        });
    }, [courses, searchQuery, statusFilter]);

    async function togglePublish(course: any) {
        const newStatus = !course.published;

        try {
            const response = await fetch('/api/admin/courses/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: course.id, published: newStatus })
            });

            if (response.ok) {
                setCourses(courses.map(c => c.id === course.id ? { ...c, published: newStatus } : c));
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }

    const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedCourses);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelectedCourses(newSelection);
    };

    const toggleAll = () => {
        if (selectedCourses.size === filteredCourses.length) {
            setSelectedCourses(new Set());
        } else {
            setSelectedCourses(new Set(filteredCourses.map(c => c.id)));
        }
    };

    // slidesGenerating: set of courseIds currently generating MARP slides
    const [slidesGenerating, setSlidesGenerating] = useState<Set<string>>(new Set());

    const handleGenerateSlides = async (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        const courseName = course?.title ?? 'this course';

        setSlidesGenerating(prev => new Set(prev).add(courseId));
        setSlideNotification({ status: 'generating', courseName, message: 'Generating slides — MD, PDF, and PPTX. This takes about 60 seconds...' });

        try {
            const res = await fetch('/api/admin/courses/generate-slides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Slide generation failed');

            // Update course in local state with new URLs
            setCourses(prev => prev.map(c => c.id === courseId ? {
                ...c,
                slides_url: data.slidesUrl ?? c.slides_url,
                slides_pdf_url: data.slidesPdfUrl ?? c.slides_pdf_url,
                slides_pptx_url: data.slidesPptxUrl ?? c.slides_pptx_url,
            } : c));

            const formats = [data.slidesUrl && 'MD', data.slidesPdfUrl && 'PDF', data.slidesPptxUrl && 'PPTX'].filter(Boolean).join(', ');
            setSlideNotification({ status: 'success', courseName, message: `Slides ready (${formats}). Download from the Actions menu or the course completion page.` });
            setTimeout(() => setSlideNotification(null), 8000);
        } catch (e: any) {
            setSlideNotification({ status: 'error', courseName, message: e.message });
            setTimeout(() => setSlideNotification(null), 8000);
        } finally {
            setSlidesGenerating(prev => { const s = new Set(prev); s.delete(courseId); return s; });
        }
    };

    const handleRevokeSlides = async (courseId: string, enable: boolean) => {
        try {
            const res = await fetch('/api/admin/courses/revoke-slides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, enable }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Action failed');
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, slides_enabled: data.slides_enabled } : c));
        } catch (e: any) {
            alert(`Failed: ${e.message}`);
        }
    };

    // avatarGenerating: set of courseIds currently generating avatar video
    const [avatarGenerating, setAvatarGenerating] = useState<Set<string>>(new Set());

    const handleGenerateAvatar = async (courseId: string) => {
        setAvatarGenerating(prev => new Set(prev).add(courseId));
        try {
            const res = await fetch('/api/admin/courses/generate-avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Avatar generation failed');
            alert(`Avatar video queued (job ${data.jobId}). Check back in ~5 minutes — the video renders asynchronously on HeyGen's servers.`);
        } catch (e: any) {
            alert(`Avatar generation failed: ${e.message}`);
        } finally {
            setAvatarGenerating(prev => { const s = new Set(prev); s.delete(courseId); return s; });
        }
    };

    // audioProgress: courseId -> { done, total } while generating; absent when idle
    const [audioProgress, setAudioProgress] = useState<Map<string, { done: number; total: number }>>(new Map());

    const handleGenerateAudio = async (courseId: string, force = false) => {
        setAudioProgress(prev => new Map(prev).set(courseId, { done: 0, total: 0 }));
        try {
            const res = await fetch('/api/admin/courses/generate-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, force })
            });
            if (!res.body) throw new Error('No response stream');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let serverError: string | null = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    const dataLine = line.trim().replace(/^data: /, '');
                    if (!dataLine) continue;
                    try {
                        const event = JSON.parse(dataLine);
                        if (event.type === 'start') {
                            setAudioProgress(prev => new Map(prev).set(courseId, { done: 0, total: event.total }));
                        } else if (event.type === 'lesson_done' || event.type === 'lesson_error' || event.type === 'progress') {
                            setAudioProgress(prev => new Map(prev).set(courseId, { done: event.done, total: event.total }));
                        } else if (event.type === 'done') {
                            setAudioProgress(prev => { const m = new Map(prev); m.delete(courseId); return m; });
                            const errSummary = event.errors?.length ? `\n\nFailed:\n${event.errors.join('\n')}` : '';
                            alert(`Audio complete — ${event.generated} / ${event.total} modules generated.${event.skipped ? ` (${event.skipped} already had audio)` : ''}${errSummary}`);
                        } else if (event.type === 'error') {
                            serverError = event.message; // capture — don't throw inside the parse try/catch
                        }
                    } catch { /* skip truly malformed JSON lines */ }
                }
                if (serverError) break; // exit read loop on server error
            }

            if (serverError) throw new Error(serverError);
        } catch (e: any) {
            alert(`Audio generation failed: ${e.message}`);
            setAudioProgress(prev => { const m = new Map(prev); m.delete(courseId); return m; });
        }
    };

    const deleteSelected = async () => {
        const count = selectedCourses.size;
        // if (!confirm(`Are you sure you want to delete ${count} courses? This cannot be undone.`)) return;
        console.log("Bulk delete triggered for:", count);

        try {
            // setLoading(true); // Don't hide list
            const ids = Array.from(selectedCourses);
            const BATCH_SIZE = 1;

            // Process in batches to avoid DB timeouts
            for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                const batch = ids.slice(i, i + BATCH_SIZE);
                console.log(`Processing batch ${i / BATCH_SIZE + 1} (${batch.length} items)...`);

                const response = await fetch('/api/course/bulk-delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: batch })
                });

                if (response.ok) {
                    // Optimistic Update: Remove THIS BATCH immediately
                    setCourses(current => current.filter(c => !batch.includes(c.id)));
                    // Update selection to remove processed items (optional, but good for UI consistency)
                    setSelectedCourses(prev => {
                        const next = new Set(prev);
                        batch.forEach(id => next.delete(id));
                        return next;
                    });
                } else {
                    const err = await response.json();
                    console.error("Batch delete error:", err);
                    // Continue to next batch but show warning? 
                    // For now, simple console log, maybe alert at end if some failed.
                }
            }

            // Clear any remaining selection (if all success)
            setSelectedCourses(new Set());

        } catch (e) {
            console.error("Bulk delete exception:", e);
            alert("An error occurred while deleting courses.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] font-sans">
            <Header />

            {/* Slide generation notification — fixed bottom-right */}
            {slideNotification && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border max-w-sm transition-all ${
                    slideNotification.status === 'generating' ? 'bg-[#00C896]/10 border-[#00C896]/40' :
                    slideNotification.status === 'success'    ? 'bg-[#00C896]/10 border-[#00C896]/60' :
                                                               'bg-[#FF6B6B]/10 border-[#FF6B6B]/60'
                }`}>
                    <div className="mt-0.5 shrink-0">
                        {slideNotification.status === 'generating' && (
                            <Loader2 className="h-5 w-5 text-[#00C896] animate-spin" />
                        )}
                        {slideNotification.status === 'success' && (
                            <CheckCircle className="h-5 w-5 text-[#00C896]" />
                        )}
                        {slideNotification.status === 'error' && (
                            <span className="text-[#FF6B6B] text-lg leading-none">✕</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                            {slideNotification.status === 'generating' ? 'Generating Slides' :
                             slideNotification.status === 'success'    ? 'Slides Ready' : 'Generation Failed'}
                        </p>
                        <p className="text-xs text-white/60 mt-0.5 leading-snug">{slideNotification.courseName}</p>
                        <p className="text-xs text-white/50 mt-1 leading-snug">{slideNotification.message}</p>
                    </div>
                    <button onClick={() => setSlideNotification(null)} className="shrink-0 text-white/30 hover:text-white/70 transition-colors text-xs mt-0.5">✕</button>
                </div>
            )}

            <div className="p-6 lg:p-8">
                <div className="max-w-screen-2xl mx-auto space-y-8 mt-[80px]">

                    {/* Header & Controls */}
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="shrink-0">
                                <h1 className="text-3xl font-bold text-white tracking-tight">
                                    Courses
                                </h1>
                                <p className="text-white/50 mt-1">
                                    Manage and organise your AI curriculum.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 shrink-0">
                                <Link href="/admin/api-usage">
                                    <Button variant="outline" className="rounded-full font-bold px-6 whitespace-nowrap shrink-0 border-white/[0.12] text-white/80 hover:text-white bg-transparent">
                                        <Server className="w-4 h-4 mr-2" />
                                        API Metrics
                                    </Button>
                                </Link>
                                {selectedCourses.size > 0 && (
                                    <Button
                                        variant="danger"
                                        className="rounded-full shadow-lg font-bold px-6 whitespace-nowrap shrink-0"
                                        onClick={deleteSelected}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete ({selectedCourses.size})
                                    </Button>
                                )}
                                <Link href="/admin/courses/new">
                                    <Button className="rounded-full shadow-lg bg-[#00FFB3] hover:bg-[#00FFB3]/90 text-black font-black px-6 whitespace-nowrap shrink-0">
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Course
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/[0.04] backdrop-blur-sm p-4 rounded-xl border border-white/[0.08]">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <Input
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-white/[0.06] border-white/[0.10] text-white placeholder:text-white/20 focus:bg-white/[0.08] focus:border-white/20 transition-colors"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="flex p-1 bg-white/[0.04] border border-white/[0.08] rounded-lg">
                                    {['all', 'published', 'draft'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status as any)}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${statusFilter === status
                                                ? 'bg-white/[0.10] border border-[#9B8FFF]/50 ring-2 ring-[#9B8FFF]/30 text-white shadow-sm'
                                                : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content List (Table Style) */}
                    <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/[0.08] overflow-x-auto">
                        <div className="min-w-[1200px]">
                            {/* Table Header */}
                            <div className="grid grid-cols-[240px_minmax(250px,3fr)_minmax(150px,2fr)_150px_120px_100px_100px_160px] gap-4 p-4 border-b border-white/[0.08] bg-white/[0.02] text-xs font-bold text-white/50 uppercase tracking-wider items-center whitespace-nowrap">
                                <div className="pl-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-white/20 bg-transparent text-[#00FFB3] w-4 h-4 cursor-pointer"
                                        checked={filteredCourses.length > 0 && selectedCourses.size === filteredCourses.length}
                                        onChange={toggleAll}
                                    />
                                </div>
                                <div>Course Name</div>
                                <div>Category</div>
                                <div>Date</div>
                                <div>Difficulty</div>
                                <div>Price</div>
                                <div className="text-center">Status</div>
                                <div className="text-right pr-4">Actions</div>
                            </div>

                            {loading ? (
                                <div className="divide-y divide-white/[0.05] min-w-[1200px]">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="p-4 flex items-center gap-4">
                                            <div className="w-16 h-10 bg-white/[0.05] rounded animate-pulse" />
                                            <div className="flex-1 h-4 bg-white/[0.05] rounded animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="divide-y divide-white/[0.05] min-w-[1200px]">
                                    <AnimatePresence mode="popLayout">
                                        {filteredCourses.map((course) => (
                                            <motion.div
                                                key={course.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className={`grid grid-cols-[240px_minmax(250px,3fr)_minmax(150px,2fr)_150px_120px_100px_100px_160px] gap-4 p-4 items-center hover:bg-white/[0.04] transition-colors ${selectedCourses.has(course.id) ? 'bg-[#00FFB3]/10' : ''}`}
                                            >
                                                {/* Checkbox & Thumbnail */}
                                                <div className="flex items-center gap-4 pl-2">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-white/20 bg-transparent text-[#00FFB3] w-4 h-4 cursor-pointer"
                                                        checked={selectedCourses.has(course.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={() => toggleSelection(course.id)}
                                                    />
                                                    <div className="w-48 aspect-video rounded-lg bg-white/[0.04] overflow-hidden border border-white/[0.08] relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleSelection(course.id); }}>
                                                        {course.thumbnail_url ? (
                                                            <img
                                                                src={course.thumbnail_url}
                                                                alt={course.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                                                                <ImageIcon className="w-5 h-5 text-white/20" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Title (Only) */}
                                                <div className="min-w-0">
                                                    <Link href={`/courses/${course.id}`} onClick={(e) => e.stopPropagation()} className="font-bold text-white hover:text-[#00FFB3] transition-colors text-base block" title={course.title}>
                                                        {course.title}
                                                    </Link>
                                                </div>

                                                {/* Category */}
                                                <div className="text-sm text-white/65 flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3 text-white/40" />
                                                    <span title={course.category}>
                                                        {categories.find(c => c.id === course.category)?.label || course.category || 'General'}
                                                    </span>
                                                </div>

                                                {/* Date & Time (UK Format) */}
                                                <div className="text-sm text-white/50 whitespace-nowrap">
                                                    {new Date(course.created_at).toLocaleString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: false
                                                    })}
                                                </div>

                                                {/* Difficulty */}
                                                <div>
                                                    <Badge variant="outline" className={`font-medium border-none whitespace-nowrap ${(course.difficulty_level || 'Beginner') === 'Beginner' ? 'bg-[#00FFB3]/20 text-[#00FFB3] ring-1 ring-[#00FFB3]/30' :
                                                        (course.difficulty_level || 'Beginner') === 'Intermediate' ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' :
                                                            'bg-[#9B8FFF]/20 text-[#9B8FFF] ring-1 ring-[#9B8FFF]/30'
                                                        }`}>
                                                        {course.difficulty_level || 'Beginner'}
                                                    </Badge>
                                                </div>

                                                {/* Price */}
                                                <div className="font-semibold text-white/65">
                                                    {(course.price || 0) === 0 ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/[0.06] text-white/50 text-xs">FREE</span>
                                                    ) : (
                                                        `£${Number(course.price).toFixed(2)}`
                                                    )}
                                                </div>

                                                {/* Status */}
                                                <div className="text-center flex flex-col items-center gap-1">
                                                    <Badge className={`backdrop-blur-sm border-none px-3 ${course.published
                                                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                        : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                                        }`}>
                                                        {course.published ? 'Live' : 'Draft'}
                                                    </Badge>
                                                    {audioProgress.has(course.id) && (() => {
                                                        const p = audioProgress.get(course.id)!;
                                                        return (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00FFB3]/10 text-[#00FFB3] text-xs font-medium border border-[#00FFB3]/20">
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                {p.total > 0 ? `${p.done}/${p.total}` : 'Starting…'}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-end gap-1 pr-2">
                                                    {/* Inline slide download buttons — visible without opening any menu */}
                                                    {(course.slides_url || course.slides_pdf_url || course.slides_pptx_url) && (
                                                        <div className="flex items-center gap-0.5 mr-1 px-1.5 py-1 rounded-lg bg-[#00C896]/8 border border-[#00C896]/15">
                                                            {course.slides_url && (
                                                                <a
                                                                    href={course.slides_url}
                                                                    target="_blank"
                                                                    title="Download Markdown"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="p-1 rounded text-[#00C896]/60 hover:text-[#00C896] hover:bg-[#00C896]/10 transition-colors"
                                                                >
                                                                    <FileText className="h-3.5 w-3.5" />
                                                                </a>
                                                            )}
                                                            {course.slides_pdf_url && (
                                                                <a
                                                                    href={course.slides_pdf_url}
                                                                    target="_blank"
                                                                    title="Download PDF"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="p-1 rounded text-[#00C896]/60 hover:text-[#00C896] hover:bg-[#00C896]/10 transition-colors"
                                                                >
                                                                    <FileImage className="h-3.5 w-3.5" />
                                                                </a>
                                                            )}
                                                            {course.slides_pptx_url && (
                                                                <a
                                                                    href={course.slides_pptx_url}
                                                                    target="_blank"
                                                                    title="Download PowerPoint"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="p-1 rounded text-[#00C896]/60 hover:text-[#00C896] hover:bg-[#00C896]/10 transition-colors"
                                                                >
                                                                    <Presentation className="h-3.5 w-3.5" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/[0.08]" onClick={(e) => e.stopPropagation()}>
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[160px] bg-[var(--page-bg)] border border-[var(--page-border)] shadow-xl backdrop-blur-sm">
                                                            <DropdownMenuLabel className="text-white/40">Actions</DropdownMenuLabel>
                                                            <Link href={`/courses/${course.id}`} target="_blank">
                                                                <DropdownMenuItem className="cursor-pointer focus:bg-white/[0.08] focus:text-white transition-colors text-white/65">
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Course
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            <Link href={`/admin/courses/edit/${course.id}`}>
                                                                <DropdownMenuItem className="cursor-pointer focus:bg-white/[0.08] focus:text-white transition-colors text-white/65">
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit Course
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            {(() => {
                                                                const total = course.totalModules ?? 0;
                                                                const done = course.modulesWithAudio ?? 0;
                                                                const allDone = total > 0 && done === total;
                                                                const busy = audioProgress.has(course.id);
                                                                return (
                                                                    <>
                                                                        <DropdownMenuItem
                                                                            className={allDone
                                                                                ? "text-white/25 cursor-not-allowed"
                                                                                : "text-[#00FFB3] cursor-pointer focus:bg-[#00FFB3]/10 focus:text-[#00FFB3] transition-colors"
                                                                            }
                                                                            disabled={allDone || busy}
                                                                            onClick={(e) => { e.stopPropagation(); if (!allDone) handleGenerateAudio(course.id, false); }}
                                                                        >
                                                                            {busy
                                                                                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                : <Headphones className="mr-2 h-4 w-4" />
                                                                            }
                                                                            {busy
                                                                                ? `Audio ${audioProgress.get(course.id)?.done ?? 0}/${audioProgress.get(course.id)?.total ?? '…'}`
                                                                                : allDone
                                                                                    ? `Audio complete (${done}/${total})`
                                                                                    : done > 0
                                                                                        ? `Generate Audio (${total - done} remaining)`
                                                                                        : 'Generate Audio'
                                                                            }
                                                                        </DropdownMenuItem>
                                                                        {total > 0 && (
                                                                            <DropdownMenuItem
                                                                                className="text-white/40 cursor-pointer focus:bg-white/[0.08] focus:text-white/70 transition-colors text-xs"
                                                                                disabled={busy}
                                                                                onClick={(e) => { e.stopPropagation(); handleGenerateAudio(course.id, true); }}
                                                                            >
                                                                                <RefreshCw className="mr-2 h-3 w-3" />
                                                                                Regenerate All Audio
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                            <DropdownMenuItem
                                                                className="text-[#9B8FFF] cursor-pointer focus:bg-[#9B8FFF]/10 focus:text-[#9B8FFF] transition-colors"
                                                                disabled={avatarGenerating.has(course.id)}
                                                                onClick={(e) => { e.stopPropagation(); handleGenerateAvatar(course.id); }}
                                                            >
                                                                {avatarGenerating.has(course.id)
                                                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    : <Film className="mr-2 h-4 w-4" />
                                                                }
                                                                Generate Avatar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-[#00C896] cursor-pointer focus:bg-[#00C896]/10 focus:text-[#00C896] transition-colors"
                                                                disabled={slidesGenerating.has(course.id)}
                                                                onClick={(e) => { e.stopPropagation(); handleGenerateSlides(course.id); }}
                                                            >
                                                                {slidesGenerating.has(course.id)
                                                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    : <Wand2 className="mr-2 h-4 w-4" />
                                                                }
                                                                {course.slides_url ? 'Regenerate Slides' : 'Generate Slides'}
                                                            </DropdownMenuItem>
                                                            {course.slides_url && (
                                                                <DropdownMenuItem
                                                                    className="text-[#00C896]/70 cursor-pointer focus:bg-[#00C896]/10 focus:text-[#00C896] transition-colors"
                                                                    onClick={(e) => { e.stopPropagation(); window.open(course.slides_url, '_blank'); }}
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Download MD
                                                                </DropdownMenuItem>
                                                            )}
                                                            {course.slides_pdf_url && (
                                                                <DropdownMenuItem
                                                                    className="text-[#00C896]/70 cursor-pointer focus:bg-[#00C896]/10 focus:text-[#00C896] transition-colors"
                                                                    onClick={(e) => { e.stopPropagation(); window.open(course.slides_pdf_url, '_blank'); }}
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Download PDF
                                                                </DropdownMenuItem>
                                                            )}
                                                            {course.slides_pptx_url && (
                                                                <DropdownMenuItem
                                                                    className="text-[#00C896]/70 cursor-pointer focus:bg-[#00C896]/10 focus:text-[#00C896] transition-colors"
                                                                    onClick={(e) => { e.stopPropagation(); window.open(course.slides_pptx_url, '_blank'); }}
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Download PPTX
                                                                </DropdownMenuItem>
                                                            )}
                                                            {course.slides_enabled === false ? (
                                                                <DropdownMenuItem
                                                                    className="text-[#00FFB3]/70 cursor-pointer focus:bg-[#00FFB3]/10 focus:text-[#00FFB3] transition-colors text-xs"
                                                                    onClick={(e) => { e.stopPropagation(); handleRevokeSlides(course.id, true); }}
                                                                >
                                                                    <CheckCircle className="mr-2 h-3.5 w-3.5" />
                                                                    Enable Slides
                                                                </DropdownMenuItem>
                                                            ) : (course.slides_url || course.slides_pdf_url) && (
                                                                <DropdownMenuItem
                                                                    className="text-[#FFB347]/70 cursor-pointer focus:bg-[#FFB347]/10 focus:text-[#FFB347] transition-colors text-xs"
                                                                    onClick={(e) => { e.stopPropagation(); handleRevokeSlides(course.id, false); }}
                                                                >
                                                                    <Archive className="mr-2 h-3.5 w-3.5" />
                                                                    Revoke Slides
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator className="bg-white/[0.08]" />
                                                            <DropdownMenuItem className="cursor-pointer focus:bg-white/[0.08] focus:text-white transition-colors text-white/65" onClick={(e) => { e.stopPropagation(); togglePublish(course); }}>
                                                                {course.published ? (
                                                                    <>
                                                                        <Archive className="mr-2 h-4 w-4" />
                                                                        Unpublish
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        Publish
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }}
                                                                className="text-[#FF6B6B] focus:bg-[#FF6B6B]/10 focus:text-[#FF6B6B] transition-colors"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}

                            {filteredCourses.length === 0 && !loading && (
                                <div className="text-center py-24 text-white/40">
                                    No courses found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

