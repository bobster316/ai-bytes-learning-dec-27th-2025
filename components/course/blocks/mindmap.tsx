"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MindmapBlock } from "@/lib/types/lesson-blocks";

const COLOUR_MAP: Record<string, string> = {
    pulse: "#00FFB3",
    iris:  "#4b98ad",
    amber: "#FFB347",
    nova:  "#FF6B6B",
};
const COLOUR_CYCLE = ["#00FFB3", "#4b98ad", "#FFB347", "#FF6B6B", "#4b98ad", "#00FFB3"];

// Layout constants
const CARD_W  = 188;
const CARD_H  = 74;
const CTR_W   = 200;
const CTR_H   = 54;
const ORBIT_R = 228;

/** Where a line from (fromX, fromY) exits the rectangle centred at (toX, toY) with half-dims (hw, hh) */
function rectEdge(fromX: number, fromY: number, toX: number, toY: number, hw: number, hh: number) {
    const dx = fromX - toX;
    const dy = fromY - toY;
    if (dx === 0 && dy === 0) return { x: toX, y: toY };
    const tX = Math.abs(dx) > 0 ? hw / Math.abs(dx) : Infinity;
    const tY = Math.abs(dy) > 0 ? hh / Math.abs(dy) : Infinity;
    const t  = Math.min(tX, tY);
    return { x: toX + dx * t, y: toY + dy * t };
}

