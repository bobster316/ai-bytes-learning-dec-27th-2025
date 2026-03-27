"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import {
    Search, BookOpen, Clock, Users, Star, TrendingUp, Brain,
    Smartphone, Shield, Zap, ArrowRight, Database, Bot,
    Building2, MessageSquare, Image, Layout
} from "lucide-react";
import Link from "next/link";
import { Course } from "@/lib/types/schema";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";

interface CourseCatalogProps {
    courses: Course[];
    initialCategory?: string;
}

const categories = [
    { id: "all",                label: "All Courses",                    icon: BookOpen },
    { id: "ai-foundations",     label: "AI Foundations & Fundamentals",  icon: Brain },
    { id: "generative-ai",      label: "Generative AI & LLMs",           icon: Zap },
    { id: "prompt-engineering", label: "Prompt Engineering",             icon: MessageSquare },
    { id: "ai-tools",           label: "AI Tools & Applications",        icon: Smartphone },
    { id: "business-ai",        label: "AI for Business & Strategy",     icon: TrendingUp },
    { id: "ai-ethics",          label: "AI Ethics & Governance",         icon: Shield },
    { id: "ai-agents",          label: "AI Agents & Automation",         icon: Bot },
    { id: "nlp",                label: "NLP & Conversational AI",        icon: MessageSquare },
    { id: "computer-vision",    label: "Computer Vision & Image AI",     icon: Image },
    { id: "industry-ai",        label: "AI in Industry Applications",    icon: Building2 },
    { id: "data-ai",            label: "Data & AI Fundamentals",         icon: Database },
    { id: "ai-product",         label: "AI Product Development",         icon: Layout },
];

const difficultyColor: Record<string, string> = {
    Beginner:     "#00FFB3",
    Intermediate: "#4b98ad",
    Advanced:     "#FF6B6B",
};

