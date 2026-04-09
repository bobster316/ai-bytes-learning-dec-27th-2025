"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCourseDNA } from "../course-dna-provider";

const SKILL_ACCENTS = ["#00FFB3", "#9B8FFF", "#FFB347", "#FF6B6B"];

function normaliseSkills(skillsEarned: any[], skills: any[]) {
    let s = skillsEarned || [];
    if (!s.length && Array.isArray(skills)) {
        s = skills.map((x: any) =>
            typeof x === "string" ? { label: x, colour: "pulse" }
                : { label: x.label || x.skill || x.text || String(x), colour: x.colour || "pulse" }
        );
    }
    return s.slice(0, 4);
}

function CTAButton({ action, accent, href }: { action?: string; accent: string; href?: string }) {
    if (href) {
        const isCertificate = href.includes('/complete');
        const label = isCertificate ? 'Get Your Certificate' : (action || 'Next Lesson');
        if (isCertificate) {
            return (
                <Link href={href}>
                    <motion.div
                        whileHover={{ y: -2, boxShadow: `0 12px 36px rgba(255,179,71,0.45)` }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-3 px-9 py-4 rounded-2xl font-display font-black text-[1rem] cursor-pointer"
                        style={{
                            background: "linear-gradient(135deg, #FFB347 0%, #FF6B6B 100%)",
                            color: "#0A0A12",
                            boxShadow: "0 6px 24px rgba(255,179,71,0.30)",
                            transition: "box-shadow 0.3s ease",
                        }}>
                        <ArrowRight className="w-5 h-5" />
                        {label}
                    </motion.div>
                </Link>
            );
        }
        return (
            <Link href={href}>
                <motion.div whileHover={{ x: 3, boxShadow: `0 6px 20px ${accent}30` }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl font-display font-black text-[0.85rem] cursor-pointer"
                    style={{ background: accent, color: "#080810", transition: "box-shadow 0.3s ease" }}>
                    {label}<ArrowRight className="w-4 h-4" />
                </motion.div>
            </Link>
        );
    }
    return (
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-white/35">
            Continue<ArrowRight className="w-3 h-3" />
        </div>
    );
}

// Mode 0 — Minimal left-aligned (refined original)
function CCMinimal({ title, summary, closingLine, nextStep, skills, accent, action, href }: any) {
    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse 50% 60% at 10% 90%, ${accent}04, transparent 65%)` }} />
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative py-16 max-w-3xl mx-auto">
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-white/20 mb-8">Lesson complete</div>
                <h2 className="font-display font-black text-white leading-[0.95] tracking-tight mb-5"
                    style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.1rem)", letterSpacing: "-0.035em" }}>
                    {title || "The Pattern Is Now Visible."}
                </h2>
                {summary && <p className="font-body text-white/50 text-[0.9rem] leading-relaxed mb-8 max-w-lg">{summary}</p>}
                <div className="h-px w-10 mb-8" style={{ background: `linear-gradient(90deg, ${accent}30, transparent)` }} />
                {skills.length > 0 && (
                    <div className="mb-8 space-y-3">
                        {skills.map((skill: any, i: number) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
                                className="flex items-start gap-3">
                                <div className="w-[3px] h-4 rounded-full shrink-0 mt-[3px]" style={{ background: SKILL_ACCENTS[i % 4] }} />
                                <span className="font-body text-white/55" style={{ fontSize: "0.875rem" }}>{skill.label || skill}</span>
                            </motion.div>
                        ))}
                    </div>
                )}
                {closingLine && (
                    <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="font-display font-black text-white/80 mb-10"
                        style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.1rem)", letterSpacing: "-0.01em", lineHeight: 1.4 }}>
                        {closingLine}
                    </motion.p>
                )}
                {nextStep && <p className="font-body text-white/28 text-[0.8rem] leading-relaxed mb-6 max-w-md italic">{nextStep}</p>}
                <CTAButton action={action} accent={accent} href={href} />
            </motion.div>
        </div>
    );
}

// Mode 1 — Two-column: skills panel left, title + CTA right
function CCTwoCol({ title, summary, closingLine, nextStep, skills, accent, action, href }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${accent}20`, background: `linear-gradient(135deg, ${accent}05, rgba(255,255,255,0.02))` }}>
            {/* Scan line */}
            <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }}
                animate={{ top: ["-2%", "105%"] }} transition={{ duration: 6, delay: 1, repeat: Infinity, repeatDelay: 10, ease: "linear" }} />

            <div className="grid grid-cols-1 md:grid-cols-5">
                {/* Left — skills */}
                <div className="md:col-span-2 p-8 border-b md:border-b-0 md:border-r" style={{ borderColor: `${accent}15` }}>
                    <div className="font-mono text-[0.58rem] uppercase tracking-[0.22em] mb-6" style={{ color: `${accent}70` }}>
                        Capabilities unlocked
                    </div>
                    <div className="space-y-4">
                        {skills.map((skill: any, i: number) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.1, duration: 0.45 }}
                                className="flex items-start gap-3 p-3 rounded-xl"
                                style={{ background: `${SKILL_ACCENTS[i % 4]}08`, border: `1px solid ${SKILL_ACCENTS[i % 4]}18` }}>
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{ background: `${SKILL_ACCENTS[i % 4]}18`, border: `1px solid ${SKILL_ACCENTS[i % 4]}40` }}>
                                    <span className="font-mono text-[9px] font-bold" style={{ color: SKILL_ACCENTS[i % 4] }}>{i + 1}</span>
                                </div>
                                <span className="font-body text-white/65 text-[0.82rem] leading-snug">{skill.label || skill}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
                {/* Right — title + closing + CTA */}
                <div className="md:col-span-3 p-8 flex flex-col justify-between gap-8">
                    <div>
                        <div className="font-mono text-[0.58rem] uppercase tracking-[0.25em] text-white/20 mb-5">Lesson complete</div>
                        <h2 className="font-display font-black text-white leading-tight tracking-tight mb-4"
                            style={{ fontSize: "clamp(1.5rem, 2.6vw, 2rem)", letterSpacing: "-0.03em" }}>
                            {title || "The Pattern Is Now Visible."}
                        </h2>
                        {summary && <p className="font-body text-white/45 text-[0.88rem] leading-relaxed mb-5 max-w-sm">{summary}</p>}
                        {closingLine && (
                            <p className="font-display font-black text-white/75 text-[0.95rem] leading-[1.45] mb-3"
                                style={{ letterSpacing: "-0.01em" }}>{closingLine}</p>
                        )}
                        {nextStep && <p className="font-body text-white/25 text-[0.78rem] italic leading-relaxed">{nextStep}</p>}
                    </div>
                    <CTAButton action={action} accent={accent} href={href} />
                </div>
            </div>
        </motion.div>
    );
}

