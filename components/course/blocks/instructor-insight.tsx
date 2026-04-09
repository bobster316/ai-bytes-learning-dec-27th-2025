"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";
import { useCourseDNA } from "../course-dna-provider";

interface InsightCard {
    emoji: string;
    title: string;
    body: string;
}

interface InstructorInsightProps {
    videoUrl?: string;
    insights?: InsightCard[];
    heading?: string;
    lessonIndex?: number;
}

const CARD_ACCENTS = ["#00FFB3", "#9B8FFF", "#FFB347", "#FF6B6B"];

// Shared video player
function VideoPanel({ videoUrl, accent }: { videoUrl: string; accent: string }) {
    const [playing, setPlaying] = useState(false);
    return (
        <div className="relative rounded-xl overflow-hidden"
            style={{ aspectRatio: "16 / 9", border: `1.5px solid ${accent}30`, boxShadow: `0 0 40px ${accent}12`, background: "#0a0a14" }}>
            <video src={videoUrl} autoPlay={playing} muted loop playsInline
                className="w-full h-full object-cover" onPlay={() => setPlaying(true)} />
            {!playing && (
                <button onClick={() => setPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center group" aria-label="Play video">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                        style={{ background: accent }}>
                        <Play className="w-6 h-6 ml-1" style={{ color: "#080810" }} fill="#080810" />
                    </div>
                </button>
            )}
            <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none"
                style={{ background: `radial-gradient(circle at 0% 0%, ${accent}12, transparent 70%)` }} />
        </div>
    );
}

// ── Mode 0: Bordered card with top accent bar (original refined) ──────────────
function IICard({ videoUrl, insights, heading, accent }: InstructorInsightProps & { accent: string }) {
    return (
        <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ height: 2, background: `linear-gradient(90deg, ${accent}, ${accent}40, transparent 75%)` }} />
            <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: accent }}>
                        {heading || "Instructor Insight"}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <div className={`grid gap-6 ${videoUrl ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {videoUrl && <VideoPanel videoUrl={videoUrl} accent={accent} />}
                    <div className={`${videoUrl ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-4'}`}>
                        {(insights ?? []).slice(0, 3).map((card, i) => {
                            const c = CARD_ACCENTS[i % CARD_ACCENTS.length];
                            return (
                                <motion.div key={i} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex items-start gap-4 rounded-xl p-4"
                                    style={{ background: `${c}06`, border: `1px solid ${c}20` }}>
                                    <div className="text-xl shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ background: `${c}12`, border: `1px solid ${c}25` }}>{card.emoji}</div>
                                    <div>
                                        <div className="font-display font-bold text-white text-[15px] leading-snug mb-1">{card.title}</div>
                                        <p className="font-body text-[14px] text-[#8A8AB0] leading-[1.65]">{card.body}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

// ── Mode 1: Terminal/HUD style with numbered dispatches ───────────────────────
function IITerminal({ videoUrl, insights, heading, accent }: InstructorInsightProps & { accent: string }) {
    return (
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#040608", border: `1px solid ${accent}22` }}>
            {/* Terminal title bar */}
            <div className="flex items-center gap-3 px-5 py-3 border-b"
                style={{ borderColor: `${accent}15`, background: `${accent}06` }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF6B6B" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFB347" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] ml-2" style={{ color: `${accent}60` }}>
                    {(heading || "instructor_insight").toLowerCase().replace(/\s+/g, "_")}.log
                </span>
                <div className="flex-1" />
                <motion.span className="font-mono text-[0.55rem]" style={{ color: `${accent}50` }}
                    animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>●</motion.span>
                <span className="font-mono text-[0.55rem]" style={{ color: `${accent}40` }}>LIVE</span>
            </div>

            <div className="p-6 md:p-8">
                <div className="font-mono text-[0.75rem] mb-6" style={{ color: `${accent}70` }}>
                    <span style={{ color: `${accent}50` }}>$ </span>
                    <span style={{ color: accent }}>query</span>
                    <span style={{ color: "rgba(255,255,255,0.3)" }}> --source instructor --limit 3</span>
                </div>

                <div className={`grid gap-5 ${videoUrl ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {videoUrl && <VideoPanel videoUrl={videoUrl} accent={accent} />}
                    <div className="space-y-3">
                        {(insights ?? []).slice(0, 3).map((card, i) => {
                            const c = CARD_ACCENTS[i % CARD_ACCENTS.length];
                            return (
                                <motion.div key={i} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.12, duration: 0.45 }}
                                    className="rounded-xl p-4"
                                    style={{ background: `${c}06`, border: `1px solid ${c}18` }}>
                                    <div className="flex items-start gap-3">
                                        <span className="font-mono text-[0.68rem] shrink-0 mt-0.5" style={{ color: c }}>
                                            [{String(i + 1).padStart(2, "0")}]
                                        </span>
                                        <div>
                                            <div className="font-mono text-[0.75rem] font-bold mb-1.5" style={{ color: c }}>
                                                {card.emoji} {card.title}
                                            </div>
                                            <p className="font-mono text-[0.72rem] leading-[1.7]" style={{ color: "rgba(200,215,230,0.65)" }}>
                                                {card.body}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

// ── Mode 2: Signal intercept — horizontal strip cards with animated dot ───────
function IISignal({ videoUrl, insights, heading, accent }: InstructorInsightProps & { accent: string }) {
    return (
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.8 }}
            className="relative py-10">
            {/* Top divider with label */}
            <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <motion.div className="w-2 h-2 rounded-full" style={{ background: accent }}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em]" style={{ color: `${accent}80` }}>
                        {heading || "Instructor Insight"}
                    </span>
                </div>
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${accent}20, transparent)` }} />
            </div>

            <div className={`grid gap-5 ${videoUrl ? 'grid-cols-1 lg:grid-cols-2 mb-6' : 'grid-cols-1 md:grid-cols-3'}`}>
                {videoUrl && (
                    <div className="lg:col-span-1">
                        <VideoPanel videoUrl={videoUrl} accent={accent} />
                    </div>
                )}
                {(insights ?? []).slice(0, videoUrl ? 3 : 3).map((card, i) => {
                    const c = CARD_ACCENTS[i % CARD_ACCENTS.length];
                    return (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="relative rounded-2xl p-5 overflow-hidden group"
                            style={{ background: `linear-gradient(135deg, ${c}08, rgba(255,255,255,0.015))`, border: `1px solid ${c}22` }}>
                            {/* Corner glow */}
                            <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `radial-gradient(circle at 100% 0%, ${c}15, transparent 65%)` }} />
                            {/* Top line */}
                            <div className="absolute top-0 left-0 right-0 h-px"
                                style={{ background: `linear-gradient(90deg, ${c}50, transparent)` }} />
                            <div className="relative">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <span className="text-lg">{card.emoji}</span>
                                    <div className="w-px h-4 opacity-30" style={{ background: c }} />
                                    <span className="font-mono text-[0.58rem] uppercase tracking-[0.15em]" style={{ color: `${c}70` }}>
                                        insight.{String(i + 1).padStart(2, "0")}
                                    </span>
                                </div>
                                <h4 className="font-display font-bold text-white text-[0.92rem] leading-snug mb-2">{card.title}</h4>
                                <p className="font-body text-[0.84rem] leading-relaxed" style={{ color: "rgba(180,180,210,0.75)" }}>{card.body}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Bottom divider */}
            <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}15, transparent)` }} />
        </motion.section>
    );
}

export function InstructorInsight({ videoUrl, insights = [], heading, lessonIndex }: InstructorInsightProps) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || "#00FFB3";
    const mode = (lessonIndex ?? 0) % 3;

    if (!insights || insights.length === 0) return null;

    const shared = { videoUrl, insights, heading, accent };
    if (mode === 1) return <IITerminal {...shared} />;
    if (mode === 2) return <IISignal {...shared} />;
    return <IICard {...shared} />;
}
