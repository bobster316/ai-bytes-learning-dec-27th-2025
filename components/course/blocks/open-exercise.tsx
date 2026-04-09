"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OpenExerciseBlock } from "@/lib/types/lesson-blocks";
import { cn } from "@/lib/utils";

const ACCENT = {
    pulse: { border: "border-[#00FFB3]", text: "text-[#00FFB3]", bg: "bg-[#00FFB3]/10", glow: "shadow-[0_0_0_1px_rgba(0,255,179,0.3)]" },
    iris:  { border: "border-[#9B8FFF]", text: "text-[#9B8FFF]", bg: "bg-[#9B8FFF]/10", glow: "shadow-[0_0_0_1px_rgba(155,143,255,0.3)]" },
    amber: { border: "border-[#FFB347]", text: "text-[#FFB347]", bg: "bg-[#FFB347]/10", glow: "shadow-[0_0_0_1px_rgba(255,179,71,0.3)]" },
    nova:  { border: "border-[#FF6B6B]", text: "text-[#FF6B6B]", bg: "bg-[#FF6B6B]/10", glow: "shadow-[0_0_0_1px_rgba(255,107,107,0.3)]" },
};

export function OpenExercise({ instruction, weakPrompt, scaffoldLabels, modelAnswer, accentColour = "pulse" }: OpenExerciseBlock) {
    const [parts, setParts] = useState(["", "", "", ""]);
    const [submitted, setSubmitted] = useState(false);
    const accent = ACCENT[accentColour as keyof typeof ACCENT] || ACCENT.pulse;

    const canSubmit = parts.every(p => p.trim().length > 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-white/[0.03] border border-white/10 px-8 py-10"
        >
            {/* Label */}
            <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[#00FFB3]">
                    Active Practice
                </span>
                <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Instruction */}
            <p className="font-body text-base text-white/80 leading-relaxed mb-5">{instruction}</p>

            {/* Weak prompt to improve */}
            <div className="rounded-xl border border-[#FF6B6B]/25 bg-[#FF6B6B]/5 px-5 py-4 mb-8">
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#FF6B6B] block mb-2">Weak prompt</span>
                <p className="text-white/60 text-base">"{weakPrompt}"</p>
            </div>

            {/* Scaffold inputs */}
            {!submitted && (
                <div className="space-y-4 mb-6">
                    {scaffoldLabels.map((label, i) => (
                        <div key={i}>
                            <label className="font-mono text-[11px] uppercase tracking-widest text-white/30 block mb-2">
                                {label}
                            </label>
                            <textarea
                                rows={2}
                                value={parts[i]}
                                onChange={e => {
                                    const next = [...parts];
                                    next[i] = e.target.value;
                                    setParts(next);
                                }}
                                placeholder={`Add ${label.toLowerCase()} here…`}
                                className={cn(
                                    "w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-sm text-white/80 placeholder:text-white/20",
                                    "resize-none outline-none transition-all duration-200 text-base",
                                    "border-white/10 focus:border-white/25 focus:bg-white/[0.06]",
                                    "focus-visible:ring-2 focus-visible:ring-[#9B8FFF]/40"
                                )}
                            />
                        </div>
                    ))}

                    <button
                        disabled={!canSubmit}
                        onClick={() => setSubmitted(true)}
                        className={cn(
                            "mt-2 w-full rounded-xl py-3.5 text-sm font-display font-semibold transition-all duration-200",
                            canSubmit
                                ? cn("cursor-pointer", accent.bg, accent.border, accent.text, "border hover:opacity-90")
                                : "cursor-not-allowed bg-white/5 border border-white/10 text-white/25"
                        )}
                    >
                        {canSubmit ? "See model answer →" : "Fill in all parts to continue"}
                    </button>
                </div>
            )}

            {/* Model answer reveal */}
            <AnimatePresence>
                {submitted && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.4, ease: [0.25, 0, 0, 1] }}
                        className="overflow-hidden"
                    >
                        {/* Their assembled answer */}
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 mb-5">
                            <span className="font-mono text-[11px] uppercase tracking-widest text-white/30 block mb-3">Your prompt</span>
                            {parts.map((p, i) => (
                                <p key={i} className="text-white/70 text-base leading-relaxed">
                                    <span className={cn("font-mono text-[11px] uppercase tracking-widest mr-2", accent.text)}>{scaffoldLabels[i]}:</span>
                                    {p}
                                </p>
                            ))}
                        </div>

                        {/* Model answer */}
                        <div className={cn("rounded-xl border px-5 py-4", accent.border, accent.bg)}>
                            <span className={cn("font-mono text-[11px] uppercase tracking-widest block mb-3", accent.text)}>
                                Model answer
                            </span>
                            <p className="text-white/80 text-base leading-relaxed">{modelAnswer}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
