"use client";

import { motion } from "framer-motion";

const COLOUR_MAP: Record<string, string> = {
    pulse: "#00FFB3",
    iris:  "#4b98ad",
    amber: "#FFB347",
    nova:  "#FF6B6B",
};

export function ImageTextRow({
    imagePrompt, imageUrl, image_url, url,
    imageAlt, alt_text, alt,
    label, title, text, body,
    reverse, colour, step, stepTotal, example,
}: any) {
    const finalImageUrl = imageUrl || image_url || url;
    const finalText = text || body || "";
    const finalAlt = imageAlt || alt_text || alt || title;
    const accent = COLOUR_MAP[colour] ?? "#4b98ad";

    const hasImage = !!finalImageUrl;

    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16"
        >
            <div className={`flex flex-col md:flex-row gap-10 items-start ${reverse ? "md:flex-row-reverse" : ""}`}>

                {/* ── Image column — only shown when image exists ── */}
                {hasImage && (
                <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full md:w-[48%] rounded-2xl overflow-hidden shadow-sm shrink-0 relative"
                    style={{
                        minHeight: "340px",
                        background: "#141422",
                        boxShadow: `0 0 40px ${accent}08`,
                    }}
                >
                    <img
                        src={finalImageUrl}
                        alt={finalAlt}
                        className="w-full h-full object-contain absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10]/60 via-transparent to-transparent pointer-events-none" />
                </motion.div>
                )}

                {/* ── Content column ── */}
                <motion.div
                    initial={{ opacity: 0, x: reverse ? 16 : -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className={hasImage ? "w-full md:w-[52%]" : "w-full"}
                >
                    {/* Step tag */}
                    {(label || step) && (
                        <div className="flex items-center gap-3 mb-4">
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: accent, boxShadow: `0 0 8px ${accent}60` }}
                            />
                            {label && (
                                <span
                                    className="font-mono text-[0.65rem] uppercase tracking-[0.15em]"
                                    style={{ color: accent }}
                                >
                                    {label}
                                </span>
                            )}
                            {step && stepTotal && (
                                <span className="font-mono text-[0.6rem] text-white/30">
                                    — Step {step} of {stepTotal}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Title — with optional **emphasis** two-tone rendering */}
                    <h3
                        className="font-display font-bold text-white leading-tight tracking-tight mb-5"
                        style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", letterSpacing: "-0.02em" }}
                    >
                        {title?.includes("**")
                            ? title.split(/(\*\*.*?\*\*)/g).map((part: string, i: number) =>
                                part.startsWith("**") && part.endsWith("**")
                                    ? <em key={i} style={{ fontStyle: "italic", color: accent, fontWeight: 300 }} className="font-body not-italic">{part.slice(2,-2)}</em>
                                    : <span key={i}>{part}</span>
                              )
                            : title
                        }
                    </h3>

                    {/* Body */}
                    {finalText && (
                        <div
                            className="font-body text-[1.05rem] text-[#d0d0e4] leading-[1.9] [&_strong]:text-white [&_strong]:font-semibold"
                            dangerouslySetInnerHTML={{ __html: finalText }}
                        />
                    )}

                    {/* Example / quote box */}
                    {example && (
                        <div
                            className="mt-6 pl-4 pr-4 py-3 rounded-r-xl font-mono text-[0.9rem] leading-[1.7]"
                            style={{
                                borderLeft: `2px solid ${accent}`,
                                background: `${accent}0d`,
                                color: accent,
                            }}
                        >
                            {example}
                        </div>
                    )}
                </motion.div>
            </div>

            <style>{`@keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }`}</style>
        </motion.div>
    );
}
