"use client";

import { motion } from "framer-motion";
import { FlowDiagramBlock } from "@/lib/types/lesson-blocks";
import { cn } from "@/lib/utils";

const COLOUR_MAP = {
    pulse:   { bg: "bg-[#00FFB3]/10", border: "border-[#00FFB3]/40", text: "text-[#00FFB3]", dot: "#00FFB3" },
    iris:    { bg: "bg-[#9B8FFF]/10", border: "border-[#9B8FFF]/40", text: "text-[#9B8FFF]", dot: "#9B8FFF" },
    amber:   { bg: "bg-[#FFB347]/10", border: "border-[#FFB347]/40", text: "text-[#FFB347]", dot: "#FFB347" },
    nova:    { bg: "bg-[#FF6B6B]/10", border: "border-[#FF6B6B]/40", text: "text-[#FF6B6B]", dot: "#FF6B6B" },
    default: { bg: "bg-white/5",      border: "border-white/10",     text: "text-white/70",  dot: "rgba(255,255,255,0.3)" },
};

const DOT_DELAYS = [0, -0.7, -1.4, -0.35, -1.05, -1.75];

// Normalise step — Gemini sometimes emits plain strings instead of {label} objects
function normaliseStep(s: any): { label: string; description?: string; colour?: string } {
    if (typeof s === "string") return { label: s };
    return s;
}

function Arrow({ colour = "#9B8FFF", index = 0 }: { colour?: string; index?: number }) {
    const delay = DOT_DELAYS[index % DOT_DELAYS.length];
    return (
        <div className="relative shrink-0 flex items-center" style={{ width: 56, height: 28 }}>
            <svg width="56" height="28" viewBox="0 0 56 28" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" className="absolute inset-0">
                <path d="M4 14h40M36 8l8 6-8 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{
                    background: colour,
                    boxShadow: `0 0 6px ${colour}`,
                    animation: `travelDot 2.2s cubic-bezier(0.4,0,0.6,1) infinite`,
                    animationDelay: `${delay}s`,
                }}
            />
            <style>{`
                @keyframes travelDot {
                    0%   { left: 4px;  opacity: 0; }
                    8%   { opacity: 1; }
                    85%  { opacity: 1; }
                    100% { left: 44px; opacity: 0; }
                }
            `}</style>
        </div>
    );
}

function StepNode({ step, index }: { step: { label: string; description?: string; colour?: string }; index: number }) {
    const c = COLOUR_MAP[(step.colour as keyof typeof COLOUR_MAP) ?? "default"] ?? COLOUR_MAP.default;
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            className={cn(
                "flex flex-col items-center justify-center text-center",
                "rounded-2xl border px-5 py-4 min-w-[120px] max-w-[160px] gap-1",
                c.bg, c.border
            )}
        >
            <span className={cn("font-mono text-[11px] font-bold uppercase tracking-widest mb-0.5 opacity-50", c.text)}>
                {String(index + 1).padStart(2, "0")}
            </span>
            <span className={cn("font-sans text-[15px] font-bold leading-tight", c.text)}>
                {step.label}
            </span>
            {step.description && (
                <span className="mt-1 text-[13px] text-white/50 leading-tight font-sans">
                    {step.description}
                </span>
            )}
        </motion.div>
    );
}

// ── Layout 0: Parallel tracks (original) ──────────────────────────────────────
function ContrastTracks({ contrast }: { contrast: NonNullable<FlowDiagramBlock["contrast"]> }) {
    const stepsA = (contrast.stepsA || []).map(normaliseStep);
    const stepsB = (contrast.stepsB || []).map(normaliseStep);
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-[12px] text-[#FF6B6B]/60 uppercase tracking-widest w-16 shrink-0 text-right">
                    {contrast.labelA}
                </span>
                {stepsA.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <StepNode step={{ ...s, colour: s.colour ?? "nova" }} index={i} />
                        <Arrow colour="#FF6B6B" index={i} />
                    </div>
                ))}
                <StepNode step={{ label: contrast.middleNode }} index={stepsA.length} />
                <Arrow colour="#FF6B6B" index={stepsA.length} />
                <div className="rounded-2xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/8 px-5 py-4 max-w-[180px]">
                    <span className="font-sans text-[14px] text-[#FF6B6B] leading-snug">{contrast.outcomeA}</span>
                </div>
            </div>

            <div className="flex items-center gap-3 ml-20">
                <div className="flex-1 h-px bg-white/5"/>
                <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest">vs</span>
                <div className="flex-1 h-px bg-white/5"/>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-[12px] text-[#00FFB3]/60 uppercase tracking-widest w-16 shrink-0 text-right">
                    {contrast.labelB}
                </span>
                {stepsB.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <StepNode step={{ ...s, colour: s.colour ?? "pulse" }} index={i} />
                        <Arrow colour="#00FFB3" index={i + 3} />
                    </div>
                ))}
                <StepNode step={{ label: contrast.middleNode }} index={stepsB.length} />
                <Arrow colour="#00FFB3" index={stepsB.length + 3} />
                <div className="rounded-2xl border border-[#00FFB3]/30 bg-[#00FFB3]/8 px-5 py-4 max-w-[180px]">
                    <span className="font-sans text-[14px] text-[#00FFB3] leading-snug">{contrast.outcomeB}</span>
                </div>
            </div>
        </div>
    );
}

