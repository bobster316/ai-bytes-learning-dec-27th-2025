"use client";

import React, { useState } from 'react';
import { InteractiveVisBlock } from "@/lib/types/lesson-blocks";
import { Binary, Eye } from "lucide-react";
import { motion } from "framer-motion";

export function InteractiveVis(props: InteractiveVisBlock) {
    const [isRevealed, setIsRevealed] = useState(false);

    const codeText = props.codeSnippet || "// No structural data provided.";
    const lineCount = codeText.split('\n').length;

    return (
        <motion.div
            className="mb-12 border border-[#00FFB3]/20 bg-[#0d0d1c] rounded-2xl overflow-hidden shadow-lg mt-6 relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00FFB3]/60 via-[#00FFB3]/20 to-transparent" />

            <div className="bg-[#1C2242] px-5 py-4 flex items-center gap-3 border-b border-[#00FFB3]/10">
                <div className="w-8 h-8 rounded-lg bg-[#00FFB3]/15 flex items-center justify-center">
                    <Binary className="w-4 h-4 text-[#00FFB3]" />
                </div>
                <div>
                    <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#00FFB3] uppercase">Concept Explorer</div>
                    <h3 className="font-display text-white font-bold leading-none mt-0.5">{props.title}</h3>
                </div>
            </div>

            <div className="p-6 md:p-8">
                {props.intro && (
                    <div className="font-body text-[16px] text-[#C8C8E0] leading-relaxed mb-6 border-l-2 border-[#00FFB3]/30 pl-4 py-1">
                        {props.intro}
                    </div>
                )}
                <div className="relative w-full rounded-xl bg-slate-900 border border-white/10 flex flex-col mb-6 shadow-inner group min-h-[460px]">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#00FFB3]/5 to-transparent pointer-events-none rounded-xl" />

                    {/* Data/Code Area */}
                    <div className="p-4 border-b border-white/5 bg-black/40 rounded-t-xl flex-1 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-2 shrink-0">
                            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                {props.vizType === 'architecture' ? 'Architecture Definition' : props.vizType === 'flowchart' ? 'Logic Flow' : 'Data Structure'}
                            </span>
                        </div>
                        <div className="flex flex-1 overflow-auto max-h-[350px] scrollbar-thin scrollbar-thumb-white/10">
                            {/* Line numbers */}
                            <div className="font-mono text-[11px] text-slate-600 select-none mr-4 text-right leading-[1.5rem] shrink-0 pt-2 pl-2" aria-hidden="true">
                                {Array.from({ length: lineCount }, (_, i) => (
                                    <div key={i}>{i + 1}</div>
                                ))}
                            </div>
                            <pre className="text-sm font-mono text-cyan-400 w-full text-left p-2 leading-[1.5rem]">
                                <code>{codeText}</code>
                            </pre>
                        </div>
                    </div>

                    {/* Analysis Area */}
                    <div className="min-h-[120px] shrink-0 p-6 md:p-8 flex flex-col items-center justify-center relative bg-slate-900/50">
                        {!isRevealed ? (
                            <motion.button
                                onClick={() => setIsRevealed(true)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 bg-[#00FFB3]/10 hover:bg-[#00FFB3]/20 text-[#00FFB3] border border-[#00FFB3]/30 px-6 py-3 rounded-xl font-bold transition-all"
                            >
                                <Eye className="w-5 h-5" />
                                Decode Context
                            </motion.button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-left w-full"
                            >
                                <div className="text-[10px] text-[#00FFB3] font-mono uppercase tracking-widest mb-4 border-b border-[#00FFB3]/20 pb-2">Analysis Result</div>
                                <p className="text-[#C8C8E0] font-body text-[16px] leading-[1.8]">
                                    {props.description}
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
