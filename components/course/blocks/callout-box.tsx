"use client";

import { motion } from "framer-motion";
import { Lightbulb, AlertTriangle, Brain } from "lucide-react";
import { useCourseDNA } from "../course-dna-provider";

const VARIANT_COLOURS: Record<string, string> = {
    tip:     "var(--course-primary, #00FFB3)",
    info:    "#00FFB3",
    warning: "#FFB347",
};

function resolveAccent(variant: string, primary: string) {
    if (variant === "tip") return primary;
    if (variant === "info") return "#00FFB3";
    return "#FFB347"; // warning
}

function DefaultIcon({ variant, accent }: { variant: string; accent: string }) {
    if (variant === "tip")     return <Lightbulb className="w-5 h-5" style={{ color: accent }} />;
    if (variant === "info")    return <Brain className="w-5 h-5" style={{ color: accent }} />;
    return <AlertTriangle className="w-5 h-5" style={{ color: accent }} />;
}

// Mode 0 — Left border strip (refined original)
function CBBorder({ variant, icon, title, text, body, accent }: any) {
    return (
        <motion.div initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-4 p-6 mb-4 rounded-xl border border-white/[0.05]"
            style={{
                background: `color-mix(in srgb, ${accent} 5%, transparent)`,
                borderLeftColor: accent, borderLeftWidth: "3px", borderLeftStyle: "solid",
            }}>
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)` }}>
                {icon && icon.length <= 2
                    ? <span className="text-lg">{icon}</span>
                    : <DefaultIcon variant={variant} accent={accent} />}
            </div>
            <div>
                {title && <div className="font-display text-[15px] font-bold text-white mb-1.5">{title}</div>}
                <div className="font-body text-[15px] text-[#C8C8E0] leading-relaxed [&_strong]:text-white [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: text || body || "" }} />
            </div>
        </motion.div>
    );
}

// Mode 1 — Floating broadcast card with top-icon and gradient edge
function CBBroadcast({ variant, icon, title, text, body, accent }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl overflow-hidden mb-4 p-6"
            style={{ background: `color-mix(in srgb, ${accent} 6%, #0e0e1a)`, border: `1px solid ${accent}22` }}>
            {/* Top shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }} />
            {/* Corner glow */}
            <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                style={{ background: `radial-gradient(circle at 100% 0%, ${accent}10, transparent 65%)` }} />

            <div className="relative flex items-start gap-4">
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                        {icon && icon.length <= 2
                            ? <span className="text-lg">{icon}</span>
                            : <DefaultIcon variant={variant} accent={accent} />}
                    </div>
                    <span className="font-mono text-[0.5rem] uppercase tracking-[0.2em]"
                        style={{ color: `${accent}60` }}>{variant}</span>
                </div>
                <div className="flex-1 pt-1">
                    {title && (
                        <div className="font-display text-[15px] font-bold mb-1.5" style={{ color: accent }}>{title}</div>
                    )}
                    <div className="font-body text-[15px] text-[#C8C8E0] leading-relaxed [&_strong]:text-white [&_strong]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: text || body || "" }} />
                </div>
            </div>
        </motion.div>
    );
}

// Mode 2 — Minimal frame: ruled header row, open content below
function CBFrame({ variant, icon, title, text, body, accent }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-4">
            {/* Header row */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
                    {icon && icon.length <= 2
                        ? <span className="text-sm">{icon}</span>
                        : <DefaultIcon variant={variant} accent={accent} />}
                </div>
                {title && (
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] font-bold"
                        style={{ color: accent }}>{title}</span>
                )}
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${accent}30, transparent)` }} />
            </div>
            {/* Content */}
            <div className="pl-10">
                <div className="font-body text-[15px] text-[#C8C8E0] leading-relaxed [&_strong]:text-white [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: text || body || "" }} />
            </div>
            {/* Bottom rule */}
            <div className="mt-4 h-px" style={{ background: `linear-gradient(90deg, ${accent}15, transparent)` }} />
        </motion.div>
    );
}

export function CalloutBox({ variant = "tip", icon, title, text, body, lessonIndex }: any) {
    const { primary_colour } = useCourseDNA();
    const accent = resolveAccent(variant, primary_colour || "#00FFB3");
    const mode = (lessonIndex ?? 0) % 3;

    const shared = { variant, icon, title, text, body, accent };
    if (mode === 1) return <CBBroadcast {...shared} />;
    if (mode === 2) return <CBFrame {...shared} />;
    return <CBBorder {...shared} />;
}
