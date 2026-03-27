
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ParticleBackgroundProps {
    isConnected: boolean;
    isSpeaking: boolean;
    isListening: boolean;
}

export const ParticleBackground = ({ isConnected, isSpeaking, isListening }: ParticleBackgroundProps) => {
    // Generate static particles to avoid hydration mismatches
    const [particles] = useState(() => Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 2, // Larger particles (2-8px)
        duration: Math.random() * 10 + 5, // Faster movement
        delay: Math.random() * 5,
    })));

    return (
        <div className="absolute inset-0 overflow-hidden bg-black/90 pointer-events-none">
            {/* Ambient Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black" />

            {/* Orbiting Ring 1 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="w-[600px] h-[600px] rounded-full border border-cyan-500/30 border-dashed"
                />
            </div>

            {/* Orbiting Ring 2 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="w-[400px] h-[400px] rounded-full border border-blue-500/30"
                />
            </div>

            {/* Active Core Glow - Reacts to Speaking */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: isSpeaking ? [1, 1.5, 1] : isListening ? [1, 1.2, 1] : 1,
                        opacity: isSpeaking ? 0.6 : 0.3,
                    }}
                    transition={{
                        duration: isSpeaking ? 0.5 : 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-[200px] h-[200px] rounded-full bg-cyan-500 blur-[100px]"
                />
            </div>

            {/* Floating Particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-white/40"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.8, 0.2],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
};