export function CourseCatalog({ courses, initialCategory }: CourseCatalogProps) {
    const [searchQuery, setSearchQuery]       = useState("");
    const validInitial = categories.some(c => c.id === initialCategory) ? initialCategory! : "all";
    const [selectedCategory, setSelectedCategory] = useState(validInitial);

    const filteredCourses = courses.filter((course) => {
        const matchesSearch =
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesCategory = true;
        if (selectedCategory !== "all") {
            const categoryLabel = categories.find(c => c.id === selectedCategory)?.label;
            if (categoryLabel) {
                const exactMatch   = course.category === categoryLabel;
                const arrayMatch   = (course as any).categories?.includes(categoryLabel);
                const keywordMatch = !course.category && (
                    course.title.toLowerCase().includes(categoryLabel.toLowerCase()) ||
                    course.description?.toLowerCase().includes(categoryLabel.toLowerCase())
                );
                matchesCategory = exactMatch || !!arrayMatch || keywordMatch;
            }
        }
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#080810] font-body relative overflow-x-hidden">

            {/* ── Mesh gradient blobs ─────────────────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
                <div className="absolute rounded-full" style={{ width: 900, height: 900, background: "#4b98ad", top: "0%",  left: "-20%", filter: "blur(120px)", opacity: 0.1, animation: "ctMesh 35s linear infinite" }} />
                <div className="absolute rounded-full" style={{ width: 700, height: 700, background: "#00FFB3", top: "40%", right: "-15%", filter: "blur(120px)", opacity: 0.07, animation: "ctMesh 28s linear infinite reverse" }} />
                <div className="absolute rounded-full" style={{ width: 600, height: 600, background: "#FFB347", bottom: "10%", left: "30%", filter: "blur(120px)", opacity: 0.06, animation: "ctMesh 22s linear infinite", animationDelay: "-11s" }} />
            </div>

            {/* ── Grain overlay ───────────────────────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, opacity: 0.025, mixBlendMode: "soft-light" }} aria-hidden="true">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <filter id="ct-grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
                    <rect width="100%" height="100%" filter="url(#ct-grain)" />
                </svg>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes ctMesh {
                    0%   { transform: translate(0,0) scale(1); }
                    33%  { transform: translate(40px,-50px) scale(1.07); }
                    66%  { transform: translate(-30px,30px) scale(0.95); }
                    100% { transform: translate(0,0) scale(1); }
                }
                .catalog-search::placeholder { color: rgba(255,255,255,0.25); }
                .catalog-search:focus { outline: none; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            ` }} />

            <Header />

            <div className="relative z-10">

                {/* ── Hero ──────────────────────────────────────────────────── */}
                <section className="max-w-[1140px] mx-auto px-[4vw] pt-20 pb-14 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-white/40 mb-5">
                            The Curriculum
                        </p>
                        <h1 className="font-display font-black leading-[0.92] tracking-[-0.03em] mb-6 text-white"
                            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}>
                            Peak Learning{" "}
                            <span style={{ color: "#4b98ad" }}>Velocity</span>
                        </h1>
                        <p className="font-body text-lg text-white/55 max-w-xl mx-auto leading-relaxed">
                            The definitive micro-curriculum for the next generation of AI practitioners.
                        </p>
                    </motion.div>
                </section>

                {/* ── Search + Filters ──────────────────────────────────────── */}
                <div className="max-w-[1140px] mx-auto px-[4vw] mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-[#0d0d1c] border border-white/[0.06] rounded-3xl p-5 md:p-7 space-y-6"
                    >
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="catalog-search w-full h-13 bg-white/[0.04] border border-white/[0.07] rounded-2xl pl-12 pr-5 text-white/80 text-sm font-body focus:border-[#4b98ad]/40 focus:bg-white/[0.06] transition-colors duration-200"
                                style={{ height: "3.25rem" }}
                            />
                        </div>

                        {/* Category pills */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide md:flex-wrap">
                            {categories.map((cat) => {
                                const active = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[0.65rem] uppercase tracking-[0.1em] transition-all duration-200 border"
                                        style={{
                                            background:   active ? "#4b98ad18" : "transparent",
                                            borderColor:  active ? "#4b98ad50" : "rgba(255,255,255,0.08)",
                                            color:        active ? "#4b98ad"   : "rgba(255,255,255,0.45)",
                                        }}
                                    >
                                        <cat.icon className="w-3.5 h-3.5 shrink-0" />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* ── Course Grid ───────────────────────────────────────────── */}
                <section className="max-w-[1140px] mx-auto px-[4vw] pb-28">

                    {/* Count label */}
                    <p className="font-mono text-[0.59rem] uppercase tracking-[0.22em] text-white/40 mb-6">
                        — {filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"} available
                    </p>

                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-24 bg-[#0d0d1c] rounded-3xl border border-dashed border-white/[0.07]">
                            <Search className="w-10 h-10 text-white/15 mx-auto mb-4" />
                            <h3 className="font-display font-bold text-white/70 text-lg mb-2">No courses found</h3>
                            <p className="font-body text-white/35 text-sm">Try adjusting your filters or search term.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <AnimatePresence mode="popLayout">
                                {filteredCourses.map((course, i) => {
                                    const level     = course.difficulty_level || "Beginner";
                                    const accent    = difficultyColor[level] ?? "#00FFB3";
                                    const durationM = course.estimated_duration_hours
                                        ? Math.round(course.estimated_duration_hours * 60)
                                        : 15;

                                    return (
                                        <motion.div
                                            key={course.id}
                                            layout
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.97 }}
                                            transition={{ delay: Math.min(i * 0.04, 0.28), ease: [0.16, 1, 0.3, 1] }}
                                        >
                                            <Link href={`/courses/${course.id}`} className="group block h-full">
                                                <div className="relative overflow-hidden bg-[#0d0d1c] border border-white/[0.06] rounded-3xl flex flex-col h-full hover:border-white/[0.12] transition-colors duration-300">

                                                    {/* Thumbnail */}
                                                    <div className="relative aspect-video overflow-hidden rounded-t-3xl">
                                                        {course.thumbnail_url ? (
                                                            <img
                                                                src={course.thumbnail_url}
                                                                alt={course.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center" style={{ background: `${accent}0d` }}>
                                                                <Brain className="w-10 h-10" style={{ color: accent, opacity: 0.4 }} />
                                                            </div>
                                                        )}
                                                        {/* Gradient fade into card */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1c]/60 via-transparent to-transparent" />

                                                        {/* Difficulty chip */}
                                                        <div
                                                            className="absolute top-3.5 left-3.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border backdrop-blur-md"
                                                            style={{ background: `${accent}15`, borderColor: `${accent}35`, color: accent }}
                                                        >
                                                            {level}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="p-6 flex flex-col flex-1 gap-4">
                                                        <div className="flex-1">
                                                            <h3 className="font-display font-black text-[1.05rem] text-white leading-snug tracking-[-0.02em] line-clamp-2 group-hover:text-[#4b98ad] transition-colors duration-300 mb-2">
                                                                {course.title}
                                                            </h3>
                                                            <p className="font-body text-[0.82rem] text-white/45 line-clamp-2 leading-relaxed">
                                                                {course.description}
                                                            </p>
                                                        </div>

                                                        {/* Meta row */}
                                                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                                                            <span className="font-mono text-sm font-bold" style={{ color: accent }}>
                                                                {course.price === 0 ? "FREE" : `£${course.price}`}
                                                            </span>
                                                            <div className="flex items-center gap-3 font-mono text-[0.6rem] text-white/40">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> {durationM}m
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Star className="w-3 h-3 fill-[#FFB347] text-[#FFB347]" /> 5.0
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* CTA */}
                                                        <button
                                                            className="w-full h-11 rounded-xl font-mono text-[0.65rem] uppercase tracking-[0.12em] border transition-all duration-200 flex items-center justify-center gap-2 group-hover:bg-[#4b98ad]/10 group-hover:border-[#4b98ad]/40 group-hover:text-[#4b98ad]"
                                                            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}
                                                        >
                                                            {course.price === 0 ? "Start Free" : "Go to Course"}
                                                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
