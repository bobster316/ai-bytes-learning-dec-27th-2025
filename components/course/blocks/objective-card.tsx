"use client";

import { motion } from "framer-motion";
import { useCourseDNA } from "../course-dna-provider";

function processText(raw: any) {
    if (typeof raw !== 'string') return "";
    return raw
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// Mode 0 — Gradient border card (refined from original)
function ObjGradient({ label, finalText, accent }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl overflow-hidden"
            style={{ padding: "1px", background: `linear-gradient(135deg, ${accent}60, ${accent}15, transparent)` }}
        >
            <div className="relative rounded-2xl p-7 md:p-8" style={{ background: "#0c0c1a" }}>
                <motion.div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }}
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} />
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle at 100% 0%, ${accent}08, transparent 70%)` }} />

                <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${accent}12`, border: `1px solid ${accent}30` }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5">
                            <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><line x1="12" y1="3" x2="12" y2="1" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="3" y1="12" x2="1" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                        </svg>
                    </div>
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>{label}</span>
                </div>
                <div className="font-body text-[18px] text-[#c8c8e0] leading-relaxed [&_strong]:text-[#f0f0ff] [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: finalText }} />
            </div>
        </motion.div>
    );
}

// Mode 1 — Left accent bar + horizontal split
function ObjAccentBar({ label, finalText, accent }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl overflow-hidden flex"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
            {/* Left accent strip */}
            <div className="flex-shrink-0 flex flex-col items-center justify-between py-6 px-3 gap-3"
                style={{ width: 52, background: `${accent}10`, borderRight: `1px solid ${accent}20` }}>
                <div style={{ width: 2, flex: 1, background: `linear-gradient(180deg, transparent, ${accent}60, ${accent}60, transparent)` }} />
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${accent}18`, border: `1px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <div style={{ width: 2, flex: 1, background: `linear-gradient(180deg, ${accent}60, ${accent}60, transparent)` }} />
            </div>

            <div className="p-7 md:p-8 flex-1">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: accent }}>
                    {label}
                </div>
                <div className="font-body text-[18px] text-[#c8c8e0] leading-relaxed [&_strong]:text-[#f0f0ff] [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: finalText }} />
                <motion.div className="mt-5 h-px" style={{ background: `linear-gradient(90deg, ${accent}40, transparent)` }}
                    initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} />
            </div>
        </motion.div>
    );
}

// Mode 2 — Floating number + clean minimal
function ObjMinimal({ label, finalText, accent }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
        >
            {/* Top rule */}
            <div style={{ height: 1, background: `linear-gradient(90deg, ${accent}60, transparent)`, marginBottom: "1.75rem" }} />

            <div className="flex gap-6 items-start">
                {/* Large circle number */}
                <div className="flex-shrink-0 relative" style={{ width: 52, height: 52 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: "50%",
                        border: `1px solid ${accent}30`,
                        background: `radial-gradient(circle at 30% 30%, ${accent}14, transparent 70%)`,
                        boxShadow: `0 0 20px ${accent}10`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" style={{ opacity: 0.8 }}>
                            <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" />
                            <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
                        </svg>
                    </div>
                    <motion.div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `1px solid ${accent}18` }}
                        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
                </div>

                <div className="flex-1 pt-1">
                    <div className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: `${accent}80` }}>
                        {label}
                    </div>
                    <div className="font-body text-[18px] text-[#c8c8e0] leading-relaxed [&_strong]:text-[#f0f0ff] [&_strong]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: finalText }} />
                </div>
            </div>

            {/* Bottom rule */}
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accent}20)`, marginTop: "1.75rem" }} />
        </motion.div>
    );
}

export function ObjectiveCard({ label, title, text, body, paragraphs, lessonIndex }: any) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || "#00FFB3";
    const finalLabel = label || title || "Learning Objective";
    const rawText = text || body || (Array.isArray(paragraphs) ? paragraphs.join(" ") : paragraphs) || "";
    const finalText = processText(rawText);
    const mode = (lessonIndex ?? 0) % 3;

    if (mode === 1) return <ObjAccentBar label={finalLabel} finalText={finalText} accent={accent} />;
    if (mode === 2) return <ObjMinimal label={finalLabel} finalText={finalText} accent={accent} />;
    return <ObjGradient label={finalLabel} finalText={finalText} accent={accent} />;
}
