"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Constants ---
const LAYER_COUNTS = [5, 9, 9, 9, 5]; // Diamond Topology
const NEURON_RADIUS = 3.5; // Slightly smaller to fit 9 lines
const PULSE_SPEED_BASE = 0.015;

const PROMPTS = [
    { q: "Analyze Pattern", a: "Pattern Detected: Linear Regression (98%)" },
    { q: "Classify Image", a: "Object: 'Golden Retriever' (94%)" },
    { q: "Translate", a: "Output: 'Le chat est sur la table'" },
    { q: "Optimize Route", a: "Route Found: Savings 12% Distance" }
];

interface Neuron {
    x: number;
    y: number;
    layerIdx: number;
    idx: number;
    value: number; // 0 to 1 (activation intensity)
}

interface Pulse {
    source: Neuron;
    target: Neuron;
    progress: number; // 0 to 1
    speed: number;
}

export function NeuralNetworkAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);

    // UI State
    const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const [phase, setPhase] = useState<'thinking' | 'result'>('thinking');

    // Refs for Simulation
    const neurons = useRef<Neuron[]>([]);
    const connections = useRef<{ source: Neuron, target: Neuron, weight: number }[]>([]);
    const pulses = useRef<Pulse[]>([]);
    const animationRef = useRef<number>(0);
    const stateRef = useRef({
        lastPulseTime: 0,
        pulseInterval: 100, // ms between bursts
        textTimer: 0,
        currentDrawW: 500
    });

    const initNetwork = (width: number, height: number) => {
        neurons.current = [];
        connections.current = [];
        pulses.current = [];

        // allow the network to naturally fill the given container boundaries.
        let drawW = width * 0.85; // 85% width padding
        let drawH = height * 0.8; // 80% height padding

        // On mobile (tall/narrow columns), prevent it from stretching too far vertically
        if (drawH > drawW * 1.5) {
            drawH = drawW * 1.5;
        }

        // Center the naturally proportioned area
        const offsetX = (width - drawW) / 2;
        const offsetY = (height - drawH) / 2;

        console.log(`[NeuralNet] Container: ${width}x${height} | DrawArea: ${drawW}x${drawH}`);

        stateRef.current.currentDrawW = drawW;

        const layerSpacing = drawW / (LAYER_COUNTS.length - 1);

        // Build Neurons
        LAYER_COUNTS.forEach((count, lIdx) => {
            // Diamond Shape Logic: Middle layers are taller
            const spreadFactor = count / Math.max(...LAYER_COUNTS); // 5/9 vs 9/9
            const layerHeight = drawH * (0.5 + (spreadFactor * 0.5)); // 0.5 to 1.0 height

            const startY = offsetY + ((drawH - layerHeight) / 2);
            const nodeSpacing = layerHeight / (count - 1);

            for (let i = 0; i < count; i++) {
                neurons.current.push({
                    x: offsetX + (lIdx * layerSpacing),
                    y: startY + (i * nodeSpacing),
                    layerIdx: lIdx,
                    idx: i,
                    value: 0
                });
            }
        });

        // Build Connections (Forward Feed)
        for (let l = 0; l < LAYER_COUNTS.length - 1; l++) {
            const sources = neurons.current.filter(n => n.layerIdx === l);
            const targets = neurons.current.filter(n => n.layerIdx === l + 1);

            sources.forEach(src => {
                targets.forEach(tgt => {
                    connections.current.push({
                        source: src,
                        target: tgt,
                        weight: Math.random()
                    });
                });
            });
        }
    };

    // Trigger a pulse wave from a specific layer
    const triggerWave = (layerIdx: number) => {
        if (layerIdx >= LAYER_COUNTS.length - 1) return;

        const sources = neurons.current.filter(n => n.layerIdx === layerIdx && n.value > 0.1);
        const targets = neurons.current.filter(n => n.layerIdx === layerIdx + 1);

        if (sources.length === 0) {
            // Random start if fell asleep
            if (layerIdx === 0) {
                const startNode = neurons.current.find(n => n.layerIdx === 0 && Math.random() > 0.5);
                if (startNode) startNode.value = 1;
            }
            return;
        }

        sources.forEach(src => {
            targets.forEach(tgt => {
                if (Math.random() > 0.7) { // density factor
                    pulses.current.push({
                        source: src,
                        target: tgt,
                        progress: 0,
                        speed: PULSE_SPEED_BASE + (Math.random() * 0.01)
                    });
                }
            });
        });
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let disposed = false;

        // Resize Logic
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            // Reset transform so repeated resizes don't compound scaling.
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            initNetwork(rect.width, rect.height);
        };
        window.addEventListener('resize', resize);
        resize();

        // Animation Loop
        const loop = (time: number) => {
            if (disposed) return;
            if (!isPlaying) {
                animationRef.current = requestAnimationFrame(loop);
                return;
            }

            const width = container.clientWidth;
            const height = container.clientHeight;

            // Clear with Trail Effect (Motional Blur)
            ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; // Very faint clear
            ctx.fillRect(0, 0, width, height);

            // --- Logic Update ---

            // 1. Text Typing Logic
            const currentPrompt = PROMPTS[currentPromptIdx];
            if (phase === 'thinking') {
                if (stateRef.current.textTimer % 5 === 0) { // Slower typing
                    if (displayText.length < currentPrompt.q.length) {
                        setDisplayText(currentPrompt.q.substring(0, displayText.length + 1));
                    } else {
                        // wait random time then result
                        if (Math.random() > 0.98) { // Random finish trigger
                            setPhase('result');
                            setDisplayText("");
                        }
                    }
                }
                stateRef.current.textTimer++;

                // Input layer noise while thinking
                if (time - stateRef.current.lastPulseTime > 200) {
                    const inputs = neurons.current.filter(n => n.layerIdx === 0);
                    inputs.forEach(n => {
                        if (Math.random() > 0.7) n.value = 1.0;
                    });
                    triggerWave(0); // Start cascade
                    stateRef.current.lastPulseTime = time;
                }

            } else {
                // Showing Result
                if (stateRef.current.textTimer % 2 === 0) {
                    if (displayText.length < currentPrompt.a.length) {
                        setDisplayText(currentPrompt.a.substring(0, displayText.length + 1));
                    } else {
                        // Done, wait then reset
                        if (stateRef.current.textTimer > 300) { // 3s hold
                            setCurrentPromptIdx((prev) => (prev + 1) % PROMPTS.length);
                            setPhase('thinking');
                            setDisplayText("");
                        }
                    }
                }
                stateRef.current.textTimer++;
            }


            // 2. Pulses Update
            pulses.current.forEach((p, idx) => {
                p.progress += p.speed;
                if (p.progress >= 1) {
                    p.target.value = 1.0; // Activate target
                    // Trigger next layer?
                    if (p.target.layerIdx < LAYER_COUNTS.length - 1) {
                        // Immediate cascade chance
                        if (Math.random() > 0.5) {
                            const nextTargets = neurons.current.filter(n => n.layerIdx === p.target.layerIdx + 1);
                            const nextTgt = nextTargets[Math.floor(Math.random() * nextTargets.length)];
                            pulses.current.push({
                                source: p.target,
                                target: nextTgt,
                                progress: 0,
                                speed: p.speed // preserve speed
                            });
                        }
                    }
                    pulses.current.splice(idx, 1);
                }
            });

            // 3. Neurons Decay
            neurons.current.forEach(n => {
                n.value *= 0.92; // Fast decay
                if (n.value < 0.01) n.value = 0;
            });


            // --- Drawing ---
            // Greatly reduce the scale cap so nodes don't overlap vertically on 450px height desktop monitors.
            const drawScale = Math.min(0.65, stateRef.current.currentDrawW / 800);

            // Draw Connections (Background Mesh)
            ctx.lineWidth = 1;
            connections.current.forEach(c => {
                ctx.beginPath();
                ctx.moveTo(c.source.x, c.source.y);
                ctx.lineTo(c.target.x, c.target.y);
                // Subtle gradient tint based on source layer
                const hue = 180 + (c.source.layerIdx * 20); // Cyan -> Blue -> Purple
                ctx.strokeStyle = `hsla(${hue}, 70%, 70%, 0.1)`;
                ctx.stroke();
            });

            // Draw Pulses (Energy Packets)
            ctx.globalCompositeOperation = 'lighter';
            pulses.current.forEach(p => {
                const x = p.source.x + (p.target.x - p.source.x) * p.progress;
                const y = p.source.y + (p.target.y - p.source.y) * p.progress;

                // Dynamic Color Spectrum: Cyan -> Emerald -> Blue -> Violet -> Pink
                const progressGlobal = (p.source.layerIdx + p.progress) / (LAYER_COUNTS.length - 1);
                const hue = 170 + (progressGlobal * 130); // 170(Cyan) to 300(Magenta)

                // Gradient Trail
                const grad = ctx.createRadialGradient(x, y, 0, x, y, 12 * drawScale);
                grad.addColorStop(0, `hsla(${hue}, 100%, 70%, 1)`); // Hot Core
                grad.addColorStop(0.4, `hsla(${hue}, 100%, 50%, 0.5)`);
                grad.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(x, y, 8 * drawScale, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw Neurons (Activations)
            neurons.current.forEach(n => {
                // Hue base
                const hue = 170 + ((n.layerIdx / (LAYER_COUNTS.length - 1)) * 130);

                if (n.value <= 0.01) {
                    // Dormant Nodes (Dark but colored)
                    ctx.fillStyle = `hsla(${hue}, 30%, 30%, 0.2)`;
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, 3 * drawScale, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Active Glow
                    const size = (NEURON_RADIUS + (n.value * 6)) * drawScale;
                    const alpha = n.value;

                    const color = `hsla(${hue}, 100%, 60%, ${alpha})`;
                    const glowColor = `hsla(${hue}, 100%, 50%, 0)`;

                    // Outer Glow
                    const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, size * 2.5);
                    glow.addColorStop(0, color);
                    glow.addColorStop(1, glowColor);

                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, size * 2.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Hot White Core
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, 3 * drawScale, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.globalCompositeOperation = 'source-over';

            animationRef.current = requestAnimationFrame(loop);
        };

        animationRef.current = requestAnimationFrame(loop);

        return () => {
            disposed = true;
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [isPlaying, currentPromptIdx, phase]);

    return (
        <div ref={containerRef} className="w-full h-[450px] relative bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden group">
            <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

            {/* Overlay: Current Operation */}
            <div
                key={`${phase}-${displayText.length}`}
                className={cn(
                    "absolute top-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none inline-flex items-center justify-center px-6 py-2.5 rounded-full border backdrop-blur-md",
                    phase === 'thinking'
                        ? "bg-slate-900/80 border-cyan-500/30 text-cyan-400"
                        : "bg-purple-950/80 border-purple-500/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                )}>
                {phase === 'thinking' && <RefreshCw className="w-4 h-4 mr-3 animate-spin shrink-0" />}
                <span className="font-mono text-sm sm:text-base font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                    {displayText}
                    <span className="animate-pulse">_</span>
                </span>
            </div>

            {/* Legend/Info */}
            <div className="absolute bottom-6 left-6 flex flex-col gap-1 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></div>
                    <span>Data Input</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 opacity-50"></div>
                    <span>Processing</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></div>
                    <span>Prediction</span>
                </div>
            </div>

            {/* Play/Pause */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-6 right-6 rounded-full bg-slate-900/50 hover:bg-slate-800 text-slate-400 border border-slate-800"
                onClick={() => setIsPlaying(!isPlaying)}
            >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
        </div>
    );
}
