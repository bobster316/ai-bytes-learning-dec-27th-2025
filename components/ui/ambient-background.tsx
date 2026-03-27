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
            {/* Light premium base layer */}
            <div className="absolute inset-0 bg-[#F8FAFC]" />

            {/* Liquid glowing orbs (Light mode optimized) */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply opacity-60 animate-pulse-slow" />
            <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-indigo-300/20 rounded-full blur-[140px] mix-blend-multiply opacity-50 animate-pulse-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-purple-300/20 rounded-full blur-[100px] mix-blend-multiply opacity-40 animate-pulse-slow" style={{ animationDelay: '4s' }} />

            {/* Optional subtle noise texture */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-slate-100/80" />
        </div>
    );
}
