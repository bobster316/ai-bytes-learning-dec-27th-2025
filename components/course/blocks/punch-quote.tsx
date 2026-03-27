"use client";

import { motion } from "framer-motion";
import { PunchQuoteBlock } from "@/lib/types/lesson-blocks";

const ACCENT_HEX: Record<string, string> = {
    pulse: "#00FFB3",
    iris:  "#4b98ad",
    amber: "#FFB347",
    nova:  "#FF6B6B",
};

export function PunchQuote({ quote, attribution, accent = "iris" }: PunchQuoteBlock) {
    const colour = ACCENT_HEX[accent] ?? "#4b98ad";
    const gradientRule = `linear-gradient(90deg, transparent, ${colour}, transparent)`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="py-16 text-center"
        >
            {/* Top gradient rule */}
            <div className="w-full h-px mb-10" style={{ background: gradientRule }} />

            <blockquote
                className="font-display font-black mx-auto px-8 leading-[1.2] tracking-tight"
                style={{
                    fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                    color: colour,
                    maxWidth: "840px",
                    letterSpacing: "-0.02em",
                }}
            >
                {quote}
            </blockquote>

            {attribution && (
                <div
                    className="mt-7 font-mono text-[0.65rem] uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                    style={{ color: colour, opacity: 0.7 }}
                >
                    <span className="block w-6 h-px" style={{ background: colour }} />
                    {attribution}
                    <span className="block w-6 h-px" style={{ background: colour }} />
                </div>
            )}

            {/* Bottom gradient rule */}
            <div className="w-full h-px mt-10" style={{ background: gradientRule }} />
        </motion.div>
    );
}