export function Mindmap({ centralNode, branches }: MindmapBlock) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef       = useRef<SVGSVGElement>(null);
    const centerRef    = useRef<HTMLDivElement>(null);
    const nodeRefs     = useRef<(HTMLDivElement | null)[]>([]);
    const [entered, setEntered] = useState(false);

    // Trigger once on scroll-into-view
    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) { setEntered(true); obs.disconnect(); } },
            { threshold: 0.15 }
        );
        if (containerRef.current) obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!entered) return;

        const drawLines = () => {
            const container = containerRef.current;
            const svg       = svgRef.current;
            const center    = centerRef.current;
            if (!container || !svg || !center) return;

            const svgW = container.offsetWidth  || container.getBoundingClientRect().width;
            const svgH = container.offsetHeight || container.getBoundingClientRect().height;
            svg.setAttribute("width",  String(svgW));
            svg.setAttribute("height", String(svgH));
            while (svg.firstChild) svg.removeChild(svg.firstChild);

            const cRect  = container.getBoundingClientRect();
            const ceRect = center.getBoundingClientRect();
            const cx = ceRect.left - cRect.left + ceRect.width  / 2;
            const cy = ceRect.top  - cRect.top  + ceRect.height / 2;

            // ── defs ──────────────────────────────────────────────────────
            const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

            nodeRefs.current.forEach((node, i) => {
                if (!node) return;
                const colour = COLOUR_MAP[branches[i]?.colour] ?? COLOUR_CYCLE[i % COLOUR_CYCLE.length];

                // Gradient along each line
                const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
                grad.setAttribute("id", `mmg-${i}`);
                grad.setAttribute("gradientUnits", "userSpaceOnUse");
                const s1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                s1.setAttribute("offset", "0%");   s1.setAttribute("stop-color", "#4b98ad"); s1.setAttribute("stop-opacity", "0.45");
                const s2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                s2.setAttribute("offset", "100%"); s2.setAttribute("stop-color", colour);    s2.setAttribute("stop-opacity", "0.75");
                grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad);

                // Glow filter for data packet
                const filt = document.createElementNS("http://www.w3.org/2000/svg", "filter");
                filt.setAttribute("id",     `mmf-${i}`);
                filt.setAttribute("x",      "-150%");
                filt.setAttribute("y",      "-150%");
                filt.setAttribute("width",  "400%");
                filt.setAttribute("height", "400%");
                const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
                blur.setAttribute("stdDeviation", "3.5");
                blur.setAttribute("in", "SourceGraphic");
                filt.appendChild(blur); defs.appendChild(filt);
            });
            svg.appendChild(defs);

            // ── lines + packets ───────────────────────────────────────────
            nodeRefs.current.forEach((node, i) => {
                if (!node) return;
                const nRect  = node.getBoundingClientRect();
                const nx = nRect.left - cRect.left + nRect.width  / 2;
                const ny = nRect.top  - cRect.top  + nRect.height / 2;
                const colour = COLOUR_MAP[branches[i]?.colour] ?? COLOUR_CYCLE[i % COLOUR_CYCLE.length];

                // Edge points (so line starts/ends just outside each pill)
                const start = rectEdge(nx, ny, cx, cy, CTR_W / 2 + 5, CTR_H / 2 + 5);
                const end   = rectEdge(cx, cy, nx, ny, CARD_W / 2 + 4, CARD_H / 2 + 4);

                // Update gradient coords
                const grad = svg.querySelector(`#mmg-${i}`) as SVGLinearGradientElement | null;
                if (grad) {
                    grad.setAttribute("x1", String(start.x)); grad.setAttribute("y1", String(start.y));
                    grad.setAttribute("x2", String(end.x));   grad.setAttribute("y2", String(end.y));
                }

                // Gentle bezier curve (perpendicular bulge of 15%)
                const midX  = (start.x + end.x) / 2;
                const midY  = (start.y + end.y) / 2;
                const dx    = end.x - start.x;
                const dy    = end.y - start.y;
                const cpx   = midX + (-dy * 0.15);
                const cpy   = midY + ( dx * 0.15);
                const pathD = `M ${start.x} ${start.y} Q ${cpx} ${cpy} ${end.x} ${end.y}`;

                // Connector path
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d",              pathD);
                path.setAttribute("fill",           "none");
                path.setAttribute("stroke",         `url(#mmg-${i})`);
                path.setAttribute("stroke-width",   "1.5");
                path.setAttribute("stroke-linecap", "round");
                svg.appendChild(path);

                const pathLen = path.getTotalLength();
                path.setAttribute("stroke-dasharray",  String(pathLen));
                path.setAttribute("stroke-dashoffset", String(pathLen));

                // Animate draw-in
                setTimeout(() => {
                    path.style.transition = `stroke-dashoffset 0.85s cubic-bezier(0.16,1,0.3,1) ${i * 0.14}s`;
                    path.setAttribute("stroke-dashoffset", "0");
                }, 80);

                // ── Data packet: glowing orb travelling along the path ──
                const packet = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                packet.setAttribute("r",      "3.5");
                packet.setAttribute("fill",   colour);
                packet.setAttribute("filter", `url(#mmf-${i})`);
                packet.setAttribute("opacity", "0");
                svg.appendChild(packet);

                // Start packet after line finishes drawing
                const packetDelay    = 950 + i * 145;
                const packetDuration = 820;

                let rafId: number;
                let started = false;
                let startTs = 0;

                const tick = (ts: number) => {
                    if (!started) { started = true; startTs = ts; }
                    const elapsed = ts - startTs;
                    const t       = Math.min(elapsed / packetDuration, 1);
                    // Ease in-out quad
                    const eased   = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

                    try {
                        const pt = path.getPointAtLength(eased * pathLen);
                        packet.setAttribute("cx", String(pt.x));
                        packet.setAttribute("cy", String(pt.y));
                        packet.setAttribute("opacity",
                            t < 0.08 ? String(t / 0.08) :
                            t > 0.92 ? String((1 - t) / 0.08) : "1"
                        );
                    } catch { /* path may have been removed during resize */ }

                    if (t < 1) rafId = requestAnimationFrame(tick);
                };

                setTimeout(() => { rafId = requestAnimationFrame(tick); }, packetDelay);
            });
        };

        let resizeObs: ResizeObserver | null = null;
        const timer = setTimeout(() => {
            drawLines();
            resizeObs = new ResizeObserver(drawLines);
            if (containerRef.current) resizeObs.observe(containerRef.current);
        }, 700);

        return () => {
            clearTimeout(timer);
            resizeObs?.disconnect();
        };
    }, [entered, branches]);

    const count     = branches?.length || 0;
    const positions = Array.from({ length: count }, (_, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count;
        return { x: Math.cos(angle), y: Math.sin(angle) };
    });

    const containerW = (ORBIT_R + CARD_W / 2) * 2 + 48;
    const containerH = (ORBIT_R + CARD_H / 2) * 2 + 48;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center overflow-x-auto"
        >
            <div
                ref={containerRef}
                className="relative shrink-0"
                style={{ width: containerW, height: containerH }}
            >
                {/* ── Dot-grid background ──────────────────────────────── */}
                <div
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(rgba(155,143,255,0.18) 1px, transparent 1px)`,
                        backgroundSize: "22px 22px",
                        maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)",
                        WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)",
                    }}
                />

                {/* ── Ambient radial glow ──────────────────────────────── */}
                <div
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{ background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(155,143,255,0.06) 0%, transparent 70%)" }}
                />

                {/* ── SVG layer (connector lines + data packets) ───────── */}
                <svg
                    ref={svgRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 1 }}
                    aria-hidden="true"
                />

                {/* ── Central pill badge ───────────────────────────────── */}
                <div
                    className="absolute"
                    style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 4 }}
                >
                    {/* Pulse rings */}
                    {[0, 1, 2].map((ring) => (
                        <motion.div
                            key={ring}
                            className="absolute pointer-events-none"
                            style={{
                                width:        CTR_W,
                                height:       CTR_H,
                                borderRadius: CTR_H / 2,
                                border:       "1px solid rgba(155,143,255,0.35)",
                                left: 0, top: 0,
                            }}
                            animate={{ scale: [1, 1.6 + ring * 0.35], opacity: [0.45, 0] }}
                            transition={{
                                duration: 2.6,
                                delay:    ring * 0.85,
                                repeat:   Infinity,
                                ease:     "easeOut",
                            }}
                        />
                    ))}

                    {/* Pill */}
                    <motion.div
                        ref={centerRef}
                        initial={{ opacity: 0, scale: 0.75 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            width:        CTR_W,
                            height:       CTR_H,
                            borderRadius: CTR_H / 2,
                            background:   "linear-gradient(135deg, rgba(155,143,255,0.22), rgba(155,143,255,0.06))",
                            border:       "1.5px solid rgba(155,143,255,0.55)",
                            boxShadow:    "0 0 32px rgba(155,143,255,0.22), 0 0 80px rgba(155,143,255,0.07)",
                            display:      "flex",
                            alignItems:   "center",
                            justifyContent: "center",
                            textAlign:    "center",
                            padding:      "0 1.25rem",
                            position:     "relative",
                        }}
                    >
                        <span className="font-display font-bold text-white text-[13px] leading-tight tracking-tight">
                            {centralNode}
                        </span>
                    </motion.div>
                </div>

                {/* ── Branch pill cards ────────────────────────────────── */}
                {branches.map((branch, i) => {
                    const colour = COLOUR_MAP[branch.colour] ?? COLOUR_CYCLE[i % COLOUR_CYCLE.length];
                    const { x, y } = positions[i];
                    const topPx    = containerH / 2 + y * ORBIT_R;

                    return (
                        // Outer div: owns position — plain so Framer can't clobber the transform
                        <div
                            key={i}
                            ref={(el) => { nodeRefs.current[i] = el; }}
                            className="absolute"
                            style={{
                                left:      "50%",
                                top:       topPx,
                                transform: `translate(calc(-50% + ${Math.round(x * ORBIT_R)}px), -50%)`,
                                zIndex:    3,
                            }}
                        >
                            {/* Inner motion.div: owns animation only */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.82, y: 6 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.18 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                    width:     CARD_W,
                                    minHeight: CARD_H,
                                    borderRadius:   "12px",
                                    background:     `linear-gradient(135deg, ${colour}14, ${colour}04)`,
                                    border:         `1px solid ${colour}38`,
                                    boxShadow:      `0 0 24px ${colour}10, inset 0 1px 0 ${colour}20`,
                                    padding:        "0.85rem 1.1rem",
                                    display:        "flex",
                                    flexDirection:  "column",
                                    justifyContent: "center",
                                    gap:            "0.25rem",
                                    position:       "relative",
                                    overflow:       "hidden",
                                }}
                            >
                                {/* Top accent line */}
                                <div style={{
                                    position: "absolute",
                                    top: 0, left: 0, right: 0,
                                    height: "2px",
                                    borderRadius: "12px 12px 0 0",
                                    background: `linear-gradient(90deg, ${colour}cc, transparent 75%)`,
                                }} />

                                <span
                                    className="font-display font-bold leading-tight"
                                    style={{ color: colour, fontSize: "14px" }}
                                >
                                    {branch.label}
                                </span>

                                {branch.description && (
                                    <span
                                        className="font-body leading-snug"
                                        style={{ color: "rgba(200,200,224,0.6)", fontSize: "12px" }}
                                    >
                                        {branch.description}
                                    </span>
                                )}
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
