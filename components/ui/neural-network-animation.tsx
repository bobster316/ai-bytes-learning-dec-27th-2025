"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Zap, Activity, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NeuralNetworkAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [speed, setSpeed] = useState(50);
    const [interactionMode, setInteractionMode] = useState<'repel' | 'attract'>('repel');

    // --- Neural Constellation Engine ---

    interface Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        life: number;
        maxLife: number;
        size: number;
        color: string;
        baseX: number; // For "homing" behavior
        baseY: number;
    }

    const particles = useRef<Particle[]>([]);
    const mouse = useRef({ x: 0, y: 0, active: false });
    const hueRef = useRef(0);

    // Configuration
    const PARTICLE_COUNT = 120;
    const CONNECTION_DISTANCE = 100;
    const MOUSE_RADIUS = 150;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Define InitParticles FIRST
        const initParticles = () => {
            particles.current = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                particles.current.push({
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    life: Math.random() * 100,
                    maxLife: 100 + Math.random() * 100,
                    size: Math.random() * 2 + 1,
                    color: `hsla(${Math.random() * 60 + 180}, 100%, 70%, 1)`, // Cyans/Blues
                    baseX: x,
                    baseY: y
                });
            }
        };

        // 2. Define Resize Handling SECOND (uses initParticles)
        const resize = () => {
            if (containerRef.current && canvas) {
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;
                initParticles();
            }
        };
        window.addEventListener('resize', resize);
        resize(); // Initial sizing

        let animationFrameId: number;

        const render = () => {
            if (!ctx || !canvas) return;

            // 1. Trails Effect ( instead of clearRect )
            ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; // Very dark slate with transparency
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 2. Global Glow
            ctx.globalCompositeOperation = 'lighter';

            // Hue Cycle for dynamic coloring
            hueRef.current += 0.2;

            if (isPlaying) {
                const speedFactor = speed / 50;

                particles.current.forEach((p, i) => {
                    // Update POS
                    p.x += p.vx * speedFactor;
                    p.y += p.vy * speedFactor;

                    // Bounds Check (Bounce)
                    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                    // Mouse Interaction
                    if (mouse.current.active) {
                        const dx = mouse.current.x - p.x;
                        const dy = mouse.current.y - p.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < MOUSE_RADIUS) {
                            const forceDirectionX = dx / distance;
                            const forceDirectionY = dy / distance;
                            const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
                            const direction = interactionMode === 'repel' ? -1 : 1;

                            p.vx += forceDirectionX * force * direction * 0.5;
                            p.vy += forceDirectionY * force * direction * 0.5;
                        }
                    }

                    // Friction (Dampen velocity)
                    p.vx *= 0.99;
                    p.vy *= 0.99;

                    // Min Movement (Drift)
                    if (Math.abs(p.vx) < 0.1) p.vx += (Math.random() - 0.5) * 0.05;
                    if (Math.abs(p.vy) < 0.1) p.vy += (Math.random() - 0.5) * 0.05;

                    // Draw Particle
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();

                    // Connections
                    for (let j = i; j < particles.current.length; j++) {
                        const p2 = particles.current[j];
                        const dx = p.x - p2.x;
                        const dy = p.y - p2.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < CONNECTION_DISTANCE) {
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(6, 182, 212, ${1 - dist / CONNECTION_DISTANCE})`; // Cyan fade
                            ctx.lineWidth = 0.5;
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                    }
                });
            } else {
                // Just draw static particles if paused
                particles.current.forEach((p) => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                });
            }

            ctx.globalCompositeOperation = 'source-over';
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, [isPlaying, speed, interactionMode]);

    // Handlers
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouse.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            active: true
        };
    };

    const handleMouseLeave = () => {
        mouse.current.active = false;
    };

    const triggerPulse = () => {
        // "Big Bang" Effect
        particles.current.forEach(p => {
            p.vx = (Math.random() - 0.5) * 20;
            p.vy = (Math.random() - 0.5) * 20;
            p.color = '#ffffff'; // Flash white
            setTimeout(() => {
                p.color = `hsla(${Math.random() * 60 + 180}, 100%, 70%, 1)`;
            }, 200);
        });
    };

    return (
        <div className="w-full mx-auto font-sans my-12 relative">

            {/* Main Visual Container */}
            <div
                ref={containerRef}
                className="relative w-full h-[500px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={triggerPulse}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),rgba(2,6,23,0))]" />

                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full cursor-pointer mix-blend-screen"
                />

                {/* Overlay UI */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700/50 shadow-lg">

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                            className="rounded-full w-10 h-10 hover:bg-slate-700 text-slate-200"
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>

                        <div className="h-8 w-px bg-slate-700/50" />

                        <div className="flex flex-col gap-1 w-32">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                <span>Energy</span>
                                <span className="text-cyan-400">{speed}%</span>
                            </div>
                            <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="absolute h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${speed}%` }} />
                                <input
                                    type="range"
                                    min="1" max="100"
                                    value={speed}
                                    onChange={(e) => setSpeed(Number(e.target.value))}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-700/50" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); triggerPulse(); }}
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 uppercase text-xs font-bold tracking-wider"
                        >
                            <Zap className="w-4 h-4 mr-2" /> Ignite
                        </Button>
                    </div>

                    <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 text-xs text-slate-400 font-medium">
                        <MousePointer2 className="w-3 h-3 text-cyan-500" />
                        <span>INTERACTION:</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setInteractionMode('repel'); }}
                            className={`px-2 py-1 rounded transition-colors ${interactionMode === 'repel' ? 'bg-slate-700 text-white' : 'hover:text-white'}`}
                        >
                            REPEL
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setInteractionMode('attract'); }}
                            className={`px-2 py-1 rounded transition-colors ${interactionMode === 'attract' ? 'bg-slate-700 text-white' : 'hover:text-white'}`}
                        >
                            ATTRACT
                        </button>
                    </div>
                </div>

                {/* Ambient Status Test - Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mix-blend-overlay opacity-30">
                    <h3 className="text-8xl font-black text-white tracking-widest blur-[2px]">NEURAL</h3>
                    <h3 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent tracking-widest">ENGINE</h3>
                </div>

                {/* Corner Label */}
                <div className="absolute top-6 left-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]"></div>
                    <span className="text-xs font-mono text-cyan-500/80 tracking-widest">SYS.ACTIVE // PROCESSING_TENSORS</span>
                </div>
            </div>
        </div>
    );
}
