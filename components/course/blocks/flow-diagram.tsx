"use client";

import { motion } from "framer-motion";
import { FlowDiagramBlock } from "@/lib/types/lesson-blocks";
import { cn } from "@/lib/utils";

const COLOUR_MAP = {
    pulse:   { bg: "bg-[#00FFB3]/10", border: "border-[#00FFB3]/40", text: "text-[#00FFB3]", dot: "#00FFB3" },
    iris:    { bg: "bg-[#4b98ad]/10", border: "border-[#4b98ad]/40", text: "text-[#4b98ad]", dot: "#4b98ad" },
    amber:   { bg: "bg-[#FFB347]/10", border: "border-[#FFB347]/40", text: "text-[#FFB347]", dot: "#FFB347" },
    nova:    { bg: "bg-[#FF6B6B]/10", border: "border-[#FF6B6B]/40", text: "text-[#FF6B6B]", dot: "#FF6B6B" },
    default: { bg: "bg-white/5",      border: "border-white/10",     text: "text-white/70",  dot: "rgba(255,255,255,0.3)" },
};

// DELAYS are deterministic — no Math.random() to avoid SSR/client hydration mismatch
const DOT_DELAYS = [0, -0.7, -1.4, -0.35, -1.05, -1.75];

function Arrow({ colour = "#4b98ad", index = 0 }: { colour?: string; index?: number }) {
    const delay = DOT_DELAYS[index % DOT_DELAYS.length];
    return (
        <div className="relative shrink-0 flex items-center" style={{ width: 56, height: 28 }}>
            <svg width="56" height="28" viewBox="0 0 56 28" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" className="absolute inset-0">
                <path d="M4 14h40M36 8l8 6-8 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {/* Travelling dot — deterministic delay, safe for SSR */}
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

export function FlowDiagram({ title, steps, contrast, imageUrl }: FlowDiagramBlock & { imageUrl?: string }) {
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
                        const c = COLOUR_MAP[(step.colour as keyof typeof COLOUR_MAP) ?? "default"] ?? COLOUR_MAP.default;
                        return (
                        <div key={i} className="flex items-center gap-2">
                            <StepNode step={step} index={i} />
                            {i < steps.length - 1 && <Arrow colour={c.dot} index={i} />}
                        </div>
                        );
                    })}
                </div>
            )}

            {/* CONTRAST MODE */}
            {contrast && (
                <div className="space-y-5">
                    {/* Path A — bad */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-[12px] text-[#FF6B6B]/60 uppercase tracking-widest w-16 shrink-0 text-right">
                            {contrast.labelA}
                        </span>
                        {contrast.stepsA.map((s, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <StepNode step={{ ...s, colour: s.colour ?? "nova" }} index={i} />
                                <Arrow colour="#FF6B6B" index={i} />
                            </div>
                        ))}
                        <StepNode step={{ label: contrast.middleNode }} index={contrast.stepsA.length} />
                        <Arrow colour="#FF6B6B" index={contrast.stepsA.length} />
                        <div className="rounded-2xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/8 px-5 py-4 max-w-[180px]">
                            <span className="font-sans text-[14px] text-[#FF6B6B] leading-snug">{contrast.outcomeA}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-20">
                        <div className="flex-1 h-px bg-white/5"/>
                        <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest">vs</span>
                        <div className="flex-1 h-px bg-white/5"/>
                    </div>

                    {/* Path B — good */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-[12px] text-[#00FFB3]/60 uppercase tracking-widest w-16 shrink-0 text-right">
                            {contrast.labelB}
                        </span>
                        {contrast.stepsB.map((s, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <StepNode step={{ ...s, colour: s.colour ?? "pulse" }} index={i} />
                                <Arrow colour="#00FFB3" index={i + 3} />
                            </div>
                        ))}
                        <StepNode step={{ label: contrast.middleNode }} index={contrast.stepsB.length} />
                        <Arrow colour="#00FFB3" index={contrast.stepsB.length + 3} />
                        <div className="rounded-2xl border border-[#00FFB3]/30 bg-[#00FFB3]/8 px-5 py-4 max-w-[180px]">
                            <span className="font-sans text-[14px] text-[#00FFB3] leading-snug">{contrast.outcomeB}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
