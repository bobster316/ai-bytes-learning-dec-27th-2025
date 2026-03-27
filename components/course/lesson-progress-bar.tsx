"use client";

import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

interface LessonProgressBarProps {
    currentSection?: number;
    totalSections?: number;
    className?: string;
}

/**
 * LessonProgressBar — Scroll-driven progress indicator.
 * Fills as the learner scrolls through the lesson content.
 */
export function LessonProgressBar({ className }: LessonProgressBarProps) {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    return (
        <div className={`fixed top-0 left-0 right-0 z-[100] h-[3px] bg-white/5 ${className ?? ""}`}>
            <motion.div
                className="h-full bg-gradient-to-r from-[#00FFB3] to-[#4b98ad] origin-left shadow-[0_0_10px_rgba(0,255,179,0.5)]"
                style={{ scaleX }}
            >
                {/* Glow tip */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/20 blur-md" />
            </motion.div>
        </div>
    );
}
