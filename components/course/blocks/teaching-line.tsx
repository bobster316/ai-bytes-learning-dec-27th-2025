"use client";

import { motion } from "framer-motion";
import { useCourseDNA } from "../course-dna-provider";

export function TeachingLine({ line, support, lessonIndex }: any) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || '#00FFB3';
    const mode = (lessonIndex ?? 0) % 3;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            data-analytics-tag="teaching_line"
            className="my-8 max-w-[760px] mx-auto"
        >
            {mode === 0 && (
                <div>
                    <div className="h-px mb-5"
                        style={{ background: `linear-gradient(90deg, ${accent}50, transparent)` }} />
                    <p className="font-display text-[1.15rem] font-bold text-white leading-snug mb-3">{line}</p>
                    {support && <p className="font-body text-[0.9rem] text-white/60 leading-relaxed">{support}</p>}
                </div>
            )}
            {mode === 1 && (
                <div className="rounded-xl border p-6"
                    style={{ borderColor: `${accent}20`, background: `color-mix(in srgb, ${accent} 3%, #0f0f18)` }}>
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] mb-3"
                        style={{ color: `${accent}70` }}>The key insight</p>
                    <p className="font-display text-[1.1rem] font-bold text-white leading-snug mb-2">{line}</p>
                    {support && <p className="font-body text-[0.875rem] text-white/55 leading-relaxed">{support}</p>}
                </div>
            )}
            {mode === 2 && (
                <div className="flex gap-5 pl-1">
                    <div className="w-[3px] rounded-full shrink-0 self-stretch"
                        style={{ background: accent }} />
                    <div>
                        <p className="font-display text-[1.15rem] font-bold text-white leading-snug mb-2">{line}</p>
                        {support && <p className="font-body text-[0.875rem] text-white/55 leading-relaxed">{support}</p>}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
