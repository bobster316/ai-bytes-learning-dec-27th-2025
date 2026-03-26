"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { useCourseDNA } from "../course-dna-provider";

export function ObjectiveCard({ label, title, text, body, paragraphs }: any) {
    const { primary_colour } = useCourseDNA();
    const finalLabel = label || title || "Learning Objective";
    const rawText = text || body || (Array.isArray(paragraphs) ? paragraphs.join(" ") : paragraphs) || "";
    const finalText = rawText
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,     '<em>$1</em>');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative p-7 md:p-8 rounded-2xl bg-[#0D0D1A] border border-transparent bg-clip-padding overflow-hidden cursor-default"
        >
            {/* Gradient border — uses lesson accent */}
            <div className="absolute inset-0 rounded-2xl z-[-1] opacity-40 m-[-1px]"
                style={{ background: `linear-gradient(135deg, ${primary_colour}, #4b98ad, ${primary_colour}30)` }} />

            {/* Animated scan line */}
            <motion.div
                initial={{ y: "-100%", opacity: 0 }}
                whileInView={{ y: "200%", opacity: [0, 0.4, 0] }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 1.2, ease: "easeInOut" }}
                className="absolute left-0 right-0 h-px pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${primary_colour}, transparent)` }}
            />

            {/* Ambient corner glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none"
                style={{ background: `${primary_colour}08` }} />

            {/* Header row */}
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="flex items-center gap-2.5 mb-4"
            >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${primary_colour}12`, border: `1px solid ${primary_colour}25` }}>
                    <Target className="w-3.5 h-3.5" style={{ color: primary_colour }} />
                </div>
                <span className="font-mono text-[12px] font-medium uppercase tracking-[0.18em]"
                    style={{ color: primary_colour }}>
                    {finalLabel}
                </span>
            </motion.div>

            {/* Body text */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.55 }}
                className="font-body text-[19px] text-[#C8C8E0] leading-relaxed [&_strong]:text-[#F0F0FF] [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: finalText }}
            />
        </motion.div>
    );
}
