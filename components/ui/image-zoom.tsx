"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2 } from "lucide-react";
import { createPortal } from "react-dom";

interface ImageZoomProps {
    src: string;
    alt: string;
    className?: string;
    caption?: string;
}

export function ImageZoom({ src, alt, className, caption }: ImageZoomProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        if (isOpen) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen]);

    // Prevent scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <>
            <div
                className={`relative group cursor-zoom-in overflow-hidden rounded-xl border border-white/5 bg-[#141422] ${className}`}
                onClick={toggleOpen}
            >
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <Maximize2 className="w-4 h-4 text-white" />
                        <span className="text-white text-xs font-semibold">Enlarge Image</span>
                    </div>
                </div>
            </div>

            {isOpen && typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#05050A]/95 backdrop-blur-xl"
                        onClick={toggleOpen}
                    >
                        <motion.div
                            className="absolute top-6 right-6 z-10"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <button
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </motion.div>

                        <motion.div
                            layoutId={`image-${src}`}
                            className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={src}
                                alt={alt}
                                className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10"
                            />

                            {caption && (
                                <motion.div
                                    className="mt-6 text-[#C8C8E0] text-center max-w-[600px] leading-relaxed"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <p className="font-body text-base italic">
                                        {caption}
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
