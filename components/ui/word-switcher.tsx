"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const WordSwitcher = ({
    words,
    duration = 3000,
    className,
}: {
    words: string[];
    duration?: number;
    className?: string;
}) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, duration);
        return () => clearInterval(interval);
    }, [words.length, duration]);

    return (
        <span className={cn("inline-block relative min-w-[3ch]", className)}>
            <AnimatePresence mode="wait">
                <motion.span
                    key={words[index]}
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{
                        duration: 0.6,
                        ease: "easeInOut"
                    }}
                    className="inline-block"
                >
                    {words[index]}
                </motion.span>
            </AnimatePresence>

            {/* The "Animated Line" - subtle hand-drawn underline effect */}
            <motion.svg
                key={index}
                viewBox="0 0 100 10"
                className="absolute -bottom-1 left-0 w-full h-2 text-red-500"
                preserveAspectRatio="none"
            >
                <motion.path
                    d="M0 5 Q 25 0, 50 5 T 100 5"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: duration / 1000, ease: "easeOut" }}
                />
            </motion.svg>
        </span>
    );
};
