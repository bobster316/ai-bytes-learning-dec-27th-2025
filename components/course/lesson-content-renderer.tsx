"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { LessonBlockRenderer } from "./block-renderer";
import { VoiceAvatar } from "@/components/voice/voice-avatar";
import { CourseBackground } from "./course-background";

export function LessonContentRenderer({ content, images, audioUrl, videoUrl, videoOverviewUrl, pipelineType, isFreePreview = false, footerNode, lessonMetadata, lessonTitle }: { content: any, images: any[], audioUrl?: string, videoUrl?: string, videoOverviewUrl?: string, pipelineType?: string, isFreePreview?: boolean, footerNode?: React.ReactNode, lessonMetadata?: { duration?: number, difficulty?: string, instructor?: 'sarah' | 'gemma' }, lessonTitle?: string }) {
    // Determine if we have V2 Structured Blocks or V1 Markdown
    const hasV2Blocks = content?.blocks && Array.isArray(content.blocks) && content.blocks.length > 0;

    // For Hero Video - Extract data if available (AI Avatar)
    const heroVideoUrl = content.video_url || videoUrl;

    // Optional Markdown Fallback (Legacy Support)
    const renderLegacyMarkdown = () => {
        const rawContent = content?.topicContent || content?.content?.topicContent || "";
        const textContent = rawContent.replace(/^(#{1,6}\s+.+?)(?:\r?\n|\r)(?=[^#\n])/gm, '$1\n\n');
        const paragraphs = textContent.split('\n\n')
            .map((p: string) => p.trim())
            .filter((p: string) => p && !p.toLowerCase().startsWith('image prompt') && !p.match(/(\[!\[IMAGE:?\s*(.+)\]\]|!\[IMAGE:?\s*(.+)\]|\[IMAGE:?\s*(.+)\])/i));

        const parseRichText = (text: string) => {
            const parts = text.split(/(\*\*[^*]+\*\*)/g);
            return parts.map((part, idx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
                }
                return part;
            });
        };

        const renderElements = paragraphs.map((para: string, i: number) => {
            const headerMatch = para.match(/^(#{1,6})\s+(.+)/);
            if (headerMatch) {
                const level = headerMatch[1].length;
                const text = headerMatch[2].trim();
                return level <= 2 ? (
                    <h2 key={`h2-${i}`} className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-16 mb-8 border-b border-white/10 pb-4">{text}</h2>
                ) : (
                    <h3 key={`h3-${i}`} className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight mt-10 mb-4">{text}</h3>
                );
            }
            return <p key={`p-${i}`} className="text-lg md:text-xl text-slate-300 leading-relaxed mb-6 font-normal">{parseRichText(para)}</p>;
        });

        // Insert Legacy Image logic (simplified for fallback)
        if (images && images.length > 0) {
            renderElements.splice(1, 0, <figure key="fallback-img" className="my-10 overflow-hidden rounded-3xl border border-white/10"><img src={images[0].image_url} alt="Lesson illustration" className="w-full object-cover" /></figure>);
        }

        return <article className="prose prose-invert prose-lg max-w-none">{renderElements}</article>;
    };

    const [isComfortMode, setIsComfortMode] = useState(false);

    return (
        <div className={`w-full pb-12 font-body transition-colors duration-500 ease-in-out relative overflow-hidden ${isComfortMode ? 'bg-[#0f0f1a] comfort-mode' : 'bg-[#080810]'}`}>

            {/* ── Background treatment — driven by CourseDNA ── */}
            <CourseBackground />

            {/* Global contrast bumps for comfort mode */}
            {isComfortMode && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                    /* Comfort Mode: slightly lighter background, boosted text contrast */
                    .comfort-mode p, .comfort-mode li { color: #F0F0FF !important; }
                    .comfort-mode .text-\\[\\#8A8AB0\\] { color: #B0B0D0 !important; }
                    .comfort-mode .text-white\\/70 { color: rgba(255,255,255,0.9) !important; }
                `}} />
            )}

            {/* Global Accessibility Tweaks — scoped outside the lesson hero */}
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Base typography bumps to improve readability — NOT inside .lesson-hero-section */
                :not(.lesson-hero-section) > p, :not(.lesson-hero-section) > li { font-size: 1.125rem; line-height: 1.8; }
                .text-\\[\\#8A8AB0\\] { color: #94A3B8; }
                h1, h2, h3, h4 { letter-spacing: -0.02em; }
            `}} />

            {/* Floating Comfort Mode Toggle */}
            <button
                onClick={() => setIsComfortMode(!isComfortMode)}
                className="fixed bottom-[calc(72px+env(safe-area-inset-bottom)+1rem)] md:bottom-6 right-6 z-50 p-3.5 rounded-full bg-[#2A3250] border border-white/10 text-white shadow-xl hover:bg-[#353F63] transition-colors group flex items-center gap-3"
                title="Toggle Comfort Mode"
            >
                {isComfortMode ? <Eye className="w-5 h-5 text-[#00FFB3]" /> : <EyeOff className="w-5 h-5 text-[#8A8AB0]" />}
            </button>

            {/* V2 BLOCKS RENDERER OR V1 MARKDOWN FALLBACK — sits above mesh gradient */}
            {hasV2Blocks ? (
                <div className="relative" style={{ zIndex: 1 }}>
                <LessonBlockRenderer 
                    blocks={content.blocks} 
                    audioUrl={audioUrl} 
                    videoUrl={videoUrl} 
                    videoOverviewUrl={videoOverviewUrl} 
                    images={images} 
                    lessonMetadata={lessonMetadata}
                    lessonTitle={lessonTitle}
                />
                </div>
            ) : (
                <div className="max-w-3xl mx-auto px-6 py-16 relative" style={{ zIndex: 1 }}>
                    {renderLegacyMarkdown()}
                </div>
            )}

            {/* FOOTER NAV CONTAINER — matches content column width */}
            {footerNode && (
                <div className="max-w-[1140px] mx-auto px-[4vw] pb-16">
                    <div className="w-full bg-[#0f0f1a] p-8 rounded-2xl border border-white/5">
                        {footerNode}
                    </div>
                </div>
            )}
        </div>
    );
}

export default LessonContentRenderer;
