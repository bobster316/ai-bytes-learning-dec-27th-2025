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
    Loader2
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
import { ApiUsageDashboard } from "@/components/admin/api-usage-dashboard";

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
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

    // audioProgress: courseId -> { done, total } while generating; absent when idle
    const [audioProgress, setAudioProgress] = useState<Map<string, { done: number; total: number }>>(new Map());

    const handleGenerateAudio = async (courseId: string) => {
        setAudioProgress(prev => new Map(prev).set(courseId, { done: 0, total: 0 }));
        try {
            const res = await fetch('/api/admin/courses/generate-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, force: false })
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
        <div className="min-h-screen bg-[#080810] text-[#f5f5f7] font-sans">
            <Header />
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
                                    Manage and organize your AI curriculum.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 shrink-0">
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
                                    <Button className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white font-bold px-6 whitespace-nowrap shrink-0">
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Course
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="w-full shadow-sm rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 overflow-hidden">
                            <ApiUsageDashboard />
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/[0.02] p-4 rounded-xl border border-white/[0.08] shadow-sm">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <Input
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-white/[0.03] text-white border-white/[0.08] focus:bg-white/[0.06] transition-colors"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="flex p-1 bg-white/[0.03] border border-white/[0.05] rounded-lg">
                                    {['all', 'published', 'draft'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status as any)}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${statusFilter === status
                                                ? 'bg-[#4b98ad] text-white shadow-sm'
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
                    <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] shadow-sm overflow-x-auto">
                        <div className="min-w-[1200px]">
                            {/* Table Header */}
                            <div className="grid grid-cols-[240px_minmax(250px,3fr)_minmax(150px,2fr)_150px_120px_100px_100px_80px] gap-4 p-4 border-b border-white/[0.08] bg-white/[0.01] text-xs font-bold text-white/50 uppercase tracking-wider items-center whitespace-nowrap">
                                <div className="pl-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-white/[0.2] bg-transparent text-primary w-4 h-4 cursor-pointer"
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
                                                className={`grid grid-cols-[240px_minmax(250px,3fr)_minmax(150px,2fr)_150px_120px_100px_100px_80px] gap-4 p-4 items-center hover:bg-white/[0.04] transition-colors ${selectedCourses.has(course.id) ? 'bg-[#4b98ad]/10' : ''}`}
                                            >
                                                {/* Checkbox & Thumbnail */}
                                                <div className="flex items-center gap-4 pl-2">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-white/[0.2] bg-transparent text-primary w-4 h-4 cursor-pointer"
                                                        checked={selectedCourses.has(course.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={() => toggleSelection(course.id)}
                                                    />
                                                    <div className="w-48 h-32 rounded-lg bg-[#0c0c1a] overflow-hidden border border-white/[0.1] relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleSelection(course.id); }}>
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
                                                    <Link href={`/courses/${course.id}`} onClick={(e) => e.stopPropagation()} className="font-bold text-white hover:text-primary transition-colors text-base block" title={course.title}>
                                                        {course.title}
                                                    </Link>
                                                </div>

                                                {/* Category */}
                                                <div className="text-sm text-white/60 flex items-center gap-1">
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
                                                    <Badge variant="outline" className={`font-medium border-none whitespace-nowrap ${(course.difficulty_level || 'Beginner') === 'Beginner' ? 'bg-[#4b98ad]/20 text-[#4b98ad] ring-1 ring-[#4b98ad]/30' :
                                                        (course.difficulty_level || 'Beginner') === 'Intermediate' ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' :
                                                            'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30'
                                                        }`}>
                                                        {course.difficulty_level || 'Beginner'}
                                                    </Badge>
                                                </div>

                                                {/* Price */}
                                                <div className="font-semibold text-white/80">
                                                    {(course.price || 0) === 0 ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/[0.06] text-white/70 text-xs">FREE</span>
                                                    ) : (
                                                        `£${Number(course.price).toFixed(2)}`
                                                    )}
                                                </div>

                                                {/* Status */}
                                                <div className="text-center flex flex-col items-center gap-1">
                                                    <Badge className={`backdrop-blur-md shadow-sm border-none px-3 ${course.published
                                                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                        : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                                        }`}>
                                                        {course.published ? 'Live' : 'Draft'}
                                                    </Badge>
                                                    {audioProgress.has(course.id) && (() => {
                                                        const p = audioProgress.get(course.id)!;
                                                        return (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                {p.total > 0 ? `${p.done}/${p.total}` : 'Starting…'}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-end pr-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10" onClick={(e) => e.stopPropagation()}>
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[160px] bg-[#1a1a2e] border-white/10 text-white shadow-xl">
                                                            <DropdownMenuLabel className="text-white/50">Actions</DropdownMenuLabel>
                                                            <Link href={`/courses/${course.id}`} target="_blank">
                                                                <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white transition-colors">
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Course
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            <Link href={`/admin/courses/edit/${course.id}`}>
                                                                <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white transition-colors">
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit Course
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            <DropdownMenuItem
                                                                className="text-[#4b98ad] cursor-pointer focus:bg-[#4b98ad]/10 focus:text-[#4b98ad] transition-colors"
                                                                disabled={audioProgress.has(course.id)}
                                                                onClick={(e) => { e.stopPropagation(); handleGenerateAudio(course.id); }}
                                                            >
                                                                {audioProgress.has(course.id)
                                                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    : <Headphones className="mr-2 h-4 w-4" />
                                                                }
                                                                Generate Audio
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-white/10" />
                                                            <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white transition-colors" onClick={(e) => { e.stopPropagation(); togglePublish(course); }}>
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
                                                                className="text-red-400 focus:bg-red-500/10 focus:text-red-400 transition-colors"
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

