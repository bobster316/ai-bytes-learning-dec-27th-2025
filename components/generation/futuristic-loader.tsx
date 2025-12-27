"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const FuturisticLoader = ({ progress, status }: { progress: number; status: string }) => {
    // Generate some random binary data for visual effect
    const [binaryData, setBinaryData] = useState<string[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const newBinary = Array.from({ length: 8 }, () => Math.random() > 0.5 ? "1" : "0").join("");
            setBinaryData(prev => [newBinary, ...prev.slice(0, 5)]);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-[#050510] flex items-center justify-center z-50 overflow-hidden font-mono text-cyan-400">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(10,25,40,1)_1px,transparent_1px),linear-gradient(90deg,rgba(10,25,40,1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 perspective-[1000px] transform-style-3d rotate-x-60" />

            <div className="relative w-full max-w-4xl p-10 flex flex-col items-center">

                {/* Central H.U.D Ring */}
                <div className="relative w-64 h-64 mb-16 flex items-center justify-center">
                    {/* Outer Rings */}
                    <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-cyan-500/20 rounded-full border-t-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                    />
                    <motion.div
                        initial={{ rotate: 0, scale: 0.9 }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border border-purple-500/20 rounded-full border-b-purple-500 border-dashed"
                    />

                    {/* Inner Core */}
                    <div className="relative z-10 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            key={progress}
                            className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 filter drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                        >
                            {Math.round(progress)}%
                        </motion.div>
                        <div className="text-[10px] tracking-[0.4em] uppercase text-cyan-500/60 mt-2">System Synthesis</div>
                    </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-1 bg-cyan-900/30 rounded-full overflow-hidden relative mb-8">
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "easeInOut" }}
                        className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 relative"
                    >
                        <div className="absolute top-0 right-0 h-full w-20 bg-white/50 blur-[10px]" />
                    </motion.div>
                </div>

                {/* Status Logs */}
                <div className="w-full grid grid-cols-2 gap-8 text-xs">
                    <div className="space-y-1 text-cyan-500/60">
                        <div>&gt; INITIATING NEURAL HANDSHAKE...</div>
                        <div>&gt; ALLOCATING QUANTUM BUFFERS...</div>
                        <div className="text-cyan-300 glow-text">&gt; {status.toUpperCase()}</div>
                    </div>
                    <div className="text-right space-y-1 font-mono text-[10px] text-purple-400/50">
                        {binaryData.map((bin, i) => (
                            <div key={i}>{bin}</div>
                        ))}
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500" />
            </div>
        </div>
    );
};

export default FuturisticLoader;
