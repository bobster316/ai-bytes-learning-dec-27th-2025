"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface Term {
    term: string;
    definition: string;
}

interface ConceptMapProps {
    terms: Term[];
}

export function ConceptMap({ terms }: ConceptMapProps) {
    const nodes = useMemo(() => {
        const count = Math.min(terms.length, 6); // Limit to 6 for visual clarity
        return terms.slice(0, count).map((t, i) => {
            const angle = (i / count) * Math.PI * 2;
            const radius = 120;
            return {
                id: i,
                label: t.term,
                x: 200 + Math.cos(angle) * radius,
                y: 200 + Math.sin(angle) * radius,
            };
        });
    }, [terms]);

    if (nodes.length === 0) return null;

    return (
        <div className="w-full max-w-[400px] aspect-square relative mx-auto mb-12">
            <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
                {/* Connection Lines */}
                {nodes.map((node, i) => (
                    nodes.slice(i + 1).map((target, j) => (
                        <motion.line
                            key={`line-${i}-${j}`}
                            x1={node.x}
                            y1={node.y}
                            x2={target.x}
                            y2={target.y}
                            stroke="var(--primary)"
                            strokeWidth="1"
                            strokeOpacity="0.1"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.1 }}
                            transition={{ duration: 2, delay: 1 + i * 0.2 }}
                        />
                    ))
                ))}

                {/* Central Hive Mind Orb */}
                <motion.circle
                    cx="200" cy="200" r="40"
                    fill="url(#orb-gradient)"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <defs>
                    <radialGradient id="orb-gradient">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Nodes */}
                {nodes.map((node, i) => (
                    <g key={`node-${i}`}>
                        <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r="6"
                            fill="var(--primary)"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.5 + i * 0.1 }}
                        />
                        <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r="12"
                            stroke="var(--primary)"
                            strokeWidth="1"
                            fill="transparent"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        />
                        <foreignObject x={node.x - 50} y={node.y + 15} width="100" height="40">
                            <div className="text-center">
                                <span className="font-mono text-[8px] text-white/60 uppercase tracking-widest leading-none block whitespace-nowrap">
                                    {node.label}
                                </span>
                            </div>
                        </foreignObject>
                    </g>
                ))}
            </svg>
        </div>
    );
}
