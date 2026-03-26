"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useCourseDNA } from "@/components/course/course-dna-provider";

/**
 * LessonProgressRail — Fixed right-side dot navigation.
 * Spring-eased dots, active = lesson-variant primary_colour glow + 1.5× scale.
 * Hover shows section label tooltip. Click scrolls to section.
 * Discovers block sections via section[id^="block-"] + data-block-type filtering.
 */

// Block types that are too small / structural to warrant a nav dot
const LOW_SIGNAL_TYPES = new Set([
    "callout",
    "audio_recap_prominent",
]);

export function LessonProgressRail() {
    const { primary_colour } = useCourseDNA();
    const [sections, setSections] = useState<{ id: string; label: string }[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const observersRef = useRef<IntersectionObserver[]>([]);

    // Discover sections from DOM after mount
    useEffect(() => {
        const discover = () => {
            const found: { id: string; label: string }[] = [];

            // Hero section first
            const heroEl = document.querySelector(".lesson-hero-section");
            if (heroEl) found.push({ id: "__hero", label: "Overview" });

            // All block sections rendered by LessonBlockRenderer
            const sectionEls = document.querySelectorAll<HTMLElement>('section[id^="block-"]');
            sectionEls.forEach((el) => {
                const blockType = el.dataset.blockType ?? "";
                if (LOW_SIGNAL_TYPES.has(blockType)) return;
                const heading = el.querySelector("h1, h2, h3");
                const label = heading?.textContent?.replace(/\*\*/g, "").trim().slice(0, 32)
                    || blockType.replace(/_/g, " ");
                found.push({ id: el.id, label });
            });

            setSections(found);
        };

        // Slight delay so block-renderer has rendered
        const timer = setTimeout(discover, 400);
        return () => clearTimeout(timer);
    }, []);

    // Intersection observers to track active section
    useEffect(() => {
        observersRef.current.forEach(o => o.disconnect());
        observersRef.current = [];

        sections.forEach((section, idx) => {
            const el = section.id === "__hero"
                ? document.querySelector(".lesson-hero-section")
                : document.getElementById(section.id);
            if (!el) return;

            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveIdx(idx); },
                { threshold: 0, rootMargin: "-50% 0px -50% 0px" }
            );
            obs.observe(el as Element);
            observersRef.current.push(obs);
        });

        return () => observersRef.current.forEach(o => o.disconnect());
    }, [sections]);

    if (sections.length < 2) return null;

    return (
        <div
            className="hidden md:flex fixed z-[90] flex-col gap-3 items-center"
            style={{ right: "1.5rem", top: "50%", transform: "translateY(-50%)" }}
            aria-label="Lesson navigation"
        >
            {sections.map((s, i) => (
                <div key={i} className="relative group flex items-center">
                    {/* Hover tooltip */}
                    <div
                        className="absolute right-5 pointer-events-none"
                        style={{
                            opacity: 0,
                            transform: "translateX(4px)",
                            transition: "opacity 0.2s, transform 0.2s",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <span
                            className="font-mono text-[0.6rem] uppercase tracking-[0.1em] px-2 py-1 rounded"
                            style={{
                                background: "rgba(15,15,26,0.92)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "#e8e8f0",
                            }}
                        >
                            {s.label}
                        </span>
                    </div>

                    {/* Dot */}
                    <motion.button
                        onClick={() => {
                            const el = s.id === "__hero"
                                ? document.querySelector(".lesson-hero-section")
                                : document.getElementById(s.id);
                            el?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        animate={{
                            scale: i === activeIdx ? 1.5 : 1,
                            background: i === activeIdx ? primary_colour : "rgba(255,255,255,0.15)",
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        aria-label={s.label}
                        style={{
                            width: 8, height: 8,
                            borderRadius: "50%",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            boxShadow: i === activeIdx ? `0 0 12px ${primary_colour}, 0 0 4px ${primary_colour}` : "none",
                            outline: "none",
                        }}
                        className="[.group:hover~div_&]:opacity-100"
                    />
                </div>
            ))}

            <style>{`
                .group:hover > div:first-child {
                    opacity: 1 !important;
                    transform: translateX(0) !important;
                }
            `}</style>
        </div>
    );
}
