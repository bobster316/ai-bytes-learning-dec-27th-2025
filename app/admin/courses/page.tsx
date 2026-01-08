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
    CheckCircle
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
            const response = await fetch('/api/admin/courses/list');
            if (response.ok) {
                const data = await response.json();
                setCourses(data.courses || []);
            } else if (response.status === 404) {
                // Valid state: No courses yet or endpoint not ready
                setCourses([]);
            } else if (response.status === 500) {
                // Generation likely in progress - silent return (Option B)
                return;
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
                                        variant="danger"
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
                                            <div className="flex items-center justify-end pr-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <Link href={`/courses/${course.id}`} target="_blank">
                                                            <DropdownMenuItem>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Course
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <Link href={`/admin/courses/edit/${course.id}`}>
                                                            <DropdownMenuItem>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit Course
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePublish(course); }}>
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
                                                            className="text-red-600 focus:text-red-600"
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
