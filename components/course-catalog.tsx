"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Search,
    BookOpen,
    Clock,
    Users,
    Star,
    TrendingUp,
    Brain,
    Smartphone,
    Shield,
    Zap,
    PlayCircle,
    ArrowRight,
    Sparkles,
    Database,
    Code,
    Cpu,
    Globe,
    Briefcase,
    Lock,

    MessageSquare,
    Image,
    Layout,
    Box
} from "lucide-react";
import Link from "next/link";
import { Course } from "@/lib/types/schema";
import { motion, AnimatePresence } from "framer-motion";

interface CourseCatalogProps {
    courses: Course[];
}

const categories = [
    { id: "all", label: "All Courses", icon: BookOpen },
    { id: "foundational", label: "Foundational AI", icon: Brain },
    { id: "generative", label: "Generative AI", icon: Zap },
    { id: "applications", label: "AI Applications", icon: Smartphone },
    { id: "prompt-engineering", label: "Prompt Engineering", icon: MessageSquare },
    { id: "machine-learning", label: "Machine Learning", icon: Cpu },
    { id: "data-science", label: "Data Science", icon: Database },
    { id: "computer-vision", label: "Computer Vision", icon: Image },
    { id: "nlp", label: "NLP", icon: MessageSquare }, // Reusing icon for now or use Languages
    { id: "robotics", label: "Robotics & IoT", icon: Box }, // lucide-react doesn't have Robot in all versions, Box is safe
    { id: "security", label: "Security & Ethics", icon: Shield },
    { id: "business", label: "Business AI", icon: TrendingUp },
];

export function CourseCatalog({ courses }: CourseCatalogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);

    const filteredCourses = courses.filter((course) => {
        const matchesSearch =
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase());

        // Simulating category match - in real app would use course.category field
        const matchesCategory = selectedCategory === "all" || true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-cyan-500/30">
            {/* Hero Section - Homepage Style */}
            <section className="relative mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-white/5 shadow-2xl py-16 flex items-center overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-900 pointer-events-none rounded-3xl"></div>
                <div className="container relative z-10 mx-auto px-4 max-w-7xl">
                    <div className="text-center space-y-6">
                        <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-primary/20 text-cyan-300 font-medium text-lg tracking-wide uppercase">
                            AI COURSES
                        </span>
                        <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            Master the Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">Artificial Intelligence</span>
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                            Explore our award-winning curriculum designed to take you from beginner to expert in record time.
                        </p>
                    </div>
                </div>
            </section>

            {/* Filter & Search Bar - Sticky */}
            <div className="sticky top-20 z-40 -mt-8 mb-12 container mx-auto px-4 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-2xl rounded-2xl p-2 md:p-3"
                >
                    <div className="flex flex-col gap-6">
                        {/* Search Bar - Full Width and Prominent */}
                        <div className="relative w-full max-w-2xl mx-auto group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                            </div>
                            <Input
                                placeholder="Search topic, skill, or keyword..."
                                className="pl-14 h-14 bg-slate-100/50 dark:bg-slate-800/50 border-transparent focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-800 rounded-full text-base transition-all shadow-sm hover:shadow-md focus:shadow-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Categories - Centered, Wrapped Grid */}
                        <div className="w-full">
                            <div className="flex flex-wrap gap-2 justify-center items-center">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`
                                            relative flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-300
                                            ${selectedCategory === category.id
                                                ? 'text-white'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}
                                        `}
                                    >
                                        {selectedCategory === category.id && (
                                            <motion.div
                                                layoutId="activeCategory"
                                                className="absolute inset-0 bg-slate-900 dark:bg-cyan-600 shadow-lg shadow-slate-900/20 dark:shadow-cyan-600/20 rounded-full"
                                                initial={false}
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            <category.icon className={`w-4 h-4 ${selectedCategory === category.id ? 'text-cyan-400 dark:text-white' : ''}`} />
                                            {category.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Course Grid */}
            <section className="container mx-auto px-4 max-w-7xl pb-24">
                {filteredCourses.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800"
                    >
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No courses found</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            We couldn't find any courses matching your criteria. Try adjusting your search or filters.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        <AnimatePresence>
                            {filteredCourses.map((course, index) => (
                                <motion.div
                                    key={course.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                    onMouseEnter={() => setHoveredCourse(course.id)}
                                    onMouseLeave={() => setHoveredCourse(null)}
                                    className="group relative flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-2 transition-all duration-300"
                                >
                                    {/* Image Section */}
                                    <div className="relative h-56 overflow-hidden">
                                        {course.thumbnail_url ? (
                                            <img
                                                src={course.thumbnail_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                                <Brain className="w-16 h-16 text-slate-700" />
                                            </div>
                                        )}

                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                        {/* Top Badges */}
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <Badge className={`backdrop-blur-md border-none px-3 py-1 font-semibold ${(course.difficulty_level || 'Beginner') === 'Beginner' ? 'bg-green-500/20 text-green-300' :
                                                (course.difficulty_level || 'Beginner') === 'Intermediate' ? 'bg-blue-500/20 text-blue-300' :
                                                    'bg-purple-500/20 text-purple-300'
                                                }`}>
                                                {course.difficulty_level || 'Beginner'}
                                            </Badge>
                                        </div>

                                        <div className="absolute top-4 right-4">
                                            <div className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1 text-xs font-bold text-white border border-white/20">
                                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                4.9
                                            </div>
                                        </div>


                                        {/* Play Button Overlay (Hover) */}
                                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${hoveredCourse === course.id ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/50 cursor-pointer shadow-lg hover:bg-white hover:text-cyan-600 transition-colors">
                                                <PlayCircle className="w-8 h-8 text-white hover:text-cyan-600 fill-current" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="flex-1 p-6 flex flex-col relative bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50">
                                        <div className="mb-4 flex-1">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 min-h-[3.5rem]">
                                                {course.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed min-h-[2.5rem]">
                                                {course.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-foreground/70 mb-4 mt-auto">
                                            <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                                <span className="text-lg">
                                                    {course.price === 0 ? "FREE" : `£${course.price}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>1.2k</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                                                <span className="font-semibold">5.0</span>
                                            </div>
                                        </div>

                                        <Link href={`/courses/${course.id}`} className="mt-auto block">
                                            <Button className="w-full text-lg h-12 bg-primary hover:bg-primary/90" variant="default">
                                                {course.price === 0 ? "Start Learning" : "View Details"}
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

            </section >
        </div >
    );
}
