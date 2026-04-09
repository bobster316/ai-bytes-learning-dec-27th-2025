"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const LOGO_LIGHT = "/logos/ai%20bytes%20learning%20logo%20new%20green.png";
const LOGO_DARK  = "/logos/ai-bytes-logo-transparency-1.png";

// Light PNG has ~25% padding → needs large scale to fill the container.
// Dark PNG has ~10% padding → needs a smaller scale to render at the same visual size.
const CFG = {
    light: { height: "301%", left: "-14%" },
    dark:  { height: "48%",  left: "0%"   },
} as const;

export function Logo({ className = "" }: { className?: string }) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const isLight = mounted && theme !== "dark";
    const { height, left } = isLight ? CFG.light : CFG.dark;

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={isLight ? LOGO_LIGHT : LOGO_DARK}
                alt="AI Bytes Learning"
                style={{
                    position : "absolute",
                    height,
                    width    : "auto",
                    maxWidth : "none",
                    top      : "50%",
                    left,
                    transform: "translateY(-50%)",
                }}
            />
        </div>
    );
}
