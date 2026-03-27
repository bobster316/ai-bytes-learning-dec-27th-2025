"use client";
import React, { useState } from 'react';
import { ExpandableBlock } from "@/lib/types/lesson-blocks";
import { ChevronDown, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function GoDeeper(props: ExpandableBlock) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-10"
        >
            <div className="bg-[#0f0f1c] border border-[#4b98ad]/20 rounded-2xl overflow-hidden shadow-md">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-[#242B4A]/30 transition-colors focus:outline-none group"
                    aria-expanded={isOpen}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full border border-[#4b98ad]/30 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'bg-[#4b98ad]/20 rotate-45' : 'bg-transparent'}`}>
                            <PlusCircle className={`w-5 h-5 ${isOpen ? 'text-[#4b98ad]' : 'text-[#8A8AB0]'}`} />
                        </div>
                        <span className="font-display font-bold text-[17px] text-white">
                            {props.triggerText || "Go deeper: The detail behind it"}
                        </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-[#8A8AB0] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.25, 0, 0, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="p-6 md:p-8 pt-4 border-t border-[#4b98ad]/10 bg-[#161B33]/50">
                                <p className="font-body text-[16px] text-[#C8C8E0] leading-[1.8]">
                                    {props.content}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
