"use client";

import { useEffect, useRef } from "react";

interface MatrixRainProps {
  opacity?: number;
  className?: string;
}

// AI-themed glyph pool — binary, hex, and AI shorthand chars
const GLYPHS =
  "01アイ人工知能ABCDEFabcdef0123456789∑∂∇λΩπ{}[]<>∞≠≡∈∀∃⊕⊗⊂⊃∧∨¬→←⟨⟩";

export function MatrixRain({ opacity = 0.055, className = "" }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let cols: number[] = [];
    const fontSize = 14;
    const color = "#00FFB3";

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const count = Math.floor(canvas.width / (fontSize * 1.8));
      cols = Array.from({ length: count }, () =>
        Math.floor(Math.random() * -(canvas.height / fontSize))
      );
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let frame = 0;

    const draw = () => {
      frame++;
      // Run every 2nd frame — slow but visible drip
      if (frame % 2 === 0) {
        // Gentle fade — keeps trail visible for longer
        ctx.fillStyle = "rgba(8,8,16,0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;

        for (let i = 0; i < cols.length; i++) {
          const x = i * fontSize * 1.8;
          const y = cols[i] * fontSize;

          // Head glyph — bright white-green
          ctx.fillStyle = `rgba(200,255,240,0.95)`;
          ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], x, y);

          // Second glyph — pure neon
          ctx.fillStyle = `rgba(0,255,179,0.80)`;
          ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], x, y - fontSize);

          // Reset column randomly after reaching bottom
          if (y > canvas.height && Math.random() > 0.97) {
            cols[i] = 0;
          } else {
            cols[i]++;
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
