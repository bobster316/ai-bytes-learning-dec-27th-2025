"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { VideoSnippetBlock } from "@/lib/types/lesson-blocks";
import { Play, Pause, Volume2, VolumeX, Film, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export function VideoSnippet(props: VideoSnippetBlock) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Duration in milliseconds — driven from props so the progress bar stays in sync
    const durationMs = (props.duration ?? 8) * 1000;

    // ─── Autoplay-on-scroll via IntersectionObserver ──────────────────────────
    useEffect(() => {
        const container = containerRef.current;
        const video = videoRef.current;
        if (!container || !video || !props.videoUrl) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    // At least 50% of the video is in the viewport — autoplay
                    video.play().then(() => setIsPlaying(true)).catch(() => {
                        // Autoplay blocked by browser policy — fail silently
                    });
                } else {
                    // Out of view — pause
                    video.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(container);
        return () => observer.disconnect();
    }, [props.videoUrl]);

    // ─── Progress bar update (driven from currentTime) ────────────────────────
    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video || video.duration === 0) return;
        setProgress((video.currentTime / video.duration) * 100);
    }, []);

    // Reset progress when video loops
    const handleEnded = useCallback(() => {
        setProgress(0);
        // Video has loop attr so it restarts — just reset UI
    }, []);

    // ─── Manual play/pause ────────────────────────────────────────────────────
    const handlePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;
        if (isPlaying) {
            video.pause();
            setIsPlaying(false);
        } else {
            video.play().then(() => setIsPlaying(true)).catch(() => { });
        }
    };

    const handleMuteToggle = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleReload = () => {
        const video = videoRef.current;
        if (!video) return;
        setHasError(false);
        video.load();
        video.play().then(() => setIsPlaying(true)).catch(() => { });
    };

    // We now always render the block. If videoUrl is missing, we drop into the 'Visual Signal Lost' state.

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
        >
            {/* ── Video Player (Left Side) ────────────────────────────────────── */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <div className="rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.3)] relative group bg-black aspect-video">
                    {props.videoUrl && !hasError ? (
                        <>
                            <video
                                ref={videoRef}
                                src={props.videoUrl}
                                className="w-full h-full object-cover brightness-[1.1] contrast-[1.05]"
                                loop
                                muted={isMuted}
                                playsInline
                                preload="auto"
                                onLoadedData={() => setIsLoaded(true)}
                                onCanPlayThrough={() => setIsLoaded(true)}
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={handleEnded}
                                onError={() => setHasError(true)}
                            />

                            {/* Subtle loading shimmer until ready */}
                            {!isLoaded && (
                                <div className="absolute inset-0 bg-[#141422] animate-pulse" />
                            )}

                            {/* Control overlay — fades in on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <div className="flex items-center gap-3">
                                    {/* Play / Pause */}
                                    <button
                                        onClick={handlePlayPause}
                                        className="w-10 h-10 rounded-full bg-[#00FFB3] text-slate-900 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                        aria-label={isPlaying ? "Pause" : "Play"}
                                    >
                                        {isPlaying
                                            ? <Pause className="w-4 h-4 fill-current" />
                                            : <Play className="w-4 h-4 fill-current ml-0.5" />
                                        }
                                    </button>

                                    {/* Mute / Unmute */}
                                    <button
                                        onClick={handleMuteToggle}
                                        className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                                        aria-label={isMuted ? "Unmute" : "Mute"}
                                    >
                                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                    </button>

                                    {/* Progress bar — driven by actual video currentTime */}
                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            ref={progressRef}
                                            className="h-full bg-[#00FFB3] rounded-full transition-none"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    {/* Elapsed / total */}
                                    <span className="text-[10px] font-mono text-white/50 tabular-nums">
                                        {props.duration ?? 8}s
                                    </span>
                                </div>
                            </div>

                            {/* Paused overlay — big centred play button */}
                            {!isPlaying && isLoaded && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                                    onClick={handlePlayPause}
                                >
                                    <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:scale-110 transition-transform">
                                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (!props.videoUrl || hasError) ? (
                        /* Error state */
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141422] gap-4 p-4 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-center">
                                <Film className="w-6 h-6 text-red-400/30" />
                            </div>
                            <div className="text-center">
                                <p className="text-[#8A8AB0] font-mono text-[10px] uppercase tracking-widest mb-2 opacity-50">Visual Signal Lost</p>
                                <p className="text-[#8A8AB0]/50 font-mono text-[9px] max-w-[200px] mx-auto mb-4">
                                    {!props.videoUrl ? "Failed to resolve related HD video or animation." : "Video failed to load."}
                                </p>
                                {props.videoUrl && (
                                    <button
                                        onClick={handleReload}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-[#00FFB3] hover:bg-white/10 transition-all mx-auto"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Re-establish Link
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Generating placeholder */
                        <div className="absolute inset-0 flex items-center justify-center bg-[#141422] overflow-hidden">
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-[linear-gradient(110deg,#141422_0%,#1E1E35_40%,#141422_60%)] bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />

                            <div className="text-center relative z-10">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#00FFB3]/5 flex items-center justify-center border border-[#00FFB3]/10">
                                    <Film className="w-8 h-8 text-[#00FFB3]/30 animate-pulse" />
                                </div>
                                <div className="text-[#8A8AB0] font-display font-black text-[11px] uppercase tracking-[0.4em] mb-2 opacity-80">AI Motion Graphics</div>
                                <div className="text-[#8A8AB0]/40 font-mono text-[9px] uppercase tracking-widest">Resolving High-Fidelity Video</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Description panel — hidden when empty */}
                {props.description && (
                    <div className="mt-3 px-5 py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/[0.06]">
                        <p className="font-serif italic text-sm text-[#B0B0C8] leading-relaxed">
                            {props.description}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Description (Right Side) ────────────────────────────────────── */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-center">
                <div className="w-10 h-10 rounded-xl bg-[#00FFB3]/15 flex items-center justify-center mb-4">
                    <Film className="w-5 h-5 text-[#00FFB3]" />
                </div>
                <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#00FFB3] uppercase mb-2">
                    Visual Insight · AI Video
                </div>
                <h3 className="text-2xl text-white font-bold leading-tight mb-4">{props.title}</h3>
                <p className="font-serif text-[17px] text-[#8A8AB0] leading-relaxed mb-6">
                    {props.caption}
                </p>
                <div className="flex items-center gap-3 border-t border-white/5 pt-5">
                    <span className="text-[10px] font-mono text-[#8A8AB0] bg-white/5 px-3 py-1.5 rounded uppercase tracking-wider">
                        Duration: {props.duration ?? 8}s
                    </span>
                    {props.videoUrl && (
                        <span className="text-[9px] font-mono text-[#00FFB3]/50 bg-[#00FFB3]/5 px-3 py-1.5 rounded tracking-[0.2em] uppercase">
                            Auto-Playing
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
