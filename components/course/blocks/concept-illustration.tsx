"use client";

import { motion } from "framer-motion";
import { ConceptIllustrationBlock } from "@/lib/types/lesson-blocks";

// ── SVG PATTERNS ──────────────────────────────────────────────────────────────

function NetworkSVG() {
    // 4-layer architecture: Input(3) → Hidden1(4) → Hidden2(4) → Output(2)
    const layers = [
        { x: 72,  ys: [80, 168, 256],              colour: "#FFB347", label: "INPUT"    },
        { x: 196, ys: [50, 120, 196, 266],          colour: "#4b98ad", label: "HIDDEN 1" },
        { x: 336, ys: [50, 120, 196, 266],          colour: "#4b98ad", label: "HIDDEN 2" },
        { x: 460, ys: [110, 226],                   colour: "#00FFB3", label: "OUTPUT"   },
    ];

    // All connections between adjacent layers
    const allConns: { x1: number; y1: number; x2: number; y2: number; li: number }[] = [];
    for (let li = 0; li < layers.length - 1; li++) {
        for (const y1 of layers[li].ys) {
            for (const y2 of layers[li + 1].ys) {
                allConns.push({ x1: layers[li].x, y1, x2: layers[li + 1].x, y2, li });
            }
        }
    }

    // Subset of connections that carry animated pulses — evenly spread
    const pulseConns = allConns.filter((_, i) => i % 4 === 0 || i % 7 === 0);

    return (
        <svg viewBox="0 0 532 320" className="w-full h-full">
            <defs>
                <filter id="nn-glow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="nn-soft" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* ── Connection mesh ── */}
            {allConns.map((c, i) => (
                <line key={i}
                    x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                    stroke={layers[c.li].colour}
                    strokeWidth="0.6"
                    strokeOpacity="0.12"
                />
            ))}

            {/* ── Active connections (brighter) ── */}
            {pulseConns.map((c, i) => (
                <line key={`a-${i}`}
                    x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                    stroke={layers[c.li].colour}
                    strokeWidth="0.8"
                    strokeOpacity="0.28"
                />
            ))}

            {/* ── Travelling signal pulses ── */}
            {pulseConns.map((c, i) => {
                const dur = 1.4 + (i % 5) * 0.22;
                const begin = (i * 0.18) % 1.4;
                const col = layers[c.li].colour;
                return (
                    <g key={`p-${i}`} filter="url(#nn-glow)">
                        <circle r="2.8" fill={col} opacity="0.95">
                            <animateMotion
                                dur={`${dur}s`}
                                begin={`${begin}s`}
                                repeatCount="indefinite"
                                path={`M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`}
                            />
                        </circle>
                        {/* trailing glow halo */}
                        <circle r="5" fill={col} opacity="0.25">
                            <animateMotion
                                dur={`${dur}s`}
                                begin={`${begin}s`}
                                repeatCount="indefinite"
                                path={`M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`}
                            />
                        </circle>
                    </g>
                );
            })}

            {/* ── Nodes ── */}
            {layers.map((layer, li) =>
                layer.ys.map((y, ni) => {
                    const pulseDur = 2.2 + ni * 0.35;
                    const pulseBegin = (li * 0.4 + ni * 0.25) % 2;
                    return (
                        <g key={`n-${li}-${ni}`} filter="url(#nn-soft)">
                            {/* Outer breathing ring */}
                            <circle cx={layer.x} cy={y} r="11"
                                fill="none"
                                stroke={layer.colour}
                                strokeWidth="1"
                                strokeOpacity="0.35"
                            >
                                <animate attributeName="r"
                                    values="9;13;9"
                                    dur={`${pulseDur}s`}
                                    begin={`${pulseBegin}s`}
                                    repeatCount="indefinite"
                                    calcMode="spline"
                                    keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                                />
                                <animate attributeName="stroke-opacity"
                                    values="0.35;0.7;0.35"
                                    dur={`${pulseDur}s`}
                                    begin={`${pulseBegin}s`}
                                    repeatCount="indefinite"
                                    calcMode="spline"
                                    keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                                />
                            </circle>
                            {/* Fill disc */}
                            <circle cx={layer.x} cy={y} r="7"
                                fill={layer.colour}
                                fillOpacity="0.18"
                                stroke={layer.colour}
                                strokeWidth="1.2"
                                strokeOpacity="0.6"
                            />
                            {/* Hot core */}
                            <circle cx={layer.x} cy={y} r="2.8"
                                fill={layer.colour}
                                fillOpacity="0.9"
                            />
                        </g>
                    );
                })
            )}

            {/* ── Layer labels ── */}
            {layers.map((layer, li) => (
                <text key={`l-${li}`}
                    x={layer.x} y={302}
                    textAnchor="middle"
                    fill={layer.colour}
                    fillOpacity="0.45"
                    fontSize="7.5"
                    fontFamily="'DM Mono', monospace"
                    fontWeight="700"
                    letterSpacing="0.08em"
                >
                    {layer.label}
                </text>
            ))}

            {/* ── Tick marks below each label ── */}
            {layers.map((layer, li) => (
                <line key={`t-${li}`}
                    x1={layer.x} y1={288} x2={layer.x} y2={293}
                    stroke={layer.colour} strokeOpacity="0.3" strokeWidth="1"
                />
            ))}
        </svg>
    );
}

