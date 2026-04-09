"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";

interface FloatingGamificationProps {
    xp: number;
    streak: number;
}

export function FloatingGamification({ xp, streak }: FloatingGamificationProps) {
    const [prevXp, setPrevXp] = useState(xp);
    const [showPulse, setShowPulse] = useState(false);

    useEffect(() => {
        if (xp > prevXp) {
            setShowPulse(true);
            const timer = setTimeout(() => setShowPulse(false), 2000);
            setPrevXp(xp);
            return () => clearTimeout(timer);
        }
    }, [xp, prevXp]);

    return (
        <div className="fixed top-20 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence>
                {showPulse && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 1.1 }}
                        className="bg-[#00FFB3] text-[#141422] font-black text-[10px] px-3 py-1 rounded-full shadow-[0_0_20px_rgba(0,255,179,0.4)] uppercase tracking-widest"
                    >
                        +40 XP GAINED
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-[#141422]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-4 shadow-2xl pointer-events-auto"
            >
                <div className="flex flex-col items-end mr-1">
                    <span className="font-mono text-[9px] text-[#8A8AB0] uppercase tracking-tighter leading-none mb-1">Total Yield</span>
                    <span className="font-outfit text-sm font-black text-white leading-none">{xp.toLocaleString()} <span className="text-[#00FFB3]">XP</span></span>
                </div>

                <div className="w-px h-8 bg-white/10" />

                <div className="flex items-center gap-3 ml-1">
                    <div className="flex flex-col items-start">
                        <span className="font-mono text-[9px] text-[#FFB347] uppercase tracking-tighter leading-none mb-1">Continuity</span>
                        <span className="font-outfit text-sm font-black text-white">{streak} <span className="text-[#FFB347]">Days</span></span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
