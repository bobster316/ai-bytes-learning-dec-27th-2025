"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";

interface InsightCard {
    emoji: string;
    title: string;
    body: string;
}

interface InstructorInsightProps {
    videoUrl?: string;
    insights?: InsightCard[];
    heading?: string;
}

const CARD_ACCENTS = ["#4b98ad", "#00FFB3", "#FFB347"];

export function InstructorInsight({ videoUrl, insights = [], heading }: InstructorInsightProps) {
    const [playing, setPlaying] = useState(false);

    if (!insights || insights.length === 0) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.06)" }}
        >
            {/* Top accent bar */}
            <div style={{ height: 2, background: "linear-gradient(90deg, #4b98ad, #00FFB3, transparent 75%)" }} />

            <div className="p-6 md:p-8">
                {/* Section label */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#4b98ad]">
                        {heading || "Instructor Insight"}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                <div className={`grid gap-6 ${videoUrl ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* ── Left: contextual video — only renders when URL is available ── */}
                    {videoUrl && (
                        <div
                            className="relative rounded-xl overflow-hidden"
                            style={{
                                aspectRatio: "16 / 9",
                                border: "1.5px solid rgba(155,143,255,0.3)",
                                boxShadow: "0 0 40px rgba(155,143,255,0.12)",
                                background: "#0a0a14",
                            }}
                        >
                            <video
                                src={videoUrl}
                                autoPlay={playing}
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                                onPlay={() => setPlaying(true)}
                            />
                            {!playing && (
                                <button
                                    onClick={() => setPlaying(true)}
                                    className="absolute inset-0 flex items-center justify-center group"
                                    aria-label="Play video"
                                >
                                    <div className="w-14 h-14 rounded-full bg-[#4b98ad] flex items-center justify-center shadow-[0_0_40px_rgba(155,143,255,0.5)] group-hover:scale-110 transition-transform">
                                        <Play className="w-6 h-6 text-white ml-1" fill="white" />
                                    </div>
                                </button>
                            )}
                            {/* Corner iris glow */}
                            <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none"
                                style={{ background: "radial-gradient(circle at 0% 0%, rgba(155,143,255,0.12), transparent 70%)" }} />
                        </div>
                    )}

                    {/* ── Insight cards — 3-col grid when no video, single col otherwise ── */}
                    <div className={`${videoUrl ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-4'}`}>
                        {insights.slice(0, 3).map((card, i) => {
                            const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 16 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex items-start gap-4 rounded-xl p-4"
                                    style={{
                                        background: `${accent}06`,
                                        border: `1px solid ${accent}20`,
                                    }}
                                >
                                    {/* Emoji badge */}
                                    <div
                                        className="text-xl shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}
                                    >
                                        {card.emoji}
                                    </div>
                                    <div>
                                        <div className="font-display font-bold text-white text-[15px] leading-snug mb-1">
                                            {card.title}
                                        </div>
                                        <p className="font-body text-[14px] text-[#8A8AB0] leading-[1.65]">
                                            {card.body}
                                        </p>
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
