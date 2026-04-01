"use client";

import { motion } from "framer-motion";
import { useCourseDNA } from "../course-dna-provider";

function HookQuestion({ content, accent }: { content: string; accent: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            data-analytics-tag="hook"
            className="relative mb-6 rounded-2xl p-8 border"
            style={{ borderColor: `${accent}30`, background: `color-mix(in srgb, ${accent} 4%, #0f0f18)` }}
        >
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }} />
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] mb-4"
                style={{ color: `${accent}70` }}>Before we begin</p>
            <p className="font-display text-[1.35rem] font-bold text-white leading-snug">{content}</p>
        </motion.div>
    );
}

function HookImpact({ content, hook_style, accent }: { content: string; hook_style: string; accent: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            data-analytics-tag="hook"
            className="relative mb-6 rounded-2xl overflow-hidden"
            style={{ background: `color-mix(in srgb, ${accent} 6%, #0e0e1a)` }}
        >
            <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                style={{ background: `radial-gradient(circle at 100% 0%, ${accent}10, transparent 65%)` }} />
            <div className="relative p-8">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] mb-4"
                    style={{ color: `${accent}70` }}>{hook_style}</p>
                <p className="font-display text-[1.4rem] font-bold text-white leading-snug">{content}</p>
            </div>
        </motion.div>
    );
}

function HookContradiction({ content, accent }: { content: string; accent: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            data-analytics-tag="hook"
            className="flex gap-5 mb-6 p-7 rounded-2xl border border-white/[0.06]"
        >
            <div className="w-1 rounded-full shrink-0 self-stretch"
                style={{ background: `linear-gradient(180deg, ${accent}, ${accent}30)` }} />
            <div>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] mb-3"
                    style={{ color: `${accent}70` }}>Consider this</p>
                <p className="font-display text-[1.3rem] font-bold text-white leading-snug">{content}</p>
            </div>
        </motion.div>
    );
}

export function Hook({ content, hook_style, lessonIndex }: any) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || '#00FFB3';
    const mode = (lessonIndex ?? 0) % 3;

    if (hook_style === 'contradiction') return <HookContradiction content={content} accent={accent} />;
    if (mode === 1 || hook_style === 'statistic' || hook_style === 'scenario') {
        return <HookImpact content={content} hook_style={hook_style} accent={accent} />;
    }
    return <HookQuestion content={content} accent={accent} />;
}