// Mode 2 — Terminal readout style
function CCTerminal({ title, summary, closingLine, nextStep, skills, accent, action, href }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#040608", border: `1px solid ${accent}22` }}>
            {/* Terminal title bar */}
            <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: `${accent}15`, background: `${accent}06` }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF6B6B" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFB347" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] ml-2" style={{ color: `${accent}60` }}>
                    lesson_complete.md
                </span>
            </div>
            <div className="p-8">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    transition={{ delay: 0.2 }} className="font-mono text-[0.82rem] space-y-2 mb-8"
                    style={{ color: "rgba(200,215,230,0.75)", lineHeight: 1.7 }}>
                    <div><span style={{ color: `${accent}80` }}>$</span> <span style={{ color: accent }}>status</span> <span style={{ color: "rgba(255,255,255,0.3)" }}>--lesson</span></div>
                    <div style={{ color: accent, paddingLeft: "1.2rem" }}>▸ {title || "The Pattern Is Now Visible."}</div>
                    {summary && <div style={{ color: "rgba(200,215,230,0.55)", paddingLeft: "1.2rem", fontSize: "0.78rem" }}>{summary}</div>}
                </motion.div>

                {skills.length > 0 && (
                    <div className="mb-8 space-y-1.5">
                        <div className="font-mono text-[0.6rem] uppercase tracking-[0.2em] mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>
                            // capabilities_unlocked
                        </div>
                        {skills.map((skill: any, i: number) => (
                            <motion.div key={i} initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                                className="font-mono text-[0.8rem] flex items-start gap-3" style={{ lineHeight: 1.6 }}>
                                <span style={{ color: SKILL_ACCENTS[i % 4], flexShrink: 0 }}>[{String(i + 1).padStart(2, "0")}]</span>
                                <span style={{ color: "rgba(200,215,230,0.7)" }}>{skill.label || skill}</span>
                            </motion.div>
                        ))}
                    </div>
                )}

                {closingLine && (
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        transition={{ delay: 0.6 }} className="rounded-xl px-5 py-4 mb-8 font-mono text-[0.82rem]"
                        style={{ background: `${accent}08`, border: `1px solid ${accent}20`, color: accent, lineHeight: 1.6 }}>
                        <span style={{ opacity: 0.5 }}>&gt; </span>{closingLine}
                    </motion.div>
                )}

                {nextStep && (
                    <p className="font-mono text-[0.72rem] text-white/22 mb-8 leading-relaxed">
                        <span style={{ color: "rgba(255,255,255,0.2)" }}>// next: </span>{nextStep}
                    </p>
                )}
                <CTAButton action={action} accent={accent} href={href} />
            </div>
        </motion.div>
    );
}

export function CompletionCard(props: any) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || "#00FFB3";
    const skills = normaliseSkills(props.skillsEarned || [], props.skills || []);
    const action = props.nextLessonAction || props.nextTopicAction;
    const href = props.nextLessonHref;
    const mode = (props.lessonIndex ?? 0) % 3;

    const shared = { ...props, skills, accent, action, href };
    if (mode === 1) return <CCTwoCol {...shared} />;
    if (mode === 2) return <CCTerminal {...shared} />;
    return <CCMinimal {...shared} />;
}
