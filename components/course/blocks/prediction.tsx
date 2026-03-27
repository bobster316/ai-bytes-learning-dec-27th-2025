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
        : "#4b98ad";

    const getOptionStyle = (i: number) => {
        if (!answered) return "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:bg-white/[0.06] cursor-pointer";
        if (i === correctIndex) return "border-[#00FFB3]/60 bg-[#00FFB3]/8 text-[#00FFB3] cursor-default";
        if (i === selected) return "border-[#FF6B6B]/30 bg-[#FF6B6B]/5 text-white/30 cursor-default";
        return "border-white/5 bg-transparent text-white/20 cursor-default";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-white/[0.02] border border-white/8 px-8 py-8"
        >
            {/* Label */}
            <div className="flex items-center gap-3 mb-7">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Before you continue
                </span>
                <div className="flex-1 h-px bg-white/6" />
            </div>

            {/* Question */}
            <p className="font-sans font-bold text-[1.1rem] text-white leading-snug mb-8 tracking-tight">
                {question}
            </p>

            {/* Options */}
            <div className="space-y-3">
                {options.map((opt: string, i: number) => (
                    <button
                        key={i}
                        disabled={answered}
                        onClick={() => setSelected(i)}
                        className={cn(
                            "w-full text-left px-5 py-4 rounded-xl border text-[16px] font-medium transition-all duration-200",
                            getOptionStyle(i)
                        )}
                    >
                        <span className="font-mono text-[11px] uppercase tracking-widest text-white/25 mr-3">
                            {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                    </button>
                ))}
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
        </motion.div>
    );
}
