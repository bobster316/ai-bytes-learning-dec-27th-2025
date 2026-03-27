"use client";

import { KeyTermsBlock } from "@/lib/types/lesson-blocks";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function KeyTerms({ terms }: KeyTermsBlock) {
    const [openTerms, setOpenTerms] = useState<Record<number, boolean>>({});

    const toggleTerm = (index: number) => {
        setOpenTerms(prev => ({ ...prev, [index]: !prev[index] }));
    };

    if (!terms || terms.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20 mt-12"
        >
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-lg font-black text-white flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#00FFB3] shadow-[0_0_12px_#00FFB3]" />
                    Term Glossary
                </h3>
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">{terms.length} verified concepts</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(terms || []).map((termInput, idx) => {
                    const termItem = typeof termInput === "string" 
                        ? { term: termInput, definition: "Key concept explored in this lesson." }
                        : termInput as { term: string; definition: string };
                    const isOpen = openTerms[idx];
                    
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className="group relative"
                        >
                            <button
                                onClick={() => toggleTerm(idx)}
                                className="w-full relative z-10 p-6 rounded-2xl bg-[#141422]/50 border border-white/5 text-left transition-all duration-300 hover:bg-[#1E1E35] hover:border-[#00FFB3]/20"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-display text-sm font-bold text-white group-hover:text-[#00FFB3] transition-colors">
                                        {termItem.term}
                                    </span>
                                    <ChevronDown
                                        className={`w-4 h-4 text-white/20 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00FFB3]' : ''}`}
                                    />
                                </div>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                            animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <p className="font-body text-[13px] text-white/50 leading-relaxed border-l-2 border-[#00FFB3]/20 pl-4 py-1">
                                                {termItem.definition}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
