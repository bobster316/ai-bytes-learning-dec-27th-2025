"use client";

import { IndustryTabsBlock } from "@/lib/types/lesson-blocks";
import { useState } from "react";
import { ImageZoom } from "@/components/ui/image-zoom";
import { motion, AnimatePresence } from "framer-motion";

export function IndustryTabs({ heading, introText, tabs }: any) {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id);

    if (!tabs || tabs.length === 0) return null;

    return (
        <>
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
            <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <h2 className="font-display text-[1.6rem] font-bold text-white mb-2 pl-4 relative">
                    <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-[#9B8FFF]" />
                    {heading}
                </h2>
                <p className="font-body text-[15px] text-[#8A8AB0] mb-4">
                    {introText}
                </p>

                {/* Tab Navigation */}
                <div className="flex gap-1 mb-3 bg-[#141422] rounded-[10px] p-1 border border-white/5 overflow-x-auto no-scrollbar">
                    {(tabs || []).map((tab: any, idx: number) => {
                        const tabKey = tab.id || `tab-${idx}`;
                        const isActive = activeTab === tabKey;
                        return (
                            <button
                                key={tabKey}
                                onClick={() => setActiveTab(tabKey)}
                                className={`flex-1 min-w-0 px-4 py-2.5 border-none rounded-[6px] font-mono text-[11px] font-medium tracking-[0.04em] cursor-pointer transition-all whitespace-nowrap text-center ${
                                    isActive
                                        ? "bg-[#1E1E35] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] border-b-2 border-[#FFB347]"
                                        : "bg-transparent text-[#8A8AB0] hover:bg-white/5 hover:text-[#C8C8E0]"
                                }`}
                            >
                                {tab.icon} {tab.label || tab.title}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="rounded-2xl overflow-hidden bg-[#141422] border border-white/5 relative">
                    <AnimatePresence mode="wait">
                        {(tabs || []).map((tab: any, idx: number) => {
                            const tabKey = tab.id || `tab-${idx}`;
                            if (activeTab !== tabKey) return null;

                            const finalTitle = tab.scenarioTitle || tab.title || tab.label || "";
                            const finalBody = tab.scenarioBody || tab.body || tab.text || tab.content || "";
                            const hasImage = !!(tab.imageUrl || tab.image_url);

                            return (
                                <motion.div
                                    key={tabKey}
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full grid grid-cols-1 md:grid-cols-2"
                                >
                                    {hasImage && (
                                        <div className="bg-[#1E1E35] relative flex items-center justify-center min-h-[220px]">
                                            <ImageZoom
                                                src={tab.imageUrl || tab.image_url}
                                                alt={tab.label || tab.title}
                                                className="w-full h-full object-cover"
                                                caption={tab.imageCaption || tab.scenarioTitle || tab.title}
                                            />
                                            {tab.imageCaption && (
                                                <div className="absolute bottom-0 left-0 right-0 pt-5 pr-6 pb-3.5 pl-6 bg-gradient-to-t from-[#05050A]/90 to-transparent">
                                                    <div className="font-mono text-[11px] text-[#8A8AB0]">
                                                        {tab.imageCaption}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={`p-6 md:p-8 flex flex-col justify-center${!hasImage ? " md:col-span-2" : ""}`}>
                                        <div className="font-display text-[1.1rem] font-bold text-white mb-4 leading-snug" style={{ letterSpacing: "-0.01em" }}>
                                            {finalTitle}
                                        </div>
                                        <div
                                            className="font-body text-[1.05rem] text-[#C8C8E0] leading-[1.85] [&_mark]:bg-[#00FFB3]/15 [&_mark]:text-[#00FFB3] [&_mark]:px-1 [&_mark]:rounded"
                                            dangerouslySetInnerHTML={{ __html: finalBody }}
                                        />
                                        {tab.examples && Array.isArray(tab.examples) && tab.examples.length > 0 && (
                                            <div className="mt-5 flex flex-wrap gap-2">
                                                {tab.examples.map((ex: string, i: number) => (
                                                    <span key={i} className="font-mono text-[0.6rem] uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border border-white/10 text-[#8A8AB0]">
                                                        {ex}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    );
}
