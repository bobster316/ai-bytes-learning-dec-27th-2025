"use client";

import { motion } from "framer-motion";
import { useCourseDNA } from "../course-dna-provider";


// ── Markdown helpers ─────────────────────────────────────────────────────────
function processMarkdown(raw: any, extractedKeyTerms: any[]): string {
    if (!raw) return '';
    if (typeof raw !== 'string') return String(raw);
    let result = raw
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g,     "<em>$1</em>");
    if (!extractedKeyTerms?.length) return result;
    extractedKeyTerms.forEach((termObj: any) => {
        if (!termObj?.term) return;
        const escaped = termObj.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const def = termObj.definition?.replace(/"/g, "&quot;") ?? "";
        result = result.replace(
            new RegExp(`\\b(${escaped})\\b`, "gi"),
            `<span class="border-b border-[#00FFB3]/40 text-[#00FFB3] cursor-help" title="${def}">$1</span>`
        );
    });
    return result;
}

function TwoToneHeading({ text, accent }: { text: string; accent: string }) {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return <>
        {parts.map((part, i) =>
            part.startsWith("**") && part.endsWith("**")
                ? <span key={i} style={{ color: accent }}>{part.slice(2, -2)}</span>
                : <span key={i}>{part}</span>
        )}
    </>;
}

// ── Main component ───────────────────────────────────────────────────────────
export function TextSection({ heading, title, sectionLabel, label, paragraphs, body, text, content, extractedKeyTerms }: any) {
    const { primary_colour } = useCourseDNA();

    const finalHeading = heading || title;
    const finalLabel   = sectionLabel || label;
    const hasEmphasis  = finalHeading?.includes("**");

    const allParagraphs: string[] = (paragraphs?.length > 0
        ? paragraphs
        : (body || text || content) ? [body || text || content] : [])
        .filter((p: any) => p != null)
        .map((p: any) => typeof p === 'string' ? p : JSON.stringify(p));

    const [lede, ...rest] = allParagraphs;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* ── Section label ── */}
            {finalLabel && (
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] mb-5 flex items-center gap-3"
                    style={{ color: primary_colour }}>
                    <span className="block w-8 h-px" style={{ background: primary_colour, opacity: 0.5 }} />
                    {finalLabel}
                </div>
            )}

            {/* ── Heading ── */}
            {finalHeading && (
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="font-display font-bold text-white leading-tight tracking-tight mb-8"
                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", letterSpacing: "-0.02em" }}
                >
                    {hasEmphasis ? <TwoToneHeading text={finalHeading} accent={primary_colour} /> : finalHeading}
                </motion.h2>
            )}

            {/* ── Lede paragraph ── */}
            {lede && (
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                    className="font-body text-[1.1rem] text-[#d8d8ec] leading-[1.9] mb-10 [&_strong]:font-semibold [&_strong]:text-white [&_em]:text-[#00FFB3]"
                    dangerouslySetInnerHTML={{ __html: processMarkdown(lede, extractedKeyTerms) }}
                />
            )}

            {/* ── Thin divider ── */}
            {rest.length > 0 && (
                <div className="w-full h-px mb-10" style={{ background: `linear-gradient(90deg, ${primary_colour}30, transparent)` }} />
            )}

            {/* ── Remaining paragraphs — numbered accent blocks ── */}
            {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rest.map((p: string, i: number) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="rounded-xl p-5"
                            style={{
                                background: "rgba(255,255,255,0.025)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderLeft: `3px solid ${primary_colour}`,
                            }}
                        >
                            {/* Number badge */}
                            <div className="font-mono text-[0.6rem] font-bold mb-3 tracking-widest"
                                style={{ color: primary_colour, opacity: 0.6 }}>
                                {String(i + 2).padStart(2, "0")}
                            </div>
                            <p
                                className="font-body text-[1rem] text-[#c0c0d8] leading-[1.85] [&_strong]:font-semibold [&_strong]:text-white [&_em]:text-[#00FFB3]"
                                dangerouslySetInnerHTML={{ __html: processMarkdown(p, extractedKeyTerms) }}
                            />
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
