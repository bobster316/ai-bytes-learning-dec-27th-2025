"use client";

import { motion } from "framer-motion";
import {
    Activity,
    BookOpen,
    CheckCircle2,
    Lightbulb,
    ArrowRight,
    Trophy,
    AlertCircle,
    Check,
    X as CloseIcon
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useScroll, useSpring } from "framer-motion";

export function LessonContentRenderer({ content, images }: { content: any, images: any[] }) {
    if (!content) return null;

    // Helper to strip HTML tags from text (for titles that shouldn't contain HTML)
    const stripHtmlTags = (text: string): string => {
        if (!text) return '';
        return text.replace(/<[^>]*>/g, '').trim();
    };

    // Helper to find image for a section
    const getImageForSection = (index: number) => {
        if (!images || images.length <= index) return null;
        return images[index];
    };

    // "Neural Architect" Card Style
    const cardClasses = "bg-card border border-border/50 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300";

    return (
        <div className="bg-background text-foreground font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-32">

            <div className="max-w-[700px] mx-auto px-4 md:px-0 pt-12 space-y-[var(--para-spacing)]">

                {/* Introduction Section */}
                <div className="space-y-8 text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-mono uppercase tracking-[0.2em] font-bold">
                        <BookOpen className="w-3 h-3" />
                        Introduction
                    </div>
                    {/* Introduction: Standard Sans, readable, justified */}
                    <div
                        className="font-sans text-[18px] leading-[32px] text-muted-foreground font-light text-justify [&_p]:mb-12"
                        dangerouslySetInnerHTML={{ __html: content.introduction }}
                    />
                </div>

                {/* Video Player (Cinematic) */}
                {(content.video_url || (content.videoScript && String(content.videoScript).includes('http'))) && (
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-border bg-black aspect-video relative group ring-1 ring-white/5 my-12">
                        <video
                            src={content.video_url || content.videoScript}
                            controls
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Stats / Key Metrics - Visual Break */}
                {content.stats && content.stats.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-16">
                        {content.stats.map((stat: any, i: number) => (
                            <div key={i} className={`${cardClasses} flex flex-col justify-center items-center text-center`}>
                                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-cyan-400 mb-2 font-sans tracking-tighter">{stat.value}</div>
                                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Primary Image */}
                {getImageForSection(0) && (
                    <div className="rounded-[2rem] overflow-hidden border border-border/50 shadow-2xl my-12">
                        <img
                            src={getImageForSection(0).image_url}
                            className="w-full h-auto max-h-[500px] object-cover"
                            alt="Lesson Overview"
                        />
                    </div>
                )}

                {/* Content Sections */}
                <div className="space-y-32">
                    {content.sections?.map((section: any, idx: number) => {
                        const img = getImageForSection(idx + 1);

                        return (
                            <section key={idx} className="space-y-12">
                                <div className="space-y-6">
                                    <span className="text-6xl font-black text-muted-foreground/10 block font-sans select-none">{String(idx + 1).padStart(2, '0')}</span>
                                    {/* H2: Sans-Serif, All-Caps (tracked out) per spec */}
                                    <h2 className="text-[length:var(--fs-h2)] font-bold text-foreground tracking-[0.05em] uppercase font-sans leading-tight">
                                        {stripHtmlTags(section.title)}
                                    </h2>
                                    <div className="h-0.5 w-12 bg-cyan-500 rounded-full" />
                                </div>

                                {/* Main Content: The "Golden Grid" Typography */}
                                <div className="prose prose-base dark:prose-invert max-w-none text-muted-foreground
                                    [&_p]:!text-[18px] 
                                    [&_p]:!leading-[32px] 
                                    [&_p]:!tracking-tight
                                    [&_p]:!mb-12
                                    [&_p]:!font-normal
                                    [&_p]:!text-justify
                                    [&_p]:block
                                    prose-headings:text-foreground prose-headings:font-bold
                                    [&_li]:!text-[18px] 
                                    [&_li]:!leading-[32px]
                                    prose-strong:text-foreground prose-strong:font-bold
                                    
                                    /* Bullet points override */
                                    marker:text-cyan-400">
                                    <div dangerouslySetInnerHTML={{ __html: section.content }} />
                                </div>

                                {img && (
                                    <div className="rounded-2xl overflow-hidden shadow-xl border border-border/50 my-16 group relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <img src={img.image_url} alt={section.title} className="w-full h-auto object-cover" />
                                        {img.caption && (
                                            <div className="absolute bottom-0 left-0 w-full p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                <p className="text-xs font-mono uppercase tracking-widest text-white/90">{img.caption}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Instructor Insight - Visual Break */}
                                {idx === 0 && content.instructorInsight && (
                                    <div className="bg-primary/5 border-l-4 border-primary p-8 md:p-12 my-16 relative overflow-hidden backdrop-blur-sm">
                                        <div className="relative z-10 flex gap-6 items-start">
                                            <div className="p-3 bg-primary/10 rounded-full shrink-0 text-primary">
                                                <Lightbulb className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="font-bold text-foreground text-lg font-sans">{stripHtmlTags(content.instructorInsight.name)}</div>
                                                    <div className="text-muted-foreground text-xs font-mono uppercase tracking-widest">{stripHtmlTags(content.instructorInsight.title)}</div>
                                                </div>
                                                <p className="text-xl text-foreground italic font-sans leading-relaxed">"{stripHtmlTags(content.instructorInsight.wisdom)}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>

                {/* Hands On Challenge */}
                {content.handsOnChallenge && (
                    <div className="my-24 bg-card border border-border/50 rounded-[2rem] p-10 md:p-16 relative overflow-hidden shadow-lg">
                        <div className="relative z-10 space-y-12">
                            <div className="space-y-4">
                                <span className="text-cyan-500 text-xs font-mono uppercase tracking-[0.3em] font-bold">Practical Application</span>
                                <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-sans">
                                    {stripHtmlTags(content.handsOnChallenge.objective)}
                                </h3>
                            </div>

                            <div className="grid gap-6">
                                {content.handsOnChallenge.steps.map((step: string, sIdx: number) => (
                                    <div key={sIdx} className="flex gap-6 items-start p-6 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/30">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-mono font-bold text-primary mt-1">
                                            {sIdx + 1}
                                        </div>
                                        <p className="text-lg text-muted-foreground font-light leading-relaxed font-sans">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Key Takeaways */}
                {content.keyTakeaways && (
                    <div className="my-24 bg-gradient-to-b from-muted/10 to-transparent border border-border/50 rounded-[2rem] p-10 md:p-16">
                        <h3 className="text-2xl font-semibold text-foreground mb-12 flex items-center gap-4 font-sans">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                            <span className="tracking-tight">Strategic Synthesis</span>
                        </h3>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                            {content.keyTakeaways.map((point: string, idx: number) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    <div className="mt-2.5 w-1.5 h-1.5 rotate-45 bg-cyan-400 flex-shrink-0" />
                                    <span className="text-muted-foreground leading-relaxed text-lg">{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
}

export default LessonContentRenderer;
