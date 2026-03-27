"use client";

import React from "react";
import { motion } from "framer-motion";
import { Headphones, Play } from "lucide-react";
import { AudioRecapProminentBlock } from "@/lib/types/lesson-blocks";

interface AudioRecapProminentProps extends AudioRecapProminentBlock {
    onPlay?: () => void;
}

export function AudioRecapProminent({ audioUrl, onPlay }: AudioRecapProminentProps) {
    return (
        <div className="my-16 relative">
            {/* Background Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#00FFB3]/10 to-[#4b98ad]/10 blur-3xl opacity-50 rounded-full" />

            <div className="relative bg-[#0f0f1c]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl overflow-hidden group">

                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    {/* Left: Icon Section */}
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-[#0d0d1c] to-[#141422] border border-white/10 flex items-center justify-center shadow-inner overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center bg-[#00FFB3]/5">
                                <Headphones className="w-12 h-12 md:w-16 md:h-16 text-[#00FFB3] animate-pulse" />
                            </div>
                            {/* Animated Pulse Rings */}
                            <div className="absolute inset-0">
                                <div className="absolute inset-0 border-2 border-[#00FFB3]/20 rounded-2xl animate-[ping_3s_infinite]" />
                                <div className="absolute inset-0 border-2 border-[#00FFB3]/10 rounded-2xl animate-[ping_3s_1.5s_infinite]" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Content Section */}
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="font-display text-[clamp(1.5rem,4vw,2rem)] font-extrabold text-white mb-4 leading-tight">
                            Audio lesson recap
                        </h3>
                        <p className="font-body text-[17px] text-[#C8C8E0] mb-8 leading-relaxed max-w-xl">
                            A concise audio summary of this lesson — great for reinforcing key concepts on the go.
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0,255,179,0.2)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onPlay}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#141422] rounded-2xl font-mono text-[13px] font-black uppercase tracking-wider shadow-xl transition-all"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Play Recap
                        </motion.button>
                    </div>
                </div>

                {/* Bottom Border Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FFB3]/50 to-transparent" />
            </div>
        </div>
    );
}
