"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function FullImageSection({ imageUrl, image_url, url, imageAlt, alt_text, caption, captionHighlight, callouts = [] }: any) {
    const finalUrl = imageUrl || image_url || url;
    const finalAlt = imageAlt || alt_text;
    const [isLoaded, setIsLoaded] = React.useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const containerRef = React.useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.02]);
    const yShift = useTransform(scrollYProgress, [0, 1], [0, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);

    React.useEffect(() => {
        if (imgRef.current?.complete) setIsLoaded(true);
        if (videoRef.current?.readyState && videoRef.current.readyState >= 3) setIsLoaded(true);
    }, [finalUrl]);

    return (
        <>
            <style>{`@keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }`}</style>
            <section
                ref={containerRef}
                className="relative overflow-hidden aspect-video bg-[#05050A] rounded-[2.5rem] my-12 shadow-2xl"
            >
                <motion.div
                    style={{ scale, y: yShift, opacity }}
                    className="absolute inset-0 w-full h-full"
                >
                    {finalUrl ? (
                        finalUrl.match(/\.(mp4|webm)$/i) ? (
                            <video
                                ref={videoRef}
                                src={finalUrl}
                                className="w-full h-full object-contain"
                                autoPlay
                                loop
                                muted
                                playsInline
                                onLoadedData={() => setIsLoaded(true)}
                            />
                        ) : (
                            <motion.img
                                ref={imgRef}
                                initial={{ filter: "blur(20px)", opacity: 0 }}
                                animate={isLoaded ? { filter: "blur(0px)", opacity: 1 } : {}}
                                transition={{ duration: 0.8 }}
                                src={finalUrl}
                                alt={finalAlt || "Lesson illustration"}
                                className="w-full h-full object-contain"
                                onLoad={() => setIsLoaded(true)}
                            />
                        )
                    ) : (
                        <div className="flex items-center justify-center h-full bg-[#141422] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(110deg,#141422_0%,#1E1E35_40%,#141422_60%)] bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />
                            <div className="text-center p-10 relative z-10">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#00FFB3]/10 flex items-center justify-center border border-[#00FFB3]/20 shadow-[0_0_30px_rgba(0,255,179,0.1)]">
                                    <ImageIcon className="w-8 h-8 text-[#00FFB3] opacity-40 animate-pulse" />
                                </div>
                                <div className="font-display text-[11px] font-black text-[#8A8AB0] uppercase tracking-[0.4em] max-w-[320px] mx-auto mb-2 opacity-80">
                                    Visual Loading...
                                </div>
                                <div className="font-mono text-[9px] text-[#8A8AB0]/30 uppercase tracking-[0.2em]">
                                    Synthesizing visual...
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Cinematic Overlays - Reduced intensity for better visibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                {/* Interactive Callouts */}
                {callouts.map((callout: any, idx: number) => (
                    <div
                        key={idx}
                        className="absolute z-20 group"
                        style={{ left: `${callout.x}%`, top: `${callout.y}%` }}
                    >
                        <motion.button
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            className="w-8 h-8 rounded-full bg-[#00FFB3] text-[#141422] font-black text-xs flex items-center justify-center shadow-[0_0_20px_rgba(0,255,179,0.4)] border border-white/20 relative"
                        >
                            {idx + 1}
                            <div className="absolute inset-0 rounded-full bg-[#00FFB3] animate-ping opacity-30" />
                        </motion.button>

                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none">
                            <div className="bg-[#141422]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-64 shadow-2xl">
                                <h4 className="font-display font-black text-white text-[10px] uppercase tracking-widest mb-1">{callout.title}</h4>
                                <p className="font-body text-xs text-white/70 leading-relaxed">{callout.description}</p>
                            </div>
                            <div className="w-2 h-2 bg-[#141422] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-white/10" />
                        </div>
                    </div>
                ))}

                {/* Caption Overlay */}
                {(caption || captionHighlight) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8 text-center"
                    >
                        <p className="font-body text-sm md:text-base text-white/80 tracking-wide leading-relaxed drop-shadow-lg">
                            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 mr-3 text-[10px] font-mono uppercase tracking-[0.2em] text-[#00FFB3]">Insight</span>
                            {caption}
                            {captionHighlight && (
                                <span className="text-[#00FFB3] font-bold"> — {captionHighlight}</span>
                            )}
                        </p>
                    </motion.div>
                )}
            </section>
        </>
    );
}
