"use client";

import { motion } from "framer-motion";
import { ConceptIllustrationBlock } from "@/lib/types/lesson-blocks";
import { useCourseDNA } from "../course-dna-provider";

export function ConceptIllustration({ concept, description, imageUrl }: ConceptIllustrationBlock & { imageUrl?: string }) {
    const { primary_colour } = useCourseDNA();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl bg-white/[0.025] border border-white/[0.08] overflow-hidden"
        >
            {/* Visual area */}
            <div className="h-56 sm:h-64 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                    <img src={imageUrl} alt={concept} className="w-full h-full object-cover" />
                ) : (
                    /* Clean placeholder — concept title as the visual when no image available */
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-10"
                        style={{ background: `linear-gradient(135deg, ${primary_colour}08, ${primary_colour}14)` }}
                    >
                        <div className="w-10 h-px" style={{ background: primary_colour, opacity: 0.4 }} />
                        <p className="font-display font-black text-white text-center text-xl leading-tight tracking-tight max-w-xs">
                            {concept}
                        </p>
                        <div className="w-10 h-px" style={{ background: primary_colour, opacity: 0.4 }} />
                    </div>
                )}
            </div>

            {/* Caption */}
            <div className="px-8 py-5 border-t border-white/[0.08]">
                <p className="font-display font-bold text-white text-sm">{concept}</p>
                <p className="font-mono text-[10px] text-white/35 mt-1">{description}</p>
            </div>
        </motion.div>
    );
}
