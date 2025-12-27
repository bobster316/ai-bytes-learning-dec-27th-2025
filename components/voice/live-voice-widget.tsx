"use client";

import { useState, useRef, useEffect } from "react";
import { useLiveAPI } from "@/hooks/use-live-api";
import { Mic, MicOff, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function LiveVoiceWidget() {
    const { isConnected, isListening, connect, disconnect, volume } = useLiveAPI();
    const [isOpen, setIsOpen] = useState(false);

    // Auto-connect when opened? Or explicit click? Explicit is better for permissions.

    const handleToggle = () => {
        if (isOpen) {
            setIsOpen(false);
            disconnect();
        } else {
            setIsOpen(true);
            connect(); // Start connection immediately on open
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", bounce: 0.4 }}
                        className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl w-[350px] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                <span className="text-sm font-medium text-slate-200">Gemini Live</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleToggle}
                                className="h-8 w-8 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Visualizer Area */}
                        <div className="h-32 flex items-center justify-center relative mb-8">
                            {/* Central Glow */}
                            <div className={`absolute w-24 h-24 bg-cyan-500/20 rounded-full blur-3xl transition-all duration-300 ${isListening ? 'opacity-100 scale-150' : 'opacity-50 scale-100'}`} />

                            {/* Pulsing Rings */}
                            {isListening ? (
                                <div className="relative flex items-center justify-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.2 + volume, 1] }}
                                        transition={{ duration: 0.5, repeat: Infinity }}
                                        className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.5)] z-10"
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.5 + volume, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                        className="absolute w-16 h-16 rounded-full border border-cyan-500/50"
                                    />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-slate-500" />
                                </div>
                            )}
                        </div>

                        {/* Status / Controls */}
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-center text-slate-300 font-light translate-y-2">
                                {isConnected ? "Listening..." : "Connecting..."}
                            </p>

                            <Button
                                size="lg"
                                variant="destructive"
                                className="rounded-full w-16 h-16 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50"
                                onClick={handleToggle}
                            >
                                <MicOff className="w-6 h-6" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggle}
                    className="relative group w-14 h-14 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 p-[1px] shadow-[0_0_40px_rgba(8,145,178,0.4)]"
                >
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center group-hover:bg-slate-900 transition-colors relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Zap className="w-6 h-6 text-cyan-400 fill-cyan-400 group-hover:text-white transition-colors" />
                    </div>
                </motion.button>
            )}
        </div>
    );
}
