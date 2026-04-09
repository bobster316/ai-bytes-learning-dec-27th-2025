'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, Brain, Sparkles, Trophy } from 'lucide-react';
import { cn } from "@/lib/utils";


interface Lesson {
    id: string;
    title: string;
    order_index: number;
    estimated_duration_minutes: number;
    key_takeaways?: string[];
    thumbnail_url?: string;
    description?: string;
    micro_objective?: string;
}

interface Topic {
    id: string;
    title: string;
    description?: string;
    order_index: number;
    course_lessons: Lesson[];
    course_quizzes: any[];
    thumbnail_url?: string;
    video_url?: string;
    intro_video_job_id?: string;
    intro_video_status?: string;
    instructor?: 'sarah' | 'gemma';
}

interface Course {
    id: string;
    title: string;
    description?: string;
    course_topics: Topic[];
    price: number;
}

interface PremiumCurriculumProps {
    course: Course;
    hasAccess: boolean;
    completedLessons?: string[];
    completedQuizzes?: string[];
}

export function PremiumCurriculum({ course, hasAccess, completedLessons = [], completedQuizzes = [] }: PremiumCurriculumProps) {
    // Default to ALL modules expanded so user sees full syllabus
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
        const all: Record<string, boolean> = {};
        course.course_topics.forEach(t => all[t.id] = true);
        return all;
    });

    const toggleModule = (topicId: string) => {
        setExpandedModules(prev => ({
            ...prev,
            [topicId]: !prev[topicId]
        }));
    };

    const expandAll = () => {
        const all: Record<string, boolean> = {};
        course.course_topics.forEach(t => all[t.id] = true);
        setExpandedModules(all);
    };

    // Calculate stats
    const totalLessons = course.course_topics.reduce((acc, t) => acc + (t.course_lessons?.length || 0), 0);
    const totalModules = course.course_topics.length;
    // Mock duration calculation (sum of minutes)
    const totalMinutes = course.course_topics.reduce((acc, t) =>
        acc + (t.course_lessons?.reduce((lAcc, l) => lAcc + (l.estimated_duration_minutes || 15), 0) || 0), 0);

    return (
        <section className="w-full bg-[#0a0a12] rounded-[2rem] border border-white/5 p-8 md:p-12 lg:p-16 relative overflow-hidden">
            {/* SVG Gradients */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id="gradient-brand" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
            </svg>

            <div className="curriculum-container w-full">

                {/* Section Header */}
                <div className="curriculum-header flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div className="header-content space-y-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FFB3]/10 text-[#00FFB3] text-xs font-bold uppercase tracking-widest border border-[#00FFB3]/20">
                            Course Curriculum
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">What you&apos;ll learn</h2>
                        <div className="flex flex-wrap items-center gap-4 text-white/40">
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4b98ad]"></span>
                                <span className="text-xs font-bold uppercase tracking-tight text-white/60">{totalModules} Modules</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB3]"></span>
                                <span className="text-xs font-bold uppercase tracking-tight text-white/60">{totalLessons} Lessons</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB347]"></span>
                                <span className="text-xs font-bold uppercase tracking-tight text-white/60">~{totalMinutes}m total</span>
                            </div>
                        </div>
                    </div>
                    <div className="curriculum-actions flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-all" onClick={expandAll}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                                <path d="M8 2v12M2 8h12" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Expand All
                        </button>
                    </div>
                </div>

                {/* AT-A-GLANCE SUMMARY CARD - BLEEDING EDGE */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    {[
                        { label: "Format", value: "Micro-Learning", sub: "15-min bursts", icon: <img src="/assets/thumbnails/format.png" className="w-8 h-8 object-contain" alt="Format" /> },
                        { label: "Instruction", value: "High-Velocity", sub: "Byte-sized blocks", icon: <img src="/assets/thumbnails/instruction.png" className="w-8 h-8 object-contain" alt="Instruction" /> },
                        { label: "Visual DNA", value: "Rule of 4", sub: "Instructional visuals", icon: <img src="/assets/thumbnails/visual-dna.png" className="w-8 h-8 object-contain" alt="Visual DNA" /> },
                        { label: "Assessment", value: "Knowledge Check", sub: "70% Pass Mark", icon: <img src="/assets/thumbnails/assessment.png" className="w-8 h-8 object-contain" alt="Assessment" /> }
                    ].map((item, i) => (
                        <div key={i} className="p-6 rounded-[2rem] glass-premium group hover:bg-white/10 transition-all duration-500 border border-white/5 hover:border-white/20">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                {item.icon}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{item.label}</div>
                            <div className="text-lg font-black text-white leading-tight mb-1">{item.value}</div>
                            <div className="text-xs text-slate-400 font-medium">{item.sub}</div>
                        </div>
                    ))}
                </div>

                {course.course_topics.map((topic, index) => {
                    const isExpanded = expandedModules[topic.id];
                    const lessonCount = topic.course_lessons?.length || 0;

                    // Calculate actual module progress
                    const completedInModule = topic.course_lessons?.filter(l => completedLessons.includes(l.id)).length || 0;
                    const quizPassed = topic.course_quizzes?.some(q => completedQuizzes.includes(q.id)) || false;
                    const moduleProgress = Math.round(((completedInModule + (quizPassed ? 1 : 0)) / (lessonCount + (topic.course_quizzes?.length || 0))) * 100);

                    const topicDuration = topic.course_lessons?.reduce((acc: number, l: any) => acc + (l.estimated_duration_minutes || 15), 0) || 0;
                    const isLocked = !hasAccess && index > 0;

                    const isGemmaTopic = topic.description?.toLowerCase().includes('[gemma]') || (topic as any).instructor === 'gemma';
                    const isGemmaCourse = course.description?.toLowerCase().includes('[gemma]');
                    const isGemma = isGemmaTopic || isGemmaCourse;
                    const displayDescription = topic.description?.replace(/\[gemma\]/gi, '').replace(/\[sarah\]/gi, '').trim();
                    const instructorName = isGemma ? 'Gemma' : 'Sarah';
                    const instructorPlaceholder = isGemma ? '/gemma_host.png' : '/sarah_host.png';

                    return (
                        <div key={topic.id} className={`module-container ${isExpanded ? 'expanded' : 'collapsed'} ${isLocked ? 'locked' : ''}`}>
                            {/* Module Header Bar */}
                            <div className="module-header-bar flex flex-col lg:flex-row lg:items-center py-8 px-8 gap-6" onClick={() => toggleModule(topic.id)}>
                                <div className="module-header-left">
                                    <button className="module-toggle">
                                        <svg className="chevron-icon" width="24" height="24" viewBox="0 0 24 24">
                                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" />
                                        </svg>
                                    </button>

                                    <div className={`module-badge w-20 h-20 rounded-2xl ${isLocked ? 'locked' : ''} shadow-xl`}>
                                        <span className="module-number text-3xl">{String(index + 1).padStart(2, '0')}</span>
                                        {isLocked && (
                                            <svg className="lock-icon-small" width="16" height="16">
                                                <rect x="5" y="8" width="6" height="6" rx="1" fill="currentColor" />
                                                <path d="M6 8V6a2 2 0 014 0v2" stroke="currentColor" fill="none" strokeWidth="1.5" />
                                            </svg>
                                        )}
                                    </div>

                                    {topic.thumbnail_url && (
                                        <div className="relative w-36 h-24 mr-6 hidden xl:block rounded-xl overflow-hidden shadow-md">
                                            <img
                                                src={topic.thumbnail_url}
                                                alt={topic.title}
                                                className="w-full h-full object-cover border border-white/10"
                                            />
                                        </div>
                                    )}

                                    <div className="module-info max-w-2xl">
                                        <h3 className="module-title text-2xl mb-2">{topic.title}</h3>
                                        {displayDescription && (
                                            <p className="text-slate-400 text-sm mb-3 font-light leading-relaxed line-clamp-2">
                                                {displayDescription}
                                            </p>
                                        )}
                                        <div className="module-meta">
                                            <span className="meta-item">
                                                <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="currentColor" /></svg>
                                                {lessonCount} lessons
                                            </span>
                                            <span className="meta-separator">•</span>
                                            <span className="meta-item">
                                                <svg width="14" height="14"><path d="M7 1v6l4 2" stroke="currentColor" fill="none" /></svg>
                                                {topicDuration} minutes
                                            </span>
                                            {topic.course_quizzes?.length > 0 && (
                                                <>
                                                    <span className="meta-separator">•</span>
                                                    <span className="meta-item">
                                                        <svg width="14" height="14"><path d="M2 8h10M7 3v10" stroke="currentColor" /></svg>
                                                        Interactive quiz
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="module-header-right flex items-center gap-3">
                                    {!isLocked && (
                                        <Link
                                            href={`/courses/${course.id}/topics/${topic.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4b98ad]/10 hover:bg-[#4b98ad]/20 text-[#4b98ad] text-xs font-semibold border border-[#4b98ad]/20 hover:border-[#4b98ad]/40 transition-all whitespace-nowrap"
                                        >
                                            View Module
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </Link>
                                    )}
                                    {isLocked ? (
                                        <div className="module-progress-pill">
                                            <svg width="16" height="16">
                                                <rect x="5" y="8" width="6" height="6" rx="1" fill="currentColor" />
                                                <path d="M6 8V6a2 2 0 014 0v2" stroke="currentColor" fill="none" strokeWidth="1.5" />
                                            </svg>
                                            <span className="progress-text">Locked</span>
                                        </div>
                                    ) : (
                                        <div className={cn("module-progress-pill", completedInModule === lessonCount && (topic.course_quizzes?.length === 0 || quizPassed) ? "completed border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "")}>
                                            <svg width="16" height="16" className={cn("check-icon", completedInModule === lessonCount ? "text-emerald-400" : "text-slate-500")}>
                                                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none" strokeWidth="2" />
                                                <path d="M5 8l2 2 4-4" stroke="currentColor" fill="none" strokeWidth="2" />
                                            </svg>
                                            <span className="progress-text">
                                                {completedInModule + (quizPassed ? 1 : 0)}/{lessonCount + (topic.course_quizzes?.length || 0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dedicated MODULE INSIGHTS Section */}
                            {isExpanded && (
                                <div className="module-insights-section bg-gradient-to-r from-[#00FFB3]/8 to-[#4b98ad]/8 border-t border-b border-[#4b98ad]/15 px-6 py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-[#00FFB3] uppercase tracking-wider">Module Insights</span>
                                            <div className="h-4 w-px bg-slate-600"></div>
                                            <div className="flex items-center gap-4 text-sm text-slate-300">
                                                <span className="flex items-center gap-1.5">
                                                    <svg width="14" height="14" viewBox="0 0 14 14" className="text-[#4b98ad]">
                                                        <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.3" />
                                                    </svg>
                                                    {lessonCount} lessons
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <svg width="14" height="14" viewBox="0 0 14 14" className="text-[#FFB347]">
                                                        <path d="M7 1v6l4 2" stroke="currentColor" fill="none" strokeWidth="1.5" />
                                                        <circle cx="7" cy="7" r="6" stroke="currentColor" fill="none" strokeWidth="1.5" />
                                                    </svg>
                                                    {topicDuration} min
                                                </span>
                                                {topic.course_quizzes?.length > 0 && (
                                                    <span className="flex items-center gap-1.5">
                                                        <svg width="14" height="14" viewBox="0 0 14 14" className="text-[#00FFB3]">
                                                            <path d="M2 7h10M7 2v10" stroke="currentColor" strokeWidth="1.5" />
                                                        </svg>
                                                        Interactive quiz
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs text-slate-400">Progress:</div>
                                            <div className="flex items-center gap-2 bg-slate-800/50 rounded-full px-3 py-1.5">
                                                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-[#00FFB3] to-[#4b98ad] transition-all duration-500" style={{ width: `${moduleProgress}%` }}></div>
                                                </div>
                                                <span className="text-xs font-medium text-slate-300">
                                                    {completedInModule + (quizPassed ? 1 : 0)}/{lessonCount + (topic.course_quizzes?.length || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Module Content: Lessons */}
                            {isExpanded && (
                                <div className="module-lessons-container bg-transparent border-t border-white/5">

                                    {/* Lessons List Section */}
                                    <div className="p-6 space-y-4">
                                        {topic.course_lessons?.map((lesson, lIdx) => (
                                            <div key={lesson.id} className="lesson-row group">
                                                {/* TIMELINE COLUMN */}
                                                <div className="lesson-timeline-column pt-2">
                                                    <div className={cn(
                                                        "timeline-dot shadow-[0_0_10px_rgba(0,0,0,0.5)] w-4 h-4 rounded-full border-4 border-slate-900 transition-colors z-10 relative",
                                                        completedLessons.includes(lesson.id) ? "completed bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-slate-700"
                                                    )}></div>
                                                    <div className="timeline-connector bg-slate-800 w-0.5 h-full ml-[7px] -mt-2"></div>
                                                </div>

                                                {/* LESSON CARD CONTENT - Entire card is clickable */}
                                                {hasAccess ? (
                                                    <Link
                                                        href={`/courses/${course.id}/lessons/${lesson.id}`}
                                                        className="lesson-card-content flex-1 ml-4 block hover:bg-[#4b98ad]/5 rounded-xl p-3 transition-colors border border-transparent hover:border-[#4b98ad]/15 cursor-pointer"
                                                    >
                                                        <div className="flex justify-between items-start gap-4">
                                                            {/* Thumbnail & Content Wrapper */}
                                                            <div className="flex gap-4 flex-1">
                                                                {/* Lesson Thumbnail */}
                                                                <div className="relative w-28 h-18 flex-shrink-0 hidden sm:block rounded-lg overflow-hidden bg-[#0A0A18] border border-slate-700/50 shadow-sm group-hover:shadow-md transition-all group-hover:border-cyan-500/30">
                                                                    <img
                                                                        src={lesson.thumbnail_url || topic.thumbnail_url || instructorPlaceholder}
                                                                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                                                                        alt={lesson.title}
                                                                    />
                                                                </div>

                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lesson {String(lIdx + 1).padStart(2, '0')}</span>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                                        <span className="text-[10px] text-slate-400">{lesson.estimated_duration_minutes || 15} min</span>
                                                                    </div>
                                                                    <h4 className={cn("font-medium text-lg leading-tight mb-2 transition-colors",
                                                                        completedLessons.includes(lesson.id) ? "text-white/70 group-hover:text-[#00FFB3]" : "text-white group-hover:text-[#4b98ad]"
                                                                    )}>
                                                                        {lesson.title}
                                                                        {completedLessons.includes(lesson.id) && (
                                                                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                                                Done
                                                                            </span>
                                                                        )}
                                                                    </h4>
                                                                    {lesson.micro_objective && (
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <span className="px-2 py-0.5 rounded bg-[#4b98ad]/10 text-[#4b98ad] text-[10px] font-bold uppercase tracking-tight border border-[#4b98ad]/20">
                                                                                Objective
                                                                            </span>
                                                                            <span className="text-slate-300 text-xs font-medium">
                                                                                {lesson.micro_objective}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <p className="text-slate-400 text-sm line-clamp-2 font-light">
                                                                        {lesson.description || (lesson.key_takeaways && lesson.key_takeaways[0]) || "Master the core concepts of " + lesson.title + "."}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Play button - now just visual indicator */}
                                                            <div className="h-10 w-10 rounded-full bg-white/5 group-hover:bg-[#4b98ad] group-hover:text-[#080810] text-white flex items-center justify-center transition-all flex-shrink-0">
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M8 5v14l11-7z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <div className="lesson-card-content flex-1 ml-4 p-3 rounded-xl border border-transparent opacity-50">
                                                        <div className="flex justify-between items-start gap-4">
                                                            {/* Thumbnail & Content Wrapper */}
                                                            <div className="flex gap-4 flex-1">
                                                                {/* Lesson Thumbnail */}
                                                                <div className="relative w-28 h-18 flex-shrink-0 hidden sm:block rounded-lg overflow-hidden bg-[#0A0A18] border border-slate-700/50">
                                                                    <img
                                                                        src={lesson.thumbnail_url || topic.thumbnail_url || "/sarah-placeholder.png"}
                                                                        className="w-full h-full object-cover opacity-50"
                                                                        alt={lesson.title}
                                                                    />
                                                                </div>

                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lesson {String(lIdx + 1).padStart(2, '0')}</span>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                                        <span className="text-[10px] text-slate-400">{lesson.estimated_duration_minutes || 15} min</span>
                                                                    </div>
                                                                    <h4 className="text-white font-medium text-lg leading-tight mb-2">
                                                                        {lesson.title}
                                                                    </h4>
                                                                    <p className="text-slate-400 text-sm line-clamp-2 font-light">
                                                                        {lesson.description || (lesson.key_takeaways && lesson.key_takeaways[0]) || "Master the core concepts of " + lesson.title + "."}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Locked indicator */}
                                                            <div className="h-10 w-10 rounded-full bg-white/5 text-slate-600 flex items-center justify-center flex-shrink-0">
                                                                <svg width="16" height="16" viewBox="0 0 16 16">
                                                                    <rect x="5" y="8" width="6" height="6" rx="1" fill="currentColor" />
                                                                    <path d="M6 8V6a2 2 0 014 0v2" stroke="currentColor" fill="none" strokeWidth="1.5" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* MODULE QUIZ CARD */}
                                        {topic.course_quizzes?.length > 0 && (
                                            <div className={cn(
                                                "module-quiz-row group rounded-xl p-3 transition-colors border border-transparent",
                                                quizPassed ? "bg-[#00FFB3]/5 hover:bg-[#00FFB3]/8 border-[#00FFB3]/20" : "hover:bg-[#4b98ad]/8 hover:border-[#4b98ad]/20"
                                            )}>
                                                <div className="flex gap-4 items-center">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                                        quizPassed ? "bg-[#00FFB3]/15 text-[#00FFB3]" : "bg-[#4b98ad]/15 text-[#4b98ad]"
                                                    )}>
                                                        {quizPassed ? (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-white font-medium">Knowledge Check</h4>
                                                        <p className="text-sm text-slate-400">
                                                            {quizPassed ? "Excellent work • 100% Score" : "Test your understanding • 5 Questions"}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href={`/courses/${course.id}/topics/${topic.course_quizzes[0].id}`}
                                                        className={cn(
                                                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block",
                                                            quizPassed ? "bg-[#00FFB3]/20 hover:bg-[#00FFB3]/30 text-[#00FFB3] border border-[#00FFB3]/30" : "bg-[#4b98ad] hover:bg-[#8a7fee] text-[#080810]"
                                                        )}
                                                    >
                                                        {quizPassed ? "Retake Quiz" : "Start Quiz"}
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default PremiumCurriculum;
