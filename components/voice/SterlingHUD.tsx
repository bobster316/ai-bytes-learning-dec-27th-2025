
"use client";

import { motion } from "framer-motion";

export const SterlingHUD = () => {
    return (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            {/* Corner Brackets */}
            {/* Top Left */}
            <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-xl" />
            {/* Top Right */}
            <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-xl" />
            {/* Bottom Left */}
            <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-xl" />
            {/* Bottom Right */}
            <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 rounded-br-xl" />

            {/* Central Rotating Rings (Static SVG with CSS animation) */}
            <div className="absolute inset-0 flex items-center justify-center pb-12">
                {/* Outer Ring */}
                <div className="w-[180px] h-[180px] rounded-full border border-cyan-500/10 border-dashed animate-[spin_60s_linear_infinite]" />
                {/* Inner Ring */}
                <div className="absolute w-[140px] h-[140px] rounded-full border border-cyan-400/20 border-dotted animate-[spin_40s_linear_infinite_reverse]" />
            </div>

            {/* Scanlines Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />

            {/* Subtle Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />

            {/* Side Data Decorations */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-50">
                <div className="w-1 h-2 bg-cyan-500/50" />
                <div className="w-1 h-2 bg-cyan-500/30" />
                <div className="w-1 h-4 bg-cyan-500/70" />
                <div className="w-1 h-2 bg-cyan-500/30" />
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-50 items-end">
                <div className="w-1 h-2 bg-cyan-500/50" />
                <div className="w-1 h-2 bg-cyan-500/30" />
                <div className="w-1 h-4 bg-cyan-500/70" />
                <div className="w-1 h-2 bg-cyan-500/30" />
            </div>
        </div>
    );
};
