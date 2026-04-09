"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PredictionBlock } from "@/lib/types/lesson-blocks";
import { cn } from "@/lib/utils";

export function Prediction({ question, options, correctIndex, reveal, accentColour = "iris" }: PredictionBlock) {
    const [selected, setSelected] = useState<number | null>(null);
    const answered = selected !== null;

    const accentHex = accentColour === "pulse" ? "#00FFB3"
        : accentColour === "amber" ? "#FFB347"
        : "#9B8FFF";

    const getOptionState = (i: number) => {
        if (!answered) return "idle";
        if (i === correctIndex) return "correct";
        if (i === selected) return "wrong";
        return "dim";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${accentHex}10 0%, ${accentHex}06 100%)`,
                border: `1px solid ${accentHex}25`,
            }}
        >
            <div className="px-8 py-8">
                {/* Label */}
                <div className="flex items-center gap-3 mb-7">
                    <div className="w-2 h-5 rounded-sm" style={{ background: accentHex }} />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accentHex }}>
                        Before you continue
                    </span>
                </div>

                {/* Question */}
                <p className="font-sans font-bold text-[1.1rem] text-white leading-snug mb-8 tracking-tight">
                    {question}
                </p>

                {/* Options */}
                <div className="space-y-4">
                    {options.map((opt: string, i: number) => {
                        const state = getOptionState(i);
                        return (
                            <button
                                key={i}
                                disabled={answered}
                                onClick={() => setSelected(i)}
                                className={cn(
                                    "w-full text-left rounded-xl transition-all duration-200 overflow-hidden",
                                    "flex items-stretch",
                                    !answered && "cursor-pointer hover:bg-white/[0.04]",
                                    answered && "cursor-default"
                                )}
                                style={{
                                    background: state === "correct" ? "rgba(0,255,179,0.06)"
                                        : state === "wrong" ? "rgba(255,107,107,0.05)"
                                        : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${state === "correct" ? "rgba(0,255,179,0.3)"
                                        : state === "wrong" ? "rgba(255,107,107,0.2)"
                                        : "rgba(255,255,255,0.07)"}`,
                                }}
                            >
                                {/* Left accent bar */}
                                <div
                                    className="w-1 shrink-0 rounded-l-xl transition-colors duration-200"
                                    style={{
                                        background: state === "correct" ? "#00FFB3"
                                            : state === "wrong" ? "#FF6B6B"
                                            : state === "idle" ? `${accentHex}40`
                                            : "rgba(255,255,255,0.05)",
                                    }}
                                />
                                <div className="flex items-center gap-4 px-5 py-4 flex-1">
                                    {/* Numbered badge */}
                                    <span
                                        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-mono text-[11px] font-bold transition-colors duration-200"
                                        style={{
                                            background: state === "correct" ? "rgba(0,255,179,0.15)"
                                                : state === "wrong" ? "rgba(255,107,107,0.12)"
                                                : `${accentHex}15`,
                                            color: state === "correct" ? "#00FFB3"
                                                : state === "wrong" ? "#FF6B6B"
                                                : state === "dim" ? "rgba(255,255,255,0.2)"
                                                : accentHex,
                                        }}
                                    >
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    <span
                                        className="text-[15px] font-medium leading-snug"
                                        style={{
                                            color: state === "correct" ? "#00FFB3"
                                                : state === "wrong" ? "rgba(255,107,107,0.6)"
                                                : state === "dim" ? "rgba(255,255,255,0.2)"
                                                : "rgba(255,255,255,0.75)",
                                        }}
                                    >
                                        {opt}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Reveal */}
                <AnimatePresence>
                    {answered && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.35, ease: [0.25, 0, 0, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="mt-7 pt-7 border-t border-white/8">
                                <span className="font-mono text-[11px] uppercase tracking-widest block mb-3"
                                    style={{ color: selected === correctIndex ? "#00FFB3" : "#FF6B6B" }}>
                                    {selected === correctIndex ? "Correct —" : "Not quite —"}
                                </span>
                                <p className="text-white/70 text-[16px] leading-relaxed font-sans">{reveal}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
