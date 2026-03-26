"use client";

import { motion } from "framer-motion";
import { Zap, Image as ImageIcon, ArrowRight } from "lucide-react";
import { RecapBlock } from "@/lib/types/lesson-blocks";
import { useCourseDNA } from "../course-dna-provider";
import { archetypeOffset } from "@/lib/ai/generate-course-dna";

const RECAP_STYLES = ["card", "minimal", "striped"] as const;

// ── Style: CARD (classic dark gradient card, numbered circles) ────────────────
function CardStyle({ title, points, accent }: { title: string; points: string[]; accent: string }) {
    return (
        <motion.div
            className="mb-16 mt-6"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="relative rounded-3xl border overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                style={{
                    background: "linear-gradient(135deg, rgba(20,20,40,0.95) 0%, rgba(10,10,24,0.98) 100%)",
                    borderColor: `${accent}20`,
                    padding: "2.5rem 3rem",
                }}>
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }} />
                {/* Background flare */}
                <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2"
                    style={{ background: `${accent}0a` }} />

                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl border mb-5 shadow-lg"
                        style={{ background: `${accent}18`, borderColor: `${accent}30` }}>
                        <Zap className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white mb-8 leading-tight">
                        {title || "If you remember only three things..."}
                    </h2>
                    <div className="space-y-3">
                        {points.map((point, idx) => (
                            <motion.div key={idx}
                                initial={{ opacity: 0, x: -14 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 + idx * 0.1, duration: 0.45 }}
                                className="flex items-start gap-4 p-5 rounded-2xl border border-white/5"
                                style={{ background: "rgba(255,255,255,0.03)" }}
                            >
                                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm"
                                    style={{ background: `linear-gradient(135deg, ${accent}, #4b98ad)`, color: "#080810" }}>
                                    {idx + 1}
                                </span>
                                <p className="font-body text-[16px] text-[#C8C8E0] leading-relaxed pt-0.5">{point}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ── Style: MINIMAL (clean, no background card, mono numbers) ─────────────────
function MinimalStyle({ title, points, accent }: { title: string; points: string[]; accent: string }) {
    return (
        <motion.div
            className="mb-10 mt-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Section label */}
            <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accent}40, transparent)` }} />
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: accent }}>
                    Lesson recap
                </span>
                <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${accent}40, transparent)` }} />
            </div>

            <h2 className="font-display font-bold text-white text-center mb-10 leading-tight"
                style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", letterSpacing: "-0.02em" }}>
                {title || "If you remember only three things..."}
            </h2>

            <div className="max-w-[640px] mx-auto space-y-7">
                {points.map((point, idx) => (
                    <motion.div key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 + idx * 0.1, duration: 0.45 }}
                        className="flex gap-5 items-baseline"
                    >
                        <span className="font-mono font-bold shrink-0"
                            style={{ fontSize: "2rem", color: `${accent}30`, letterSpacing: "-0.04em", lineHeight: 1 }}>
                            {String(idx + 1).padStart(2, "0")}
                        </span>
                        <p className="font-body text-[17px] text-[#C8C8E0] leading-relaxed">{point}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

// ── Style: BENTO (impressive grid with icons and glassmorphism) ─────────────
function BentoStyle({ title, points, accent }: { title: string; points: string[]; accent: string }) {
    const ICONS = [Zap, ImageIcon, ArrowRight, Zap, ImageIcon, ArrowRight]; // Fallback icons
    
    return (
        <motion.div
            className="mb-20 mt-10 px-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
        >
            <div className="text-center mb-12">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6"
                >
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00FFB3]">Critical Takeaways</span>
                </motion.div>
                <h2 className="font-display font-black text-white text-3xl md:text-4xl tracking-tight leading-tight max-w-2xl mx-auto">
                    {title || "If you remember only three things..."}
                </h2>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 ${points.length === 4 ? "lg:grid-cols-2 max-w-5xl mx-auto" : "lg:grid-cols-3"} gap-6`}>
                {points.map((point, idx) => {
                    const Icon = ICONS[idx % ICONS.length] || Zap;
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="group relative p-8 rounded-[2rem] border transition-all duration-500 hover:scale-[1.02]"
                            style={{
                                background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                                borderColor: "rgba(255,255,255,0.05)",
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem] pointer-events-none"
                                style={{ background: `linear-gradient(135deg, ${accent}0a 0%, transparent 100%)` }} />
                            
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-500 group-hover:rotate-6"
                                    style={{ background: `${accent}10`, borderColor: `${accent}20` }}>
                                    <Icon className="w-6 h-6" style={{ color: accent }} />
                                </div>
                                <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-3">Goal {idx + 1}</div>
                                <p className="font-body text-lg text-white/80 leading-relaxed font-medium">
                                    {point}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            
            {/* Ambient bottom glow */}
            <div className="h-px w-full max-w-4xl mx-auto mt-20"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}20, transparent)` }} />
        </motion.div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function RecapSlide(props: RecapBlock) {
    const { primary_colour, palette_id } = useCourseDNA();
    const recapStyle = RECAP_STYLES[archetypeOffset(palette_id, 3)];
    const points = props.points || (props as any).items || [];
    const title  = props.title || "If you remember only three things...";

    // Hard-force Bento style to meet the user's high-fidelity requirement for "Key Takeaways"
    // This ignores any 'minimal' or 'card' style set in the database to ensure visual excellence.
    return <BentoStyle title={title} points={points} accent={primary_colour} />;
}
