"use client";

import { motion } from "framer-motion";
import { PunchQuoteBlock } from "@/lib/types/lesson-blocks";
import { useCourseDNA } from "../course-dna-provider";

const ACCENT_HEX: Record<string, string> = {
    pulse: "#00FFB3", iris: "#9B8FFF", amber: "#FFB347", nova: "#FF6B6B",
};

// Mode 0 — Centered with gradient rules
function PQCentered({ quote, attribution, colour }: { quote: string; attribution?: string; colour: string }) {
    const rule = `linear-gradient(90deg, transparent, ${colour}, transparent)`;
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="py-14 text-center">
            <div className="w-full h-px mb-10" style={{ background: rule }} />
            <blockquote className="font-display font-black mx-auto px-8 leading-[1.2] tracking-tight"
                style={{ fontSize: "clamp(1.55rem, 3vw, 2.3rem)", color: colour, maxWidth: "800px", letterSpacing: "-0.022em" }}>
                {quote}
            </blockquote>
            {attribution && (
                <div className="mt-6 font-mono text-[0.62rem] uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                    style={{ color: colour, opacity: 0.65 }}>
                    <span className="block w-6 h-px" style={{ background: colour }} />{attribution}
                    <span className="block w-6 h-px" style={{ background: colour }} />
                </div>
            )}
            <div className="w-full h-px mt-10" style={{ background: rule }} />
        </motion.div>
    );
}

// Mode 1 — Left-aligned with vertical accent bar + oversized quote glyph
function PQLeftBar({ quote, attribution, colour }: { quote: string; attribution?: string; colour: string }) {
    return (
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="py-10 flex gap-8 items-start max-w-3xl">
            <div className="flex flex-col items-center gap-0 flex-shrink-0 pt-1">
                <div style={{ width: 3, height: 48, background: `linear-gradient(180deg, ${colour}, ${colour}30)`, borderRadius: 2 }} />
                <span className="font-display font-black select-none" aria-hidden="true"
                    style={{ fontSize: "4.5rem", lineHeight: 0.8, color: `${colour}18`, letterSpacing: "-0.05em" }}>"</span>
            </div>
            <div className="flex-1">
                <motion.blockquote initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.6 }}
                    className="font-display font-black leading-[1.25] tracking-tight mb-5"
                    style={{ fontSize: "clamp(1.35rem, 2.6vw, 1.95rem)", color: "rgba(240,240,252,0.92)", letterSpacing: "-0.022em" }}>
                    {quote}
                </motion.blockquote>
                {attribution && (
                    <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] flex items-center gap-3"
                        style={{ color: colour, opacity: 0.7 }}>
                        <span style={{ display: "block", width: 20, height: 1, background: colour }} />{attribution}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// Mode 2 — Cinematic banner with animated scan line
function PQBanner({ quote, attribution, colour }: { quote: string; attribution?: string; colour: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl overflow-hidden py-12 px-10 md:px-16 my-4"
            style={{ background: `linear-gradient(135deg, ${colour}07 0%, rgba(255,255,255,0.015) 50%, ${colour}04 100%)`, border: `1px solid ${colour}20` }}>
            <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${colour}55, transparent)` }}
                animate={{ top: ["-2%", "105%"] }}
                transition={{ duration: 5, delay: 0.8, repeat: Infinity, repeatDelay: 9, ease: "linear" }} />
            <div className="absolute top-0 left-0 w-40 h-40 pointer-events-none"
                style={{ background: `radial-gradient(circle at 0% 0%, ${colour}10, transparent 65%)` }} />
            <div className="absolute bottom-0 right-0 w-40 h-40 pointer-events-none"
                style={{ background: `radial-gradient(circle at 100% 100%, ${colour}08, transparent 65%)` }} />
            <div className="relative">
                <div className="font-mono text-[0.58rem] uppercase tracking-[0.22em] mb-5" style={{ color: `${colour}60` }}>
                    // Key insight
                </div>
                <blockquote className="font-display font-black leading-[1.22] tracking-tight"
                    style={{ fontSize: "clamp(1.35rem, 2.6vw, 2rem)", color: "rgba(240,240,252,0.95)", maxWidth: "720px", letterSpacing: "-0.022em" }}>
                    {quote}
                </blockquote>
                {attribution && (
                    <div className="mt-6 font-mono text-[0.62rem] uppercase tracking-[0.18em] flex items-center gap-3"
                        style={{ color: colour, opacity: 0.7 }}>
                        <span style={{ display: "block", width: 20, height: 1, background: colour }} />{attribution}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export function PunchQuote({ quote, attribution, accent = "iris", lessonIndex }: PunchQuoteBlock & { lessonIndex?: number }) {
    const { primary_colour } = useCourseDNA();
    const colour = primary_colour || ACCENT_HEX[accent] || "#9B8FFF";
    const mode = (lessonIndex ?? 0) % 3;
    if (mode === 1) return <PQLeftBar quote={quote} attribution={attribution} colour={colour} />;
    if (mode === 2) return <PQBanner quote={quote} attribution={attribution} colour={colour} />;
    return <PQCentered quote={quote} attribution={attribution} colour={colour} />;
}
