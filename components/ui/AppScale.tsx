"use client";

import { useEffect, useState } from "react";

const DESIGN_WIDTH = 1440;
const MIN_SCALE   = 0.4;   // never shrink below 40% (prevents unusably tiny layout)
const MAX_SCALE   = 1.0;   // never upscale above 100%
const MOBILE_BREAKPOINT = 768; // below this, zoom = 1 and Tailwind responsive takes over

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export function AppScale({ children }: { children: React.ReactNode }) {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const applyScale = () => {
            const vw = window.innerWidth || DESIGN_WIDTH;

            // On mobile/tablet, let Tailwind responsive layout handle it — no zoom
            if (vw < MOBILE_BREAKPOINT) {
                setScale(1);
                return;
            }

            setScale(clamp(vw / DESIGN_WIDTH, MIN_SCALE, MAX_SCALE));
        };

        applyScale();
        window.addEventListener("resize", applyScale);
        return () => window.removeEventListener("resize", applyScale);
    }, []);

    // Inline style drives zoom directly — React-managed re-render on every resize,
    // no CSS variable indirection which is unreliable for zoom repaint.
    return <div style={{ zoom: scale }}>{children}</div>;
}
