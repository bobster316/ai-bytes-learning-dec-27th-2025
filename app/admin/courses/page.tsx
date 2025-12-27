"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    BookOpen,
    Eye,
    Trash2,
    Edit,
    Image as ImageIcon,
    Clock,
    Activity,
    ShieldCheck,
    ChevronRight,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Header } from "@/components/header";

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
    const supabase = createClient();

    const [hasDuplicates, setHasDuplicates] = useState(false);
    const [duplicateCount, setDuplicateCount] = useState(0);

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

    const checkForDuplicates = useCallback((courseList: any[]) => {
        const seenIds = new Set();
        let dups = 0;
        for (const course of courseList) {
            if (!course.thumbnail_url) continue;
            let id = course.thumbnail_url;
            if (id.includes('pexels')) id = id.match(/\/photos\/(\d+)\//)?.[1] || id;
            else if (id.includes('unsplash')) id = id.match(/photo-([a-zA-Z0-9-]+)/)?.[1] || id;
            else if (id.includes('pollinations')) {
                if (!id.includes('seed=')) id = id.split('?')[0];
            }

            if (seenIds.has(id)) dups++;
            else seenIds.add(id);
        }
        setDuplicateCount(dups);
        setHasDuplicates(dups > 0);
    }, []);

    const fetchCourses = useCallback(async () => {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error) {
            setCourses(data || []);
            checkForDuplicates(data || []);
        }
        setLoading(false);
    }, [supabase, checkForDuplicates]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    async function deleteCourse(id: string) {
        if (!confirm("Are you sure? This will delete all topics, lessons, and quizzes permanently.")) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/course/delete?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchCourses(); // Refresh list
            } else {
                const err = await response.json();
                console.error("Delete failed:", err);
                alert("Failed to delete course. Please check console.");
                setLoading(false);
            }
        } catch (e) {
            console.error("Delete exception:", e);
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

    const handleFixDuplicates = async () => {
        setLoading(true);
        const processedIds = new Set();
        const updates = [];
        let fixedCount = 0;

        console.log('[Dedupe] Starting scan...');

        for (const course of courses) {
            if (!course.thumbnail_url) continue;

            let id = course.thumbnail_url;
            if (id.includes('pexels')) id = id.match(/\/photos\/(\d+)\//)?.[1] || id;
            else if (id.includes('unsplash')) id = id.match(/photo-([a-zA-Z0-9-]+)/)?.[1] || id;
            else if (id.includes('pollinations')) {
                if (!id.includes('seed=')) id = id.split('?')[0];
            }

            if (processedIds.has(id)) {
                // Found duplicate!
                fixedCount++;
                console.log('[Dedupe] Fixing duplicate for:', course.title);
                const seed = Math.floor(Math.random() * 1000000000);
                const prompt = course.title.substring(0, 50) + " abstract technology";
                const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${seed}`;

                updates.push(
                    supabase.from('courses').update({ thumbnail_url: newUrl }).eq('id', course.id)
                );
            } else {
                processedIds.add(id);
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
            // Force hard reload to clear image cache
            window.location.reload();
        } else {
            setLoading(false);
        }
    };

    async function togglePublish(course: any) {
        const newStatus = !course.published;
        const { error } = await supabase
            .from('courses')
            .update({ published: newStatus })
            .eq('id', course.id);

        if (!error) {
            setCourses(courses.map(c => c.id === course.id ? { ...c, published: newStatus } : c));
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

    const deleteSelected = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedCourses.size} courses? This cannot be undone.`)) return;
        setLoading(true);
        for (const id of Array.from(selectedCourses)) {
            await fetch(`/api/course/delete`, {
                method: 'DELETE',
                body: JSON.stringify({ id: id })
            });
        }
        await fetchCourses();
        setSelectedCourses(new Set());
    };

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans">
            <Header />
            <div className="p-6 lg:p-8">
                <div className="max-w-[1200px] mx-auto space-y-8">

                    {/* Header & Controls */}
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                    Courses
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Manage and organize your AI curriculum.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                {selectedCourses.size > 0 && (
                                    <Button
                                        variant="destructive"
                                        className="rounded-full shadow-lg font-bold px-6"
                                        onClick={deleteSelected}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete ({selectedCourses.size})
                                    </Button>
                                )}
                                <Link href="/admin/courses/new">
                                    <Button className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white font-bold px-6">
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Course
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="flex p-1 bg-gray-100 rounded-lg">
                                    {['all', 'published', 'draft'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status as any)}
                                            className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${statusFilter === status
                                                ? 'bg-white text-primary shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
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
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-[140px_3fr_1.5fr_120px_120px_100px_100px_80px] gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider items-center whitespace-nowrap">
                            <div className="pl-2">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary w-4 h-4 cursor-pointer"
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
                            <div className="divide-y divide-gray-100">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-4 flex items-center gap-4">
                                        <div className="w-16 h-10 bg-gray-100 rounded animate-pulse" />
                                        <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                <AnimatePresence mode="popLayout">
                                    {filteredCourses.map((course) => (
                                        <motion.div
                                            key={course.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={`grid grid-cols-[140px_3fr_1.5fr_120px_120px_100px_100px_80px] gap-4 p-4 items-center hover:bg-gray-50 transition-colors ${selectedCourses.has(course.id) ? 'bg-blue-50/50' : ''}`}
                                        >
                                            {/* Checkbox & Thumbnail */}
                                            <div className="flex items-center gap-4 pl-2">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-primary w-4 h-4 cursor-pointer"
                                                    checked={selectedCourses.has(course.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={() => toggleSelection(course.id)}
                                                />
                                                <div className="w-24 h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleSelection(course.id); }}>
                                                    {course.thumbnail_url ? (
                                                        <img
                                                            src={course.thumbnail_url}
                                                            alt={course.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <ImageIcon className="w-5 h-5 text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Title (Only) */}
                                            <div className="min-w-0">
                                                <Link href={`/courses/${course.id}`} onClick={(e) => e.stopPropagation()} className="font-bold text-gray-900 hover:text-primary transition-colors text-base block truncate" title={course.title}>
                                                    {course.title}
                                                </Link>
                                            </div>

                                            {/* Category */}
                                            <div className="text-sm text-gray-600 flex items-center gap-1 whitespacenowrap">
                                                <BookOpen className="w-3 h-3 text-gray-400" />
                                                <span className="truncate max-w-[120px]" title={course.category}>
                                                    {categories.find(c => c.id === course.category)?.label || course.category || 'General'}
                                                </span>
                                            </div>

                                            {/* Date */}
                                            <div className="text-sm text-gray-500 whitespace-nowrap">
                                                {new Date(course.created_at).toLocaleDateString()}
                                            </div>

                                            {/* Difficulty */}
                                            <div>
                                                <Badge variant="outline" className={`font-medium border-none whitespace-nowrap ${(course.difficulty_level || 'Beginner') === 'Beginner' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' :
                                                    (course.difficulty_level || 'Beginner') === 'Intermediate' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' :
                                                        'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20'
                                                    }`}>
                                                    {course.difficulty_level || 'Beginner'}
                                                </Badge>
                                            </div>

                                            {/* Price */}
                                            <div className="font-semibold text-gray-700">
                                                {(course.price || 0) === 0 ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs">FREE</span>
                                                ) : (
                                                    `£${Number(course.price).toFixed(2)}`
                                                )}
                                            </div>

                                            {/* Status */}
                                            <div className="text-center">
                                                <Badge className={`backdrop-blur-md shadow-sm border-none px-3 ${course.published
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                    }`}>
                                                    {course.published ? 'Live' : 'Draft'}
                                                </Badge>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 justify-end">
                                                <Link href={`/admin/courses/edit/${course.id}`}>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-gray-500 hover:text-blue-600"
                                                        onClick={(e) => { e.stopPropagation(); }}
                                                        title="Edit Course"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-gray-500 hover:text-primary"
                                                    onClick={(e) => { e.stopPropagation(); togglePublish(course); }}
                                                    title={course.published ? "Unpublish" : "Publish"}
                                                >
                                                    {course.published ? <ShieldCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-gray-500 hover:text-red-600"
                                                    onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }}
                                                    title="Delete Course"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        {filteredCourses.length === 0 && !loading && (
                            <div className="text-center py-24 text-gray-500">
                                No courses found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
