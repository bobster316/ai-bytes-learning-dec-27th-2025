"use client";

import React from 'react';
import { AppliedCaseBlock } from "@/lib/types/lesson-blocks";
import { Briefcase, Target, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function AppliedCase(props: AppliedCaseBlock) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="bg-[#0d0d1c] rounded-2xl border border-white/10 overflow-hidden shadow-xl relative">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00FFB3]/60 via-[#4b98ad]/30 to-transparent" />

                {/* Header */}
                <div className="bg-[#1C2242] px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00FFB3]/20 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-[#00FFB3]" />
                    </div>
                    <div className="font-display text-[14px] font-bold text-white tracking-wide">Applied Case Study</div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    {/* Scenario */}
                    <div>
                        <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] text-[#8A8AB0] uppercase mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            The Scenario
                        </h4>
                        <motion.p
                            className="text-[#C8C8E0] font-body text-[16px] leading-relaxed"
                            initial={{ opacity: 0, x: -12 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.15, duration: 0.5 }}
                        >
                            {props.scenario}
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Challenge */}
                        <motion.div
                            className="bg-amber-500/5 rounded-xl border border-amber-500/10 p-5"
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.25, duration: 0.45 }}
                        >
                            <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] text-amber-500 uppercase mb-3 flex items-center gap-2">
                                <Target className="w-3.5 h-3.5" />
                                The Challenge
                            </h4>
                            <p className="text-amber-100/80 font-body text-[15px] leading-relaxed">
                                {props.challenge}
                            </p>
                        </motion.div>

                        {/* Resolution */}
                        <motion.div
                            className="bg-[#00FFB3]/5 rounded-xl border border-[#00FFB3]/10 p-5"
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.35, duration: 0.45 }}
                        >
                            <h4 className="text-[12px] font-mono font-bold tracking-[0.16em] text-[#00FFB3] uppercase mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                The Resolution
                            </h4>
                            <p className="text-[#00FFB3]/80 font-body text-[15px] leading-relaxed">
                                {props.resolution}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
