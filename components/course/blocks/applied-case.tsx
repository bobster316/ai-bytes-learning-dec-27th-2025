"use client";

import React, { useState } from 'react';
import { AppliedCaseBlock } from "@/lib/types/lesson-blocks";
import { Briefcase, Target, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ACCENT_COLOURS = ["#00FFB3", "#4b98ad", "#FFB347"];

export function AppliedCase(props: AppliedCaseBlock) {
    const [activeTab, setActiveTab] = useState(0);

    // Normalise: if tabs array present use it, otherwise wrap legacy fields in single-tab array
    const tabs = props.tabs && props.tabs.length > 0
        ? props.tabs
        : [{ id: "tab_0", label: "Case Study", scenario: props.scenario, challenge: props.challenge, resolution: props.resolution, imageUrl: props.imageUrl }];

    const tab = tabs[activeTab];
    const accent = ACCENT_COLOURS[activeTab % ACCENT_COLOURS.length];

    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="bg-[#0d0d1c] rounded-2xl border border-white/10 overflow-hidden shadow-xl relative">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00FFB3]/60 via-[#4b98ad]/30 to-transparent" />

                {/* Header */}
                <div className="bg-[#1C2242] px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00FFB3]/20 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-[#00FFB3]" />
                    </div>
                    <div className="font-display text-[14px] font-bold text-white tracking-wide">Applied Case Study</div>
                </div>

                {/* Tab buttons — only shown when more than 1 tab */}
                {tabs.length > 1 && (
                    <div className="flex border-b border-white/5 px-6 gap-1 pt-3">
                        {tabs.map((t, i) => (
                            <button
                                key={t.id || i}
                                onClick={() => setActiveTab(i)}
                                className="relative px-4 py-2.5 text-[12px] font-mono font-bold tracking-[0.12em] uppercase transition-colors duration-200 rounded-t-lg"
                                style={{
                                    color: activeTab === i ? ACCENT_COLOURS[i % ACCENT_COLOURS.length] : "rgba(255,255,255,0.3)",
                                    borderBottom: activeTab === i ? `2px solid ${ACCENT_COLOURS[i % ACCENT_COLOURS.length]}` : "2px solid transparent",
                                }}
                            >
                                {t.label || `Case ${i + 1}`}
                            </button>
                        ))}
                    </div>
                )}

                {/* Tab panel */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="p-6 md:p-8"
                    >
                        {/* Optional image */}
                        {tab.imageUrl && (
                            <div className="mb-6 w-full aspect-video rounded-xl overflow-hidden">
                                <img
                                    src={tab.imageUrl}
                                    alt={tab.label || "Case illustration"}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Scenario */}
                            <div>
                                <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] text-[#8A8AB0] uppercase mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                    The Scenario
                                </h4>
                                <p className="text-[#C8C8E0] font-body text-[16px] leading-relaxed">{tab.scenario}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Challenge */}
                                <div className="bg-amber-500/5 rounded-xl border border-amber-500/10 p-5">
                                    <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] text-amber-500 uppercase mb-3 flex items-center gap-2">
                                        <Target className="w-3.5 h-3.5" />
                                        The Challenge
                                    </h4>
                                    <p className="text-amber-100/80 font-body text-[15px] leading-relaxed">{tab.challenge}</p>
                                </div>

                                {/* Resolution */}
                                <div className="bg-[#00FFB3]/5 rounded-xl border border-[#00FFB3]/10 p-5">
                                    <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] text-[#00FFB3] uppercase mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        The Resolution
                                    </h4>
                                    <p className="text-[#00FFB3]/80 font-body text-[15px] leading-relaxed">{tab.resolution}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
