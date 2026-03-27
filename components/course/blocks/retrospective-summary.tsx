"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import confetti from 'canvas-confetti';
import { ConceptMap } from "./concept-map";

/**
 * RetrospectiveSummary - The "Wow" Grade Finale
 * Glassmorphic summary card with animated stats and confetti celebration.
 */
export function RetrospectiveSummary({ xp, streak, termsCount, terms, onContinue }: { xp: number; streak: number; termsCount: number; terms?: any[]; onContinue?: () => void }) {
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            onViewportEnter={() => {
                const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#00FFB3';
                const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4b98ad';

                const duration = 3 * 1000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, colors: [primaryColor, accentColor, '#FFFFFF'] };

                const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();
                    if (timeLeft <= 0) return clearInterval(interval);
                    const particleCount = 50 * (timeLeft / duration);
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                }, 250);
            }}
            className="relative group p-[2px] rounded-[2.5rem] bg-gradient-to-b from-[var(--accent)]/40 via-transparent to-transparent shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)]"
        >
            <div className="bg-[#141422] rounded-[2.4rem] p-10 md:p-14 flex flex-col items-center text-center backdrop-blur-3xl border border-white/5 overflow-hidden">
                {/* Decorative Background Glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-[var(--accent)]/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[var(--primary)]/20 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-24 h-24 mb-8 relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--accent)]/30"
                    />
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#6B7FFF] flex items-center justify-center shadow-[0_0_40px_rgba(155,143,255,0.4)]"
                        style={{ boxShadow: `0_0_40px_var(--primary-glow)` }}>
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                </div>

                <h2 className="font-syne text-[2.5rem] md:text-[3.5rem] font-black text-white leading-none mb-4 tracking-tighter">
                    Explorer <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">Retrospective</span>
                </h2>
                <p className="font-outfit text-[#E2E8F0]/80 text-[18px] max-w-2xl mb-12 leading-relaxed">
                    You've successfully traversed the core architectures of this concept. Your neural networks have been updated.
                </p>

                {terms && terms.length > 0 && (
                    <ConceptMap terms={terms} />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                    {/* XP Card */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center"
                    >
                        <div className="text-[var(--accent)] font-mono text-[10px] uppercase tracking-[0.2em] mb-2">Total Yield</div>
                        <div className="text-3xl font-black text-white mb-4">+{xp.toLocaleString()} XP</div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: '85%' }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                className="h-full bg-[var(--accent)]"
                            />
                        </div>
                    </motion.div>

                    {/* Streak Card */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center"
                    >
                        <div className="text-[#FFB347] font-mono text-[10px] uppercase tracking-[0.2em] mb-2">Continuity</div>
                        <div className="text-3xl font-black text-white mb-4">{streak} Days</div>
                        <div className="text-[10px] font-bold text-[#FFB347]/80 uppercase tracking-widest flex items-center gap-1">
                            🔥 Velocity maintained
                        </div>
                    </motion.div>

                    {/* Terms Card */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center"
                    >
                        <div className="text-[var(--primary)] font-mono text-[10px] uppercase tracking-[0.2em] mb-2">Lexicon Growth</div>
                        <div className="text-3xl font-black text-white mb-4">{termsCount} Terms</div>
                        <div className="text-[10px] font-bold text-[var(--primary)]/80 uppercase tracking-widest">
                            Added to vault
                        </div>
                    </motion.div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onContinue}
                    className="mt-16 px-12 py-5 rounded-2xl bg-white text-[#141422] font-black text-xs font-display uppercase tracking-[0.25em] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all"
                >
                    Continue Path
                </motion.button>
            </div>
        </motion.div>
    );
}