function LayersSVG() {
    const layers = [
        { label: "Output Layer",   y: 30,  colour: "#00FFB3", nodes: 2 },
        { label: "Hidden Layer 2", y: 110, colour: "#4b98ad", nodes: 4 },
        { label: "Hidden Layer 1", y: 190, colour: "#4b98ad", nodes: 4 },
        { label: "Input Layer",    y: 270, colour: "#FFB347", nodes: 3 },
    ];
    return (
        <svg viewBox="0 0 520 330" className="w-full h-full">
            {layers.map((layer, li) => (
                <g key={li}>
                    {Array.from({ length: layer.nodes }).map((_, ni) => {
                        const spacing = 520 / (layer.nodes + 1);
                        const x = spacing * (ni + 1);
                        if (li < layers.length - 1) {
                            const nextLayer = layers[li + 1];
                            const nextSpacing = 520 / (nextLayer.nodes + 1);
                            return Array.from({ length: nextLayer.nodes }).map((_, nni) => (
                                <line
                                    key={`${ni}-${nni}`}
                                    x1={x} y1={layer.y + 14}
                                    x2={nextSpacing * (nni + 1)} y2={nextLayer.y - 14}
                                    stroke={layer.colour} strokeWidth="0.8" strokeOpacity="0.15"
                                />
                            ));
                        }
                        return null;
                    })}
                    {Array.from({ length: layer.nodes }).map((_, ni) => {
                        const spacing = 520 / (layer.nodes + 1);
                        const x = spacing * (ni + 1);
                        return (
                            <circle
                                key={ni}
                                cx={x} cy={layer.y} r={14}
                                fill={layer.colour + "20"}
                                stroke={layer.colour}
                                strokeWidth="1.2"
                                strokeOpacity="0.5"
                            />
                        );
                    })}
                    <text x="14" y={layer.y + 4}
                        fill={layer.colour} fillOpacity="0.6"
                        fontSize="9" fontFamily="'DM Mono', monospace" fontWeight="700"
                    >
                        {layer.label}
                    </text>
                </g>
            ))}
        </svg>
    );
}

function CycleSVG() {
    const steps = ["Collect", "Train", "Evaluate", "Deploy", "Monitor"];
    const R = 130;
    const cx = 260, cy = 170;
    const positions = steps.map((_, i) => {
        const angle = ((-90 + (360 / steps.length) * i) * Math.PI) / 180;
        return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
    });
    const colours = ["#00FFB3", "#4b98ad", "#FFB347", "#4b98ad", "#00FFB3"];
    return (
        <svg viewBox="0 0 520 340" className="w-full h-full">
            {positions.map((pos, i) => {
                const next = positions[(i + 1) % positions.length];
                const mx = (pos.x + next.x) / 2;
                const my = (pos.y + next.y) / 2;
                const dx = mx - cx, dy = my - cy;
                const len = Math.sqrt(dx * dx + dy * dy);
                const qx = mx + (dx / len) * 25;
                const qy = my + (dy / len) * 25;
                return (
                    <path
                        key={i}
                        d={`M ${pos.x} ${pos.y} Q ${qx} ${qy} ${next.x} ${next.y}`}
                        fill="none"
                        stroke={colours[i]}
                        strokeWidth="1.2"
                        strokeOpacity="0.3"
                        markerEnd="url(#arrow)"
                    />
                );
            })}
            <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0 0 L6 3 L0 6 Z" fill="white" fillOpacity="0.3" />
                </marker>
            </defs>
            {positions.map((pos, i) => (
                <g key={i}>
                    <circle cx={pos.x} cy={pos.y} r={36}
                        fill={colours[i] + "18"} stroke={colours[i]} strokeWidth="1" strokeOpacity="0.45"
                    />
                    <text x={pos.x} y={pos.y + 4}
                        textAnchor="middle"
                        fill={colours[i]} fontSize="10"
                        fontFamily="'DM Mono', monospace" fontWeight="700"
                    >
                        {steps[i]}
                    </text>
                </g>
            ))}
        </svg>
    );
}

