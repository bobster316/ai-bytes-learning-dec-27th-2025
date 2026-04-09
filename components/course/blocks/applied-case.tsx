"use client";

import React, { useState } from 'react';
import { AppliedCaseBlock } from "@/lib/types/lesson-blocks";
import { Briefcase, Target, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCourseDNA } from "../course-dna-provider";

const ACCENT_COLOURS = ["#00FFB3", "#9B8FFF", "#FFB347", "#FF6B6B"];

function normaliseTabs(props: AppliedCaseBlock) {
    return props.tabs && props.tabs.length > 0
        ? props.tabs
        : [{ id: "tab_0", label: "Case Study", scenario: props.scenario, challenge: props.challenge, resolution: props.resolution, imageUrl: props.imageUrl }];
}

// ── Mode 0: Dark card with tabs (original refined) ─────────────────────────
function ACCard({ tabs, accent }: { tabs: any[]; accent: string }) {
    const [activeTab, setActiveTab] = useState(0);
    const tab = tabs[activeTab];
    const tabAccent = ACCENT_COLOURS[activeTab % ACCENT_COLOURS.length];

    return (
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <div className="bg-[#0d0d1c] rounded-2xl border border-white/10 overflow-hidden shadow-xl relative">
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, ${accent}60, ${accent}20, transparent)` }} />
                <div className="bg-[#1C2242] px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${accent}20` }}>
                        <Briefcase className="w-4 h-4" style={{ color: accent }} />
                    </div>
                    <div className="font-display text-[14px] font-bold text-white tracking-wide">Applied Case Study</div>
                </div>
                {tabs.length > 1 && (
                    <div className="flex border-b border-white/5 px-6 gap-1 pt-3">
                        {tabs.map((t, i) => (
                            <button key={t.id || i} onClick={() => setActiveTab(i)}
                                className="relative px-4 py-2.5 text-[12px] font-mono font-bold tracking-[0.12em] uppercase transition-colors duration-200 rounded-t-lg"
                                style={{
                                    color: activeTab === i ? ACCENT_COLOURS[i % ACCENT_COLOURS.length] : "rgba(255,255,255,0.3)",
                                    borderBottom: activeTab === i ? `2px solid ${ACCENT_COLOURS[i % ACCENT_COLOURS.length]}` : "2px solid transparent",
                                }}>
                                {t.label || `Case ${i + 1}`}
                            </button>
                        ))}
                    </div>
                )}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="p-6 md:p-8">
                        {tab.imageUrl && (
                            <div className="mb-6 w-full aspect-video rounded-xl overflow-hidden">
                                <img src={tab.imageUrl} alt={tab.label || "Case illustration"} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] text-[#8A8AB0] uppercase mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />The Scenario
                                </h4>
                                <p className="text-[#C8C8E0] font-body text-[16px] leading-relaxed">{tab.scenario}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="rounded-xl border p-5" style={{ background: "#FFB34708", borderColor: "#FFB34718" }}>
                                    <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] text-amber-500 uppercase mb-3 flex items-center gap-2">
                                        <Target className="w-3.5 h-3.5" />The Challenge
                                    </h4>
                                    <p className="text-amber-100/80 font-body text-[15px] leading-relaxed">{tab.challenge}</p>
                                </div>
                                <div className="rounded-xl border p-5" style={{ background: `${tabAccent}08`, borderColor: `${tabAccent}18` }}>
                                    <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] uppercase mb-3 flex items-center gap-2" style={{ color: tabAccent }}>
                                        <CheckCircle2 className="w-3.5 h-3.5" />The Resolution
                                    </h4>
                                    <p className="font-body text-[15px] leading-relaxed" style={{ color: `${tabAccent}CC` }}>{tab.resolution}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ── Mode 1: Timeline narrative — vertical flow with connecting spine ─────────
