"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CompletionCard({ title, subtitle, skillsEarned, skills, nextLessonAction, nextTopicAction }: any) {
    let finalSkills = skillsEarned || [];
    if (finalSkills.length === 0 && Array.isArray(skills)) {
        finalSkills = skills.map((s: any) => typeof s === "string" ? { label: s, colour: "pulse" } : { label: s.label || s.skill || s.text || String(s), colour: s.colour || "pulse" });
    }
    const displaySkills = finalSkills.slice(0, 3);
    const finalNextAction = nextLessonAction || nextTopicAction;

    const SKILL_ACCENTS = ["#00FFB3", "#4b98ad", "#FFB347"];

    return (
        <div className="relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 50% 40% at 50% 70%, rgba(0,255,179,0.06) 0%, transparent 70%)" }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative text-center py-20 px-8 max-w-lg mx-auto"
            >
                {/* Section label */}
                <div className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-white/20 mb-10">
                    Lesson complete
                </div>

                {/* Title */}
                <h2 className="font-display font-black text-white leading-[0.95] tracking-tight mb-8"
                    style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", letterSpacing: "-0.03em" }}>
                    {title || "You've finished this lesson."}
                </h2>

                {/* Thin divider */}
                <div className="h-px w-16 mx-auto mb-8"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,179,0.4), transparent)" }} />

                {/* Skills — clean 3-line list */}
                {displaySkills.length > 0 && (
                    <div className="mb-10 text-left inline-block">
                        {displaySkills.map((skill: any, idx: number) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 + idx * 0.1, duration: 0.4 }}
                                className="flex items-center gap-3 mb-3"
                            >
                                <div className="w-[3px] h-4 rounded-full shrink-0"
                                    style={{ background: SKILL_ACCENTS[idx % 3] }} />
                                <span className="font-body text-[#c8c8dc]" style={{ fontSize: "0.95rem" }}>
                                    {skill.label || skill}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <div className="mt-2">
                    {finalNextAction ? (
                        <motion.button
                            whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,255,179,0.2)" }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl font-display font-black text-[0.85rem] cursor-pointer border-none"
                            style={{ background: "#00FFB3", color: "#080810", transition: "box-shadow 0.3s ease, transform 0.2s ease" }}
                        >
                            {finalNextAction}
                            <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/15 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-white/50">
                            Continue to the next lesson
                            <ArrowRight className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