function HierarchySVG() {
    const tree = {
        x: 260, y: 50, label: "Model",
        children: [
            {
                x: 130, y: 150, label: "Supervised",
                children: [
                    { x: 60,  y: 260, label: "Regression" },
                    { x: 170, y: 260, label: "Classification" },
                ],
            },
            {
                x: 390, y: 150, label: "Unsupervised",
                children: [
                    { x: 310, y: 260, label: "Clustering" },
                    { x: 440, y: 260, label: "Generative" },
                ],
            },
        ],
    };
    const colours = { root: "#4b98ad", l1: "#00FFB3", l2: "#FFB347" };

    return (
        <svg viewBox="0 0 520 320" className="w-full h-full">
            {tree.children.map((child, i) => (
                <g key={i}>
                    <line x1={tree.x} y1={tree.y + 14} x2={child.x} y2={child.y - 14}
                        stroke={colours.l1} strokeWidth="1" strokeOpacity="0.25"
                    />
                    {child.children?.map((leaf, j) => (
                        <line key={j}
                            x1={child.x} y1={child.y + 14} x2={leaf.x} y2={leaf.y - 14}
                            stroke={colours.l2} strokeWidth="1" strokeOpacity="0.2"
                        />
                    ))}
                </g>
            ))}
            <circle cx={tree.x} cy={tree.y} r={30} fill={colours.root + "20"} stroke={colours.root} strokeWidth="1.2" strokeOpacity="0.5" />
            <text x={tree.x} y={tree.y + 4} textAnchor="middle" fill={colours.root} fontSize="10" fontFamily="'DM Mono', monospace" fontWeight="700">{tree.label}</text>
            {tree.children.map((child, i) => (
                <g key={i}>
                    <circle cx={child.x} cy={child.y} r={30} fill={colours.l1 + "15"} stroke={colours.l1} strokeWidth="1" strokeOpacity="0.4" />
                    <text x={child.x} y={child.y + 4} textAnchor="middle" fill={colours.l1} fontSize="9" fontFamily="'DM Mono', monospace" fontWeight="700">{child.label}</text>
                    {child.children?.map((leaf, j) => (
                        <g key={j}>
                            <circle cx={leaf.x} cy={leaf.y} r={28} fill={colours.l2 + "15"} stroke={colours.l2} strokeWidth="1" strokeOpacity="0.35" />
                            <text x={leaf.x} y={leaf.y + 4} textAnchor="middle" fill={colours.l2} fontSize="8.5" fontFamily="'DM Mono', monospace" fontWeight="700">{leaf.label}</text>
                        </g>
                    ))}
                </g>
            ))}
        </svg>
    );
}

const SVG_MAP = {
    network:   NetworkSVG,
    layers:    LayersSVG,
    cycle:     CycleSVG,
    hierarchy: HierarchySVG,
};

export function ConceptIllustration({ concept, description, style, imageUrl }: ConceptIllustrationBlock & { imageUrl?: string }) {
    const IllustrationSVG = SVG_MAP[style] ?? NetworkSVG;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl bg-white/[0.025] border border-white/[0.08] overflow-hidden"
        >
            {/* Visual area */}
            <div className="h-56 sm:h-64 flex items-center justify-center p-6">
                {imageUrl ? (
                    <img src={imageUrl} alt={concept} className="w-full h-full object-contain" />
                ) : (
                    <IllustrationSVG />
                )}
            </div>
            {/* Caption */}
            <div className="px-8 py-5 border-t border-white/[0.08]">
                <p className="font-display font-bold text-white text-sm">{concept}</p>
                <p className="font-mono text-[10px] text-white/35 mt-1">{description}</p>
            </div>
        </motion.div>
    );
}
