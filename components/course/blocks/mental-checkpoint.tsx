"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCourseDNA } from "../course-dna-provider";

export function MentalCheckpoint({ prompt, checkpoint_style, response_mode, options }: any) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || '#00FFB3';
    const [selected, setSelected] = useState<string | null>(null);

    const defaultOptions = checkpoint_style === 'confidence_pick'
        ? (options ?? ['Got it', 'Mostly there', 'Lost me'])
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            data-analytics-tag="mental_checkpoint"
            className="my-6 rounded-2xl border border-white/[0.07] p-7 bg-white/[0.02]"
        >
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] mb-4 text-white/40">
                {checkpoint_style === 'confidence_pick' ? 'Confidence check'
                    : checkpoint_style === 'predict' ? 'Your prediction'
                    : 'Pause and reflect'}
            </p>
            <p className="font-body text-[1rem] text-white/85 leading-relaxed mb-5">{prompt}</p>

            {defaultOptions && (
                <div className="flex flex-wrap gap-3">
                    {defaultOptions.map((opt: string) => (
                        <button
                            key={opt}
                            onClick={() => setSelected(opt)}
                            className="px-4 py-2 rounded-lg border text-[0.875rem] font-medium transition-all duration-200"
                            style={selected === opt
                                ? { borderColor: accent, color: accent, background: `${accent}15` }
                                : { borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }
                            }
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
            {selected && (
                <p className="mt-4 text-[0.8rem] text-white/40 font-mono">
                    Response recorded — keep going.
                </p>
            )}
        </motion.div>
    );
}
