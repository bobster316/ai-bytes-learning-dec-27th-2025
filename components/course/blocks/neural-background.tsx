"use client";
import React, { useEffect, useRef } from 'react';

/**
 * NeuralBackground - Improved "Wow" Grade
 * Adds atmospheric depth with floating orbs and refined mesh motion.
 */
export function NeuralBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;

        let w = c.width = window.innerWidth;
        let h = c.height = 600;

        const nodes: any[] = [];
        const orbs: any[] = [];

        // Configuration
        const numNodes = window.innerWidth > 768 ? 60 : 30;
        const numOrbs = 8;
        const connectionDist = 160;

        // Fetch colors from CSS variables
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#00FFB3';
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4b98ad';

        // Initialize Nodes (The Mesh)
        for (let i = 0; i < numNodes; i++) {
            nodes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: Math.random() * 2 + 0.5
            });
        }

        // Initialize Orbs (The Atmosphere)
        for (let i = 0; i < numOrbs; i++) {
            orbs.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                radius: Math.random() * 150 + 80,
                opacity: Math.random() * 0.04 + 0.01
            });
        }

        let req: number;
        function draw() {
            if (!ctx) return;
            ctx.clearRect(0, 0, w, h);

            // 1. Draw Orbs (Deep Background)
            orbs.forEach((orb, idx) => {
                orb.x += orb.vx; orb.y += orb.vy;
                if (orb.x < -orb.radius) orb.x = w + orb.radius;
                if (orb.x > w + orb.radius) orb.x = -orb.radius;
                if (orb.y < -orb.radius) orb.y = h + orb.radius;
                if (orb.y > h + orb.radius) orb.y = -orb.radius;

                const hexToRGBA = (hex: string, alpha: number) => {
                    if (hex.startsWith('rgba')) return hex.replace(/[\d\.]+\)$/g, alpha + ')');
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                };

                const color = idx % 2 === 0 ? accentColor : primaryColor;
                const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
                grad.addColorStop(0, hexToRGBA(color, orb.opacity));
                grad.addColorStop(1, 'rgba(0,0,0,0)');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            // 2. Draw Nodes & Connections
            ctx.lineWidth = 0.5;
            for (let i = 0; i < nodes.length; i++) {
                let p1 = nodes[i];
                p1.x += p1.vx; p1.y += p1.vy;

                if (p1.x < 0 || p1.x > w) p1.vx *= -1;
                if (p1.y < 0 || p1.y > h) p1.vy *= -1;

                ctx.fillStyle = primaryColor + "44"; // 44 is ~0.26 opacity
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
                ctx.fill();

                for (let j = i + 1; j < nodes.length; j++) {
                    let p2 = nodes[j];
                    let dx = p1.x - p2.x, dy = p1.y - p2.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDist) {
                        const alpha = (1 - dist / connectionDist) * 0.15;
                        ctx.strokeStyle = primaryColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            req = requestAnimationFrame(draw);
        }
        draw();

        const handleResize = () => {
            w = c.width = window.innerWidth;
            h = c.height = 600;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(req);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none z-0">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{
                    maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)'
                }}
            />
            {/* Ambient Radial Glow Over Title Area */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--primary-glow),transparent_60%)] opacity-30" />
        </div>
    );
}