function ACTimeline({ tabs, accent }: { tabs: any[]; accent: string }) {
    const [activeTab, setActiveTab] = useState(0);
    const tab = tabs[activeTab];
    const steps = [
        { label: "The Scenario", content: tab.scenario, colour: "#9B8FFF", dot: "01" },
        { label: "The Challenge", content: tab.challenge, colour: "#FFB347", dot: "02" },
        { label: "The Resolution", content: tab.resolution, colour: accent, dot: "03" },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                    <Briefcase className="w-4 h-4" style={{ color: accent }} />
                </div>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: accent }}>Applied Case Study</span>
                {tabs.length > 1 && (
                    <div className="flex gap-1 ml-4">
                        {tabs.map((t, i) => (
                            <button key={i} onClick={() => setActiveTab(i)}
                                className="px-3 py-1 rounded-full font-mono text-[0.58rem] uppercase tracking-[0.12em] transition-all duration-200"
                                style={{
                                    background: activeTab === i ? `${ACCENT_COLOURS[i % 4]}20` : "transparent",
                                    color: activeTab === i ? ACCENT_COLOURS[i % 4] : "rgba(255,255,255,0.3)",
                                    border: `1px solid ${activeTab === i ? ACCENT_COLOURS[i % 4] + "40" : "rgba(255,255,255,0.08)"}`,
                                }}>
                                {t.label || `Case ${i + 1}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {tab.imageUrl && (
                <div className="mb-8 w-full aspect-video rounded-2xl overflow-hidden">
                    <img src={tab.imageUrl} alt={tab.label || "Case"} className="w-full h-full object-cover" />
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }} className="relative">
                    {/* Spine */}
                    <div className="absolute left-5 top-5 bottom-5 w-px"
                        style={{ background: `linear-gradient(180deg, #9B8FFF40, #FFB34730, ${accent}30)` }} />
                    <div className="space-y-0">
                        {steps.map((step, i) => step.content && (
                            <motion.div key={i} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}
                                className="relative flex gap-6 pb-8 last:pb-0">
                                {/* Node */}
                                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ background: `${step.colour}12`, border: `1px solid ${step.colour}40`, boxShadow: `0 0 14px ${step.colour}18` }}>
                                    <span className="font-mono font-bold text-[10px]" style={{ color: step.colour }}>{step.dot}</span>
                                </div>
                                {/* Content */}
                                <div className="flex-1 pt-1.5 pb-1">
                                    <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] mb-2" style={{ color: `${step.colour}80` }}>
                                        {step.label}
                                    </div>
                                    <p className="font-body text-[15px] text-[#C8C8E0] leading-relaxed">{step.content}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

// ── Mode 2: Dossier/classified brief style ───────────────────────────────────
function ACDossier({ tabs, accent }: { tabs: any[]; accent: string }) {
    const [activeTab, setActiveTab] = useState(0);
    const tab = tabs[activeTab];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#040608", border: `1px solid ${accent}22` }}>
            {/* Dossier header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: `${accent}15`, background: `${accent}06` }}>
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                        <Briefcase className="w-3.5 h-3.5" style={{ color: accent }} />
                    </div>
                    <div>
                        <div className="font-mono text-[0.58rem] uppercase tracking-[0.22em]" style={{ color: `${accent}60` }}>Field Dossier</div>
                        <div className="font-mono text-[0.72rem] font-bold text-white/80">Applied Case Study</div>
                    </div>
                </div>
                <div className="flex-1" />
                {tabs.length > 1 && tabs.map((t, i) => (
                    <button key={i} onClick={() => setActiveTab(i)}
                        className="px-3 py-1 rounded font-mono text-[0.58rem] uppercase tracking-widest transition-all"
                        style={{
                            background: activeTab === i ? `${ACCENT_COLOURS[i % 4]}20` : "transparent",
                            color: activeTab === i ? ACCENT_COLOURS[i % 4] : "rgba(255,255,255,0.25)",
                            border: `1px solid ${activeTab === i ? ACCENT_COLOURS[i % 4] + "35" : "rgba(255,255,255,0.06)"}`,
                        }}>
                        {t.label || `Case ${i + 1}`}
                    </button>
                ))}
                <motion.span className="font-mono text-[0.55rem]" style={{ color: `${accent}50` }}
                    animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>●</motion.span>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }} className="p-6 md:p-8 space-y-6">
                    {tab.imageUrl && (
                        <div className="w-full aspect-video rounded-xl overflow-hidden"
                            style={{ border: `1px solid ${accent}20` }}>
                            <img src={tab.imageUrl} alt={tab.label || "Case"} className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Scenario */}
                    {tab.scenario && (
                        <div>
                            <div className="font-mono text-[0.58rem] uppercase tracking-[0.22em] mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                                // situation
                            </div>
                            <p className="font-body text-[15px] text-[#C8C8E0] leading-relaxed">{tab.scenario}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Challenge */}
                        {tab.challenge && (
                            <div className="rounded-xl p-5" style={{ background: "#FFB34708", border: "1px solid #FFB34720" }}>
                                <div className="font-mono text-[0.58rem] uppercase tracking-[0.2em] flex items-center gap-2 mb-3" style={{ color: "#FFB34780" }}>
                                    <Target className="w-3 h-3" />// challenge
                                </div>
                                <p className="font-mono text-[0.78rem] text-amber-100/70 leading-[1.7]">{tab.challenge}</p>
                            </div>
                        )}
                        {/* Resolution */}
                        {tab.resolution && (
                            <div className="rounded-xl p-5" style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}>
                                <div className="font-mono text-[0.58rem] uppercase tracking-[0.2em] flex items-center gap-2 mb-3" style={{ color: `${accent}70` }}>
                                    <CheckCircle2 className="w-3 h-3" />// resolution
                                </div>
                                <p className="font-mono text-[0.78rem] leading-[1.7]" style={{ color: `${accent}CC` }}>{tab.resolution}</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

export function AppliedCase(props: AppliedCaseBlock & { lessonIndex?: number }) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || "#00FFB3";
    const tabs = normaliseTabs(props);
    const mode = (props.lessonIndex ?? 0) % 3;

    if (mode === 1) return <ACTimeline tabs={tabs} accent={accent} />;
    if (mode === 2) return <ACDossier tabs={tabs} accent={accent} />;
    return <ACCard tabs={tabs} accent={accent} />;
}