// ── Layout 1: Split table ──────────────────────────────────────────────────────
function ContrastTable({ contrast }: { contrast: NonNullable<FlowDiagramBlock["contrast"]> }) {
    const stepsA = (contrast.stepsA || []).map(normaliseStep);
    const stepsB = (contrast.stepsB || []).map(normaliseStep);
    const rowCount = Math.max(stepsA.length, stepsB.length);

    return (
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-2 divide-x divide-white/[0.08]">
                <div className="px-6 py-4 bg-[#FF6B6B]/8 border-b border-white/[0.08]">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#FF6B6B]/70">
                        {contrast.labelA}
                    </span>
                </div>
                <div className="px-6 py-4 bg-[#00FFB3]/8 border-b border-white/[0.08]">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#00FFB3]/70">
                        {contrast.labelB}
                    </span>
                </div>
            </div>

            {/* Rows */}
            {Array.from({ length: rowCount }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                    className="grid grid-cols-2 divide-x divide-white/[0.06] border-b border-white/[0.06] last:border-b-0"
                >
                    <div className="px-6 py-4 flex items-start gap-3">
                        <span className="font-mono text-[11px] text-[#FF6B6B]/40 mt-0.5 shrink-0">
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-sans text-[14px] text-white/70 leading-snug">
                            {stepsA[i]?.label ?? "—"}
                        </span>
                    </div>
                    <div className="px-6 py-4 flex items-start gap-3">
                        <span className="font-mono text-[11px] text-[#00FFB3]/40 mt-0.5 shrink-0">
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-sans text-[14px] text-white/70 leading-snug">
                            {stepsB[i]?.label ?? "—"}
                        </span>
                    </div>
                </motion.div>
            ))}

            {/* Outcome row */}
            <div className="grid grid-cols-2 divide-x divide-white/[0.08] border-t border-white/[0.1]">
                <div className="px-6 py-4 bg-[#FF6B6B]/5">
                    <span className="font-mono text-[11px] text-[#FF6B6B]/50 uppercase tracking-widest block mb-1">Result</span>
                    <span className="font-sans text-[15px] font-bold text-[#FF6B6B]">{contrast.outcomeA}</span>
                </div>
                <div className="px-6 py-4 bg-[#00FFB3]/5">
                    <span className="font-mono text-[11px] text-[#00FFB3]/50 uppercase tracking-widest block mb-1">Result</span>
                    <span className="font-sans text-[15px] font-bold text-[#00FFB3]">{contrast.outcomeB}</span>
                </div>
            </div>
        </div>
    );
}

// ── Layout 2: Hero duel cards ──────────────────────────────────────────────────
function ContrastDuel({ contrast }: { contrast: NonNullable<FlowDiagramBlock["contrast"]> }) {
    const stepsA = (contrast.stepsA || []).map(normaliseStep);
    const stepsB = (contrast.stepsB || []).map(normaliseStep);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card A */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-[#FF6B6B]/20 bg-[#FF6B6B]/5 p-6 flex flex-col gap-4"
            >
                <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#FF6B6B]/70">
                        {contrast.labelA}
                    </span>
                    <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest px-2 py-1 rounded-full border border-white/10">
                        Before
                    </span>
                </div>
                <ul className="space-y-2 flex-1">
                    {stepsA.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF6B6B]/50 shrink-0" />
                            <span className="font-sans text-[14px] text-white/65 leading-snug">{s.label}</span>
                        </li>
                    ))}
                </ul>
                <div className="pt-4 border-t border-[#FF6B6B]/15">
                    <span className="font-sans text-[13px] font-bold text-[#FF6B6B]">→ {contrast.outcomeA}</span>
                </div>
            </motion.div>

            {/* Card B */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl border border-[#00FFB3]/20 bg-[#00FFB3]/5 p-6 flex flex-col gap-4"
            >
                <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#00FFB3]/70">
                        {contrast.labelB}
                    </span>
                    <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest px-2 py-1 rounded-full border border-white/10">
                        After
                    </span>
                </div>
                <ul className="space-y-2 flex-1">
                    {stepsB.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00FFB3]/60 shrink-0" />
                            <span className="font-sans text-[14px] text-white/65 leading-snug">{s.label}</span>
                        </li>
                    ))}
                </ul>
                <div className="pt-4 border-t border-[#00FFB3]/15">
                    <span className="font-sans text-[13px] font-bold text-[#00FFB3]">→ {contrast.outcomeB}</span>
                </div>
            </motion.div>
        </div>
    );
}

export function FlowDiagram({ title, steps, contrast, imageUrl, explanation, lessonIndex }: FlowDiagramBlock & { imageUrl?: string; lessonIndex?: number }) {
    // Rotate contrast layout per lesson: 0=tracks, 1=table, 2=duel
    const contrastMode = (lessonIndex ?? 0) % 3;

    return (
        <div>
            {title && (
                <p className="font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-white/30 mb-8 text-center">
                    {title}
                </p>
            )}

            {/* LINEAR STEPS */}
            {!contrast && steps && steps.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    {steps.map((step, i) => {
                        const s = normaliseStep(step);
                        const c = COLOUR_MAP[(s.colour as keyof typeof COLOUR_MAP) ?? "default"] ?? COLOUR_MAP.default;
                        return (
                            <div key={i} className="flex items-center gap-2">
                                <StepNode step={s} index={i} />
                                {i < steps.length - 1 && <Arrow colour={c.dot} index={i} />}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CONTRAST — rotates between 3 layouts */}
            {contrast && contrastMode === 0 && <ContrastTracks contrast={contrast} />}
            {contrast && contrastMode === 1 && <ContrastTable contrast={contrast} />}
            {contrast && contrastMode === 2 && <ContrastDuel contrast={contrast} />}

            {/* Explanation */}
            {explanation && (
                <div className="mt-8 px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm">
                    <p className="font-body text-[0.95rem] text-[#B0B0C8] leading-relaxed">
                        {explanation}
                    </p>
                </div>
            )}
        </div>
    );
}
