"use client";

import { motion } from "framer-motion";
import { RecapBlock } from "@/lib/types/lesson-blocks";
import { useCourseDNA } from "../course-dna-provider";

// ── Style 0: BOX — 2×2 coloured cards with title + body ───────────────────────
function BoxStyle({ title, items, accent }: { title: string; items: Array<{ title: string; body: string }>; accent: string }) {
    const COLS = ["#FFB347", "#FF6B6B", accent, "#00FFB3"];
    return (
        <motion.div className="mt-10 mb-20"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <div className="text-center mb-10">
                <div className="inline-block px-4 py-1.5 rounded-full mb-5"
                    style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>Key Takeaways</span>
                </div>
                <h2 className="font-display font-black text-white tracking-tight leading-tight max-w-2xl mx-auto"
                    style={{ fontSize: "clamp(1.35rem, 2.4vw, 1.9rem)" }}>
                    {title || "What you should take from this lesson"}
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
                {items.map((item, i) => {
                    const c = COLS[i % COLS.length];
                    return (
                        <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="relative p-6 rounded-2xl border overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${c}0c, rgba(255,255,255,0.02))`, borderColor: `${c}25` }}>
                            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${c}60, transparent)` }} />
                            <div className="flex items-center gap-3 mb-3">
                                <span className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-[11px] shrink-0"
                                    style={{ background: `${c}18`, color: c }}>{i + 1}</span>
                                <h3 className="font-display font-bold text-white leading-snug" style={{ fontSize: "0.95rem" }}>{item.title}</h3>
                            </div>
                            <p className="font-body text-[0.9rem] text-[#a0a0bc] leading-relaxed pl-10">{item.body}</p>
                        </motion.div>
                    );
                })}
            </div>
            <div className="h-px w-full max-w-4xl mx-auto mt-14"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}20, transparent)` }} />
        </motion.div>
    );
}

// ── Style 1: BENTO — icon grid with glassmorphism cards ───────────────────────
function BentoStyle({ title, items, accent }: { title: string; items: Array<{ title: string; body: string }>; accent: string }) {
    const ICONS = [
        <path key="a" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
        <path key="b" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
        <path key="c" d="M13 10V3L4 14h7v7l9-11h-7z" />,
        <path key="d" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    ];
    const COLS = [accent, "#FFB347", "#FF6B6B", "#00FFB3"];

    return (
        <motion.div className="mt-10 mb-20 px-4"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="text-center mb-12">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }}
                    className="inline-block px-4 py-1.5 rounded-full mb-6"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>Critical Takeaways</span>
                </motion.div>
                <h2 className="font-display font-black text-white tracking-tight leading-tight max-w-2xl mx-auto"
                    style={{ fontSize: "clamp(1.35rem, 2.4vw, 1.9rem)" }}>
                    {title || "If you remember only three things…"}
                </h2>
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${items.length !== 4 ? "lg:grid-cols-3" : ""} gap-5`}>
                {items.map((item, i) => {
                    const c = COLS[i % COLS.length];
                    return (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="group relative p-7 rounded-[1.75rem] border overflow-hidden transition-all duration-500 hover:scale-[1.02]"
                            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))", borderColor: "rgba(255,255,255,0.06)" }}>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.75rem] pointer-events-none"
                                style={{ background: `linear-gradient(135deg, ${c}08, transparent)` }} />
                            <div className="relative z-10">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 border transition-transform duration-500 group-hover:rotate-6"
                                    style={{ background: `${c}10`, borderColor: `${c}22` }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">{ICONS[i % ICONS.length]}</svg>
                                </div>
                                <div className="font-mono text-[9px] text-white/25 uppercase tracking-widest mb-2">0{i + 1}</div>
                                <h3 className="font-display font-bold text-white mb-2" style={{ fontSize: "0.95rem" }}>{item.title}</h3>
                                <p className="font-body text-[0.88rem] text-white/70 leading-relaxed">{item.body}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            <div className="h-px w-full max-w-4xl mx-auto mt-16"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}20, transparent)` }} />
        </motion.div>
    );
}

// ── Style 2: SPINE — vertical numbered list with connecting line ───────────────
function SpineStyle({ title, items, accent }: { title: string; items: Array<{ title: string; body: string }>; accent: string }) {
    return (
        <motion.div className="mt-10 mb-20"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="flex items-center gap-4 mb-10">
                <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${accent}35)` }} />
                <div className="font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: `${accent}80` }}>
                    {title || "Key Takeaways"}
                </div>
                <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${accent}35, transparent)` }} />
            </div>

            <div className="max-w-3xl mx-auto relative">
                {/* Spine line */}
                <div className="absolute top-0 bottom-0 left-5 w-px" style={{ background: `linear-gradient(180deg, ${accent}40, ${accent}15, transparent)` }} />

                {items.map((item, i) => (
                    <motion.div key={i}
                        initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        className="relative flex gap-6 pb-8 last:pb-0">
                        {/* Node */}
                        <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: `${accent}12`, border: `1px solid ${accent}40`, boxShadow: `0 0 14px ${accent}18` }}>
                            <span className="font-mono font-bold text-[11px]" style={{ color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                        </div>
                        {/* Content */}
                        <div className="flex-1 pt-1.5 pb-1">
                            <h3 className="font-display font-bold text-white mb-1.5" style={{ fontSize: "1rem" }}>{item.title}</h3>
                            <p className="font-body text-[0.9rem] text-[#a8a8c0] leading-relaxed">{item.body}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="h-px w-full max-w-3xl mx-auto mt-10"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}20, transparent)` }} />
        </motion.div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function RecapSlide(props: RecapBlock & { lessonIndex?: number }) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || "#00FFB3";
    const title  = props.title || "What you should take from this lesson";
    const mode   = (props.lessonIndex ?? 0) % 3;

    // Normalise: items[] (new format with title+body) or points[] (string array)
    let items: Array<{ title: string; body: string }> = [];
    if (Array.isArray((props as any).items) && (props as any).items.length > 0) {
        items = (props as any).items;
    } else if (Array.isArray(props.points) && props.points.length > 0) {
        items = props.points.map((p, i) => {
            if (typeof p === "object" && p !== null) return p as any;
            return { title: `Point ${i + 1}`, body: String(p) };
        });
    }

    if (mode === 2) return <SpineStyle title={title} items={items} accent={accent} />;
    if (mode === 1) return <BentoStyle title={title} items={items} accent={accent} />;
    return <BoxStyle title={title} items={items} accent={accent} />;
}
