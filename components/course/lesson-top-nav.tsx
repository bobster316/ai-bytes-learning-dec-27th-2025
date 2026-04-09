"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DIFFICULTY_COLOURS: Record<string, string> = {
    Beginner:     "#00FFB3",
    Intermediate: "#FFB347",
    Advanced:     "#FF6B6B",
    Mastery:      "#00FFB3",
};

interface LessonTopNavProps {
    lessonTitle: string;
    difficulty?: string;
    courseId: string;
}

export function LessonTopNav({ lessonTitle, difficulty = "Intermediate", courseId }: LessonTopNavProps) {
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const el = document.documentElement;
            const scrollTop = el.scrollTop || document.body.scrollTop;
            const scrollHeight = el.scrollHeight - el.clientHeight;
            setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const chipColour = DIFFICULTY_COLOURS[difficulty] ?? "#00FFB3";

    return (
        <header className="h-[52px] bg-[#080810]/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-50 flex items-center px-5 gap-4">
            {/* Brand mark */}
            <Link href="/" className="shrink-0 flex items-center gap-1.5 group">
                <span className="font-display font-black text-white text-[13px] tracking-tight group-hover:text-[#00FFB3] transition-colors">
                    AI Bytes Learning
                </span>
            </Link>

            <div className="w-px h-4 bg-white/10 shrink-0" />

            {/* Lesson title */}
            <div className="flex-1 min-w-0">
                <span className="font-mono text-[0.68rem] text-[#8A8AB0] tracking-[0.04em] truncate block">
                    {lessonTitle}
                </span>
            </div>

            {/* Difficulty chip */}
            <div
                className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border"
                style={{ color: chipColour, borderColor: `${chipColour}40`, background: `${chipColour}0d` }}
            >
                {difficulty}
            </div>

            {/* Scroll progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                <div
                    className="h-full bg-[#00FFB3]"
                    style={{ width: `${scrollProgress}%`, transition: "width 0.05s linear" }}
                />
            </div>
        </header>
    );
}
