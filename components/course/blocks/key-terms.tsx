"use client";

import { KeyTermsBlock } from "@/lib/types/lesson-blocks";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCourseDNA } from "../course-dna-provider";

const TERM_ACCENTS = ["#00FFB3", "#9B8FFF", "#FFB347", "#FF6B6B"];

function normaliseTerm(t: any): { term: string; definition: string } {
    if (typeof t === "string") return { term: t, definition: "Key concept explored in this lesson." };
    return { term: t.term || String(t), definition: t.definition || "Key concept explored in this lesson." };
}

// Mode 0 — Accordion grid (refined original)
function KTAccordion({ terms, accent }: { terms: any[]; accent: string }) {
    const [openTerms, setOpenTerms] = useState<Record<number, boolean>>({});
    const toggle = (i: number) => setOpenTerms(p => ({ ...p, [i]: !p[i] }));

    return (
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="mb-20 mt-12">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-lg font-black text-white flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
                    Term Glossary
                </h3>
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">{terms.length} verified concepts</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {terms.map((t, idx) => {
                    const item = normaliseTerm(t);
                    const isOpen = openTerms[idx];
                    return (
                        <motion.div key={idx} initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }} transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className="group relative">
                            <button onClick={() => toggle(idx)}
                                className="w-full relative z-10 p-6 rounded-2xl bg-[#141422]/50 border border-white/5 text-left transition-all duration-300 hover:bg-[#1E1E35]"
                                style={{ ['--hover-border' as string]: `${accent}20` }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = `${accent}20`)}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-display text-sm font-bold text-white transition-colors"
                                        style={{ color: isOpen ? accent : "white" }}>
                                        {item.term}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                        style={{ color: isOpen ? accent : "rgba(255,255,255,0.2)" }} />
                                </div>
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                            animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                                            className="overflow-hidden">
                                            <p className="font-body text-[13px] text-white/50 leading-relaxed border-l-2 pl-4 py-1"
                                                style={{ borderLeftColor: `${accent}30` }}>
                                                {item.definition}
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

// Mode 1 — Index / dictionary: all definitions visible, no accordion
function KTIndex({ terms, accent }: { terms: any[]; accent: string }) {
    return (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="mb-20 mt-12">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}25)` }} />
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.25em]" style={{ color: `${accent}70` }}>
                    Glossary — {terms.length} terms
                </span>
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accent}25, transparent)` }} />
            </div>
            <div className="space-y-0 border rounded-2xl overflow-hidden"
                style={{ borderColor: `${accent}15`, background: "#0c0c1a" }}>
                {terms.map((t, idx) => {
                    const item = normaliseTerm(t);
                    const c = TERM_ACCENTS[idx % TERM_ACCENTS.length];
                    return (
                        <motion.div key={idx} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }} transition={{ delay: idx * 0.04, duration: 0.4 }}
                            className="flex gap-0 border-b last:border-b-0"
                            style={{ borderColor: `${accent}10` }}>
                            {/* Term column */}
                            <div className="flex-shrink-0 w-48 p-4 border-r flex items-start gap-3"
                                style={{ borderColor: `${accent}10`, background: `${c}04` }}>
                                <span className="font-mono text-[0.5rem] font-bold pt-0.5" style={{ color: `${c}50` }}>
                                    {String(idx + 1).padStart(2, "0")}
                                </span>
                                <span className="font-display text-[0.85rem] font-bold leading-snug" style={{ color: c }}>
                                    {item.term}
                                </span>
                            </div>
                            {/* Definition column */}
                            <div className="flex-1 p-4">
                                <p className="font-body text-[0.85rem] text-white/55 leading-relaxed">{item.definition}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}

// Mode 2 — Chip select: click a chip to reveal definition in a spotlight panel
function KTChips({ terms, accent }: { terms: any[]; accent: string }) {
    const [active, setActive] = useState<number | null>(null);
    const items = terms.map(normaliseTerm);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.65 }}
            className="mb-20 mt-12">
            <div className="flex items-center gap-3 mb-6">
                <motion.div className="w-2 h-2 rounded-full" style={{ background: accent }}
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em]" style={{ color: `${accent}70` }}>
                    Key Terms — tap to reveal
                </span>
            </div>

            {/* Chip cloud */}
            <div className="flex flex-wrap gap-2.5 mb-6">
                {items.map((item, idx) => {
                    const c = TERM_ACCENTS[idx % TERM_ACCENTS.length];
                    const isActive = active === idx;
                    return (
                        <motion.button key={idx}
                            onClick={() => setActive(isActive ? null : idx)}
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            className="px-4 py-2 rounded-full font-display text-[0.82rem] font-bold transition-all duration-200"
                            style={{
                                background: isActive ? `${c}20` : "rgba(255,255,255,0.04)",
                                border: `1px solid ${isActive ? c + "50" : "rgba(255,255,255,0.07)"}`,
                                color: isActive ? c : "rgba(255,255,255,0.55)",
                                boxShadow: isActive ? `0 0 16px ${c}20` : "none",
                            }}>
                            {item.term}
                        </motion.button>
                    );
                })}
            </div>

            {/* Spotlight definition panel */}
            <AnimatePresence mode="wait">
                {active !== null && (
                    <motion.div key={active}
                        initial={{ opacity: 0, y: 8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.99 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="relative rounded-2xl p-6 overflow-hidden"
                        style={{
                            background: `${TERM_ACCENTS[active % 4]}08`,
                            border: `1px solid ${TERM_ACCENTS[active % 4]}25`,
                        }}>
                        <div className="absolute top-0 left-0 right-0 h-px"
                            style={{ background: `linear-gradient(90deg, transparent, ${TERM_ACCENTS[active % 4]}50, transparent)` }} />
                        <div className="font-display font-black mb-2" style={{ color: TERM_ACCENTS[active % 4], fontSize: "1rem" }}>
                            {items[active].term}
                        </div>
                        <p className="font-body text-[0.9rem] text-white/60 leading-relaxed">{items[active].definition}</p>
                        <div className="absolute bottom-3 right-4 font-mono text-[0.5rem] uppercase tracking-widest text-white/15">
                            {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                        </div>
                    </motion.div>
                )}
                {active === null && (
                    <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="rounded-2xl p-5 text-center"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
                        <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/20">
                            Select a term to view its definition
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function KeyTerms({ terms, lessonIndex }: KeyTermsBlock & { lessonIndex?: number }) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || "#00FFB3";
    const mode = (lessonIndex ?? 0) % 3;

    if (!terms || terms.length === 0) return null;

    if (mode === 1) return <KTIndex terms={terms} accent={accent} />;
    if (mode === 2) return <KTChips terms={terms} accent={accent} />;
    return <KTAccordion terms={terms} accent={accent} />;
}
