"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SnapScrollContainerProps {
    children: React.ReactNode;
    onSectionChange?: (index: number) => void;
    backgroundElements?: React.ReactNode;
}

export function SnapScrollContainer({ children, onSectionChange, backgroundElements }: SnapScrollContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Debounced scroll handler to detect which section is active
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let timeoutId: NodeJS.Timeout;

        const handleScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const scrollPosition = container.scrollTop;
                const windowHeight = window.innerHeight;
                // Calculate which section is closest to the top
                const index = Math.round(scrollPosition / windowHeight);

                if (index !== activeIndex) {
                    setActiveIndex(index);
                    if (onSectionChange) onSectionChange(index);
                }
            }, 50); // Small debounce
        };

        container.addEventListener("scroll", handleScroll);
        return () => {
            container.removeEventListener("scroll", handleScroll);
            clearTimeout(timeoutId);
        };
    }, [activeIndex, onSectionChange]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-obsidian text-slate-200">
            {/* Dynamic Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none transition-colors duration-1000">
                <div className="absolute inset-0 mesh-gradient opacity-80" />
                {backgroundElements}
            </div>

            {/* Snap Scrolling Container */}
            <div
                ref={containerRef}
                className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth scrollbar-hide"
            >
                {React.Children.map(children, (child, index) => {
                    if (!React.isValidElement(child)) return null;

                    const isActive = index === activeIndex;

                    return (
                        <section
                            key={`section-wrapper-${index}`}
                            className="w-full h-screen snap-start snap-always flex items-center justify-center relative origin-center"
                        >
                            <AnimatePresence mode="wait">
                                {isActive && (
                                    <motion.div
                                        key={`section-${index}`}
                                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.05, y: -30 }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                        className="w-full h-full flex items-center justify-center p-4 md:p-12 lg:p-24"
                                    >
                                        {child}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>
                    );
                })}
            </div>

            {/* Navigation Dots */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 pointer-events-none">
                {React.Children.map(children, (_, index) => (
                    <motion.div
                        animate={{
                            height: index === activeIndex ? 32 : 8,
                            backgroundColor: index === activeIndex ? "rgba(0, 211, 242, 1)" : "rgba(255, 255, 255, 0.2)"
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-2 rounded-full shadow-[0_0_10px_rgba(0,211,242,0.5)]"
                    />
                ))}
            </div>
        </div>
    );
}
