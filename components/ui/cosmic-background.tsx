"use client";

import React, { useEffect, useRef } from 'react';

export function CosmicBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: Star[] = [];
        let particles: Particle[] = [];

        interface Star {
            x: number;
            y: number;
            size: number;
            opacity: number;
            speed: number;
        }

        interface Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            life: number;
            color: string;
        }

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const initStars = () => {
            stars = [];
            const starCount = Math.floor((canvas.width * canvas.height) / 2000); // Density based
            for (let i = 0; i < starCount; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 1.5,
                    opacity: Math.random(),
                    speed: Math.random() * 0.2
                });
            }
        };

        const drawGalaxy = (time: number) => {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Draw Nebulas (Gradient blobs)
            const gradient1 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width * 0.8);
            gradient1.addColorStop(0, 'rgba(20, 10, 60, 0.4)'); // Deep Violet
            gradient1.addColorStop(0.5, 'rgba(10, 10, 30, 0.2)');
            gradient1.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient1;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Rotating Spiral Arms (Mathematical approximate)
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(time * 0.0001);

            for (let i = 0; i < 3; i++) {
                ctx.rotate((Math.PI * 2) / 3);
                const grd = ctx.createLinearGradient(0, 0, canvas.width, 0);
                grd.addColorStop(0, 'rgba(100, 50, 255, 0)');
                grd.addColorStop(0.5, 'rgba(100, 100, 255, 0.05)');
                grd.addColorStop(1, 'transparent');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(canvas.width / 4, canvas.width / 4, canvas.width, 0);
                ctx.lineTo(canvas.width, 100);
                ctx.quadraticCurveTo(canvas.width / 4, canvas.width / 4 + 100, 0, 0);
                ctx.fill();
            }
            ctx.restore();
        };

        const render = (time: number) => {
            // Clear with trail effect
            ctx.fillStyle = 'rgba(5, 5, 10, 0.2)'; // Dark space background
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawGalaxy(time);

            // Draw Stars
            ctx.fillStyle = 'white';
            stars.forEach(star => {
                ctx.globalAlpha = 0.3 + Math.sin(time * 0.002 + star.x) * 0.5; // Twinkle
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                // Parallax movement
                star.y -= star.speed;
                if (star.y < 0) star.y = canvas.height;
            });
            ctx.globalAlpha = 1.0;

            animationFrameId = requestAnimationFrame(() => render(performance.now()));
        };

        window.addEventListener('resize', resize);
        resize();
        render(0);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 bg-[#05050A]"
        />
    );
}
