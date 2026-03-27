"use client";

import { motion } from "framer-motion";
import { Lightbulb, AlertTriangle, Brain } from "lucide-react";

export function CalloutBox({ variant, icon, title, text, body }: any) {
    const isTip = variant === "tip";
    const isInfo = variant === "info";

    let containerClasses = "";
    let iconContainerClasses = "";

    if (isTip) {
        containerClasses = "bg-[#00FFB3]/5 border-l-[3px] border-l-[#00FFB3] border border-white/5";
        iconContainerClasses = "bg-[#00FFB3]/15 text-[#00FFB3]";
    } else if (isInfo) {
        containerClasses = "bg-[#4b98ad]/5 border-l-[3px] border-l-[#4b98ad] border border-white/5";
        iconContainerClasses = "bg-[#4b98ad]/15 text-[#4b98ad]";
    } else {
        containerClasses = "bg-[#FFB347]/5 border-l-[3px] border-l-[#FFB347] border border-white/5";
        iconContainerClasses = "bg-[#FFB347]/15 text-[#FFB347]";
    }

    const DefaultIcon = isTip ? (
        <Lightbulb className="w-5 h-5 text-[#00FFB3]" />
    ) : isInfo ? (
        <Brain className="w-5 h-5 text-[#4b98ad]" />
    ) : (
        <AlertTriangle className="w-5 h-5 text-[#FFB347]" />
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`flex gap-4 p-6 mb-4 rounded-xl border-b border-white/[0.03] ${containerClasses}`}
        >
            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${iconContainerClasses}`}>
                {icon && icon.length <= 2 ? (
                    <span className="text-lg">{icon}</span>
                ) : DefaultIcon}
            </div>
            <div>
                {title && (
                    <div className="font-display text-[15px] font-bold text-white mb-1.5">
                        {title}
                    </div>
                )}
                <div
                    className="font-body text-[15px] text-[#C8C8E0] leading-relaxed [&_strong]:text-white [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: text || body || "" }}
                />
            </div>
        </motion.div>
    );
}
