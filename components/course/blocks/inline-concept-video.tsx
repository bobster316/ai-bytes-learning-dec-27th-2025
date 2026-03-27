"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineConceptVideoProps {
    url: string;
    title: string;
    description?: string;
    className?: string;
}

export function InlineConceptVideo({ url, title, description, className }: InlineConceptVideoProps) {
    if (!url) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className={cn(
                "my-8 relative group overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d1c] backdrop-blur-sm",
                className
            )}
        >
            <div className="flex flex-col md:flex-row gap-6 p-4">
                {/* Video Column */}
                <div className="relative w-full md:w-[240px] aspect-square shrink-0 rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg">
                    <video
                        src={url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                        <Play className="w-2 h-2 text-[#00FFB3] fill-current" />
                        <span className="font-mono text-[8px] font-bold text-white/70 uppercase tracking-widest">Visual Insight</span>
                    </div>
                </div>

                {/* Content Column */}
                <div className="flex flex-col justify-center py-2">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-[#00FFB3] rounded-full" />
                        <h4 className="font-display font-black text-sm uppercase tracking-wider text-white">
                            {title}
                        </h4>
                    </div>
                    <p className="font-body text-xs text-white/60 leading-relaxed max-w-md">
                        {description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-[#00FFB3] uppercase tracking-[0.2em] font-black opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        AI Video Active
                    </div>
                </div>
            </div>

            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFB3]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.div>
    );
}
