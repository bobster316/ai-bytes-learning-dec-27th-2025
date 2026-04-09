"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AmbientBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Base layer — switches with theme */}
            <div className="absolute inset-0 dark:bg-[#080810] bg-[#F8FAFC]" />

            {/* Glowing orbs — very subtle in light mode, screen blend in dark */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[160px] dark:opacity-60 opacity-30 animate-pulse-slow dark:bg-[#00FFB3]/[0.04] bg-sky-300/[0.25] dark:mix-blend-screen mix-blend-multiply" />
            <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[180px] dark:opacity-50 opacity-20 animate-pulse-slow dark:bg-[#9B8FFF]/[0.05] bg-violet-200/[0.30] dark:mix-blend-screen mix-blend-multiply" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full blur-[130px] dark:opacity-40 opacity-20 animate-pulse-slow dark:bg-[#00FFB3]/[0.03] bg-emerald-200/[0.20] dark:mix-blend-screen mix-blend-multiply" style={{ animationDelay: '4s' }} />

            {/* Gradient overlay */}
            <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-transparent dark:via-transparent dark:to-[#080810]/60 bg-gradient-to-b from-white/40 via-transparent to-slate-100/80" />
        </div>
    );
}
