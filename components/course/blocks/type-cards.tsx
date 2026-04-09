"use client";

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useCourseDNA } from "../course-dna-provider";

const ACCENT: Record<string, string> = {
    pulse: "#00FFB3",
    iris:  "#9B8FFF",
    amber: "#FFB347",
    nova:  "#FF6B6B",
};

const ICONS: Record<string, string> = {
    pulse: "◈", iris: "◇", amber: "△", nova: "○",
};

const COLOUR_CYCLE = ["#00FFB3", "#9B8FFF", "#FFB347", "#FF6B6B", "#9B8FFF", "#00FFB3"];

interface Card {
    title: string;
    description?: string;
    desc?: string;
    body?: string;
    badge?: string;
    badgeColour?: string;
    icon?: string;
    chartType?: string;
    featured?: boolean;
    stats?: string[];
    text?: string;
    content?: string;
}

// ── Mini sparkline ────────────────────────────────────────────────────────────
function SparkCurve({ colour = "#00FFB3" }: { colour?: string }) {
    return (
        <svg viewBox="0 0 200 80" fill="none" className="w-full mt-3" style={{ display: "block", opacity: 0.9 }} aria-hidden="true">
            {[20, 40, 60].map(y => (
                <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            <motion.path
                d="M 0,72 C 30,70 50,55 80,36 S 140,12 200,8 L 200,80 L 0,80 Z"
                fill={colour} fillOpacity="0.08"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.6 }}
            />
            <motion.path
                d="M 0,72 C 30,70 50,55 80,36 S 140,12 200,8"
                stroke={colour} strokeWidth="2" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.circle cx="200" cy="8" r="4" fill={colour}
                initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                transition={{ delay: 1.8, duration: 0.3 }}
            />
        </svg>
    );
}

// ── Layout: BENTO (default — featured first card spans 2 cols) ────────────────
function BentoCard({ card, idx, accent, items }: { card: Card; idx: number; accent: string; items: Card[] }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const isFeatured = idx === 0;
                    const body = card.description || card.desc || card.body || card.text || card.content || "";
    const imageUrl = (card as any).imageUrl || (card as any).image_url || (card as any).url;

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const el = cardRef.current; const glow = glowRef.current;
        if (!el || !glow) return;
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        glow.style.background = `radial-gradient(380px circle at ${x}% ${y}%, ${accent}14, transparent 65%)`;
        glow.style.opacity = "1";
    }, [accent]);

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.55, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={isFeatured ? "bento-featured" : ""}
            style={{
                background: "rgba(255,255,255,0.025)",
                border: `1px solid rgba(255,255,255,0.06)`,
                borderRadius: "16px",
                padding: isFeatured ? "1.6rem" : "1.25rem",
                position: "relative", overflow: "hidden", cursor: "default",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { if (glowRef.current) glowRef.current.style.opacity = "0"; }}
            onHoverStart={() => { if (cardRef.current) cardRef.current.style.borderColor = `${accent}30`; }}
            onHoverEnd={() => { if (cardRef.current) cardRef.current.style.borderColor = "rgba(255,255,255,0.06)"; }}
        >
            <div ref={glowRef} className="absolute inset-0 pointer-events-none rounded-[16px]" style={{ opacity: 0, transition: "opacity 0.25s ease" }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accent}80, transparent 60%)` }} />
            <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none" style={{ background: `radial-gradient(circle at 0% 0%, ${accent}08, transparent 70%)` }} />
            {card.badge && (
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border mb-3 inline-block"
                    style={{ color: accent, borderColor: `${accent}30`, background: `${accent}10` }}>
                    {card.badge}
                </span>
            )}
            {imageUrl && (
                <div className="relative w-full aspect-video mb-4 overflow-hidden rounded-lg">
                    <img
                        src={imageUrl}
                        alt={card.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
            )}
            <div className="flex items-start gap-3 mb-3">
                <span className="text-lg mt-0.5 shrink-0 leading-none" style={{ color: accent }}>
                    {card.icon || ICONS[card.badgeColour ?? ""] || "◈"}
                </span>
                <h3 className="font-display font-bold text-white leading-snug"
                    style={{ fontSize: isFeatured ? "1.15rem" : "0.95rem", letterSpacing: "-0.01em" }}>
                    {card.title}
                </h3>
            </div>
            {body && <p className="font-body leading-relaxed" style={{ fontSize: isFeatured ? "1rem" : "0.9rem", color: "#8A8AB0", lineHeight: 1.7 }}>{body}</p>}
            {(card.chartType === "curve" || (isFeatured && items.length > 3)) && <SparkCurve colour={accent} />}
        </motion.div>
    );
}

function BentoLayout({ items, heading, accent }: { items: Card[]; heading?: string; accent: string }) {
    return (
        <>
            {heading && <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/20 mb-6 text-center">{heading}</p>}
            <div className="bento-grid">
                {items.map((card, idx) => {
                    const cardAccent = ACCENT[card.badgeColour ?? ""] ?? COLOUR_CYCLE[idx % COLOUR_CYCLE.length];
                    return <BentoCard key={idx} idx={idx} accent={cardAccent} card={card} items={items} />;
                })}
            </div>
            <style>{`
                .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
                .bento-featured { grid-column: span 2; }
                @media (max-width: 700px) { .bento-grid { grid-template-columns: 1fr; } .bento-featured { grid-column: span 1; } }
                @media (max-width: 900px) and (min-width: 701px) { .bento-grid { grid-template-columns: 1fr 1fr; } .bento-featured { grid-column: span 2; } }
            `}</style>
        </>
    );
}

// ── Layout: GRID (equal cards, no featured) ───────────────────────────────────
function GridLayout({ items, heading, accent }: { items: Card[]; heading?: string; accent: string }) {
    const cols = items.length === 2 ? 2 : items.length >= 4 ? 4 : 3;
    return (
        <>
            {heading && <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/20 mb-6 text-center">{heading}</p>}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "0.75rem" }}
                className="sm:grid-cols-2">
                {items.map((card, idx) => {
                    const cardAccent = ACCENT[card.badgeColour ?? ""] ?? COLOUR_CYCLE[idx % COLOUR_CYCLE.length];
                    const body = card.description || card.desc || card.body || card.text || card.content || "";
                    const imageUrl = (card as any).imageUrl || (card as any).image_url || (card as any).url;
                    return (
                        <motion.div key={idx}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-20px" }}
                            transition={{ duration: 0.5, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
                            className="group"
                            style={{
                                background: "rgba(255,255,255,0.02)",
                                border: `1px solid rgba(255,255,255,0.07)`,
                                borderTop: `2px solid ${cardAccent}`,
                                borderRadius: "12px",
                                padding: "1.2rem",
                                position: "relative",
                            }}
                        >
                            {imageUrl && (
                                <div className="mb-3 overflow-hidden rounded-lg aspect-video">
                                    <img 
                                        src={imageUrl} 
                                        alt={card.title} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                            )}
                            {card.badge && (
                                <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded mb-2.5 inline-block"
                                    style={{ color: cardAccent, background: `${cardAccent}12` }}>
                                    {card.badge}
                                </span>
                            )}
                            <h3 className="font-display font-bold text-white mb-2 leading-snug" style={{ fontSize: "0.92rem" }}>
                                {card.title}
                            </h3>
                            {body && <p className="font-body text-[0.88rem] text-[#8A8AB0] leading-relaxed">{body}</p>}
                        </motion.div>
                    );
                })}
            </div>
        </>
    );
}

// ── Layout: HORIZONTAL (full-width rows with left accent bar) ─────────────────
function HorizontalLayout({ items, heading, accent }: { items: Card[]; heading?: string; accent: string }) {
    return (
        <>
            {heading && (
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/20 mb-6">{heading}</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {items.map((card, idx) => {
                    const cardAccent = ACCENT[card.badgeColour ?? ""] ?? COLOUR_CYCLE[idx % COLOUR_CYCLE.length];
                    const body = card.description || card.desc || card.body || card.text || card.content || "";
                    const imageUrl = (card as any).imageUrl || (card as any).image_url || (card as any).url;
                    return (
                        <motion.div key={idx}
                            initial={{ opacity: 0, x: -14 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-10px" }}
                            transition={{ duration: 0.45, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
                            className="group"
                            style={{
                                display: "flex", gap: "1.1rem", alignItems: "flex-start",
                                padding: "1rem 1.2rem",
                                background: "rgba(255,255,255,0.02)",
                                border: `1px solid rgba(255,255,255,0.06)`,
                                borderLeft: `3px solid ${cardAccent}`,
                                borderRadius: "0 12px 12px 0",
                            }}
                        >
                            {imageUrl && (
                                <div className="hidden sm:block shrink-0 w-28 h-20 overflow-hidden rounded-md">
                                    <img 
                                        src={imageUrl} 
                                        alt={card.title} 
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                </div>
                            )}
                            {/* Index pill */}
                            <span className="font-mono shrink-0 mt-0.5"
                                style={{ color: cardAccent, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", opacity: 0.7 }}>
                                {String(idx + 1).padStart(2, "0")}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: body ? "0.3rem" : 0 }}>
                                    <h3 className="font-display font-bold text-white" style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
                                        {card.title}
                                    </h3>
                                    {card.badge && (
                                        <span className="font-mono text-[0.58rem] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded"
                                            style={{ color: cardAccent, background: `${cardAccent}12`, whiteSpace: "nowrap" }}>
                                            {card.badge}
                                        </span>
                                    )}
                                </div>
                                {body && <p className="font-body text-[0.9rem] text-[#8A8AB0] leading-relaxed">{body}</p>}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </>
    );
}

// ── Layout: NUMBERED (large number accent, card style) ───────────────────────
function NumberedLayout({ items, heading, accent }: { items: Card[]; heading?: string; accent: string }) {
    return (
        <>
            {heading && (
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/20 mb-6">{heading}</p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
                {items.map((card, idx) => {
                    const cardAccent = ACCENT[card.badgeColour ?? ""] ?? COLOUR_CYCLE[idx % COLOUR_CYCLE.length];
                    const body = card.description || card.desc || card.body || "";
                    const imageUrl = (card as any).imageUrl || (card as any).image_url || (card as any).url;
                    return (
                        <motion.div key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-20px" }}
                            transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            className="group"
                            style={{
                                background: "rgba(255,255,255,0.025)",
                                border: `1px solid rgba(255,255,255,0.06)`,
                                borderRadius: "14px",
                                padding: "1.4rem",
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            {imageUrl && (
                                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                            {/* Large number watermark */}
                            <div className="font-mono font-bold absolute top-2 right-3 pointer-events-none select-none"
                                style={{ fontSize: "3.5rem", color: `${cardAccent}10`, lineHeight: 1, letterSpacing: "-0.04em" }}>
                                {String(idx + 1).padStart(2, "0")}
                            </div>
                            {/* Foreground number */}
                            <div className="font-mono font-bold mb-3"
                                style={{ fontSize: "1.15rem", color: cardAccent, letterSpacing: "-0.02em" }}>
                                {String(idx + 1).padStart(2, "0")}
                            </div>
                            {card.badge && (
                                <span className="font-mono text-[0.6rem] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded mb-2 inline-block"
                                    style={{ color: cardAccent, background: `${cardAccent}12` }}>
                                    {card.badge}
                                </span>
                            )}
                            <h3 className="font-display font-bold text-white mb-2 leading-snug" style={{ fontSize: "0.95rem" }}>
                                {card.title}
                            </h3>
                            {body && <p className="font-body text-[0.88rem] text-[#8A8AB0] leading-relaxed">{body}</p>}
                        </motion.div>
                    );
                })}
            </div>
        </>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function TypeCards({ cards, heading, layout }: any) {
    const { primary_colour } = useCourseDNA();
    const items: Card[] = cards || [];
    if (!items.length) return null;

    const resolvedLayout: string = layout || "bento";

    return (
        <div className="py-4">
            {resolvedLayout === "grid"       && <GridLayout       items={items} heading={heading} accent={primary_colour} />}
            {resolvedLayout === "horizontal" && <HorizontalLayout  items={items} heading={heading} accent={primary_colour} />}
            {resolvedLayout === "numbered"   && <NumberedLayout    items={items} heading={heading} accent={primary_colour} />}
            {resolvedLayout === "bento"      && <BentoLayout       items={items} heading={heading} accent={primary_colour} />}
        </div>
    );
}
