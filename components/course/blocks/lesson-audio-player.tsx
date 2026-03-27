"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, X, Volume2, AlertCircle } from "lucide-react";

interface AudioPlayerProps {
    url: string;
    onClose?: () => void;
    onPlayStateChange?: (isPlaying: boolean) => void;
    title?: string;
}

function AudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
    return (
        <div className="flex items-end gap-[3px] h-8 px-2">
            {[...Array(10)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={isPlaying ? {
                        height: [8, 24, 12, 28, 10, 20, 8][(i % 7)],
                    } : { height: 4 }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.05,
                        ease: "easeInOut"
                    }}
                    className="w-[3px] rounded-full bg-gradient-to-t from-[var(--primary)] to-[var(--primary)]/40 shadow-[0_0_10px_var(--primary-glow)]"
                />
            ))}
        </div>
    );
}

export function LessonAudioPlayer({ url, onClose, onPlayStateChange, title }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [loadError, setLoadError] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const updateProgress = () => {
            if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
        };
        audio.addEventListener("timeupdate", updateProgress);
        return () => audio.removeEventListener("timeupdate", updateProgress);
    }, []);

    const togglePlay = async () => {
        if (!audioRef.current || !url || loadError) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            onPlayStateChange?.(false);
        } else {
            try {
                await audioRef.current.play();
                setIsPlaying(true);
                onPlayStateChange?.(true);
            } catch {
                setLoadError(true);
                setIsPlaying(false);
                onPlayStateChange?.(false);
            }
        }
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || loadError) return;
        const rect = e.currentTarget.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    };

    const changeSpeed = () => {
        const speeds = [1, 1.25, 1.5, 2];
        const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
        setPlaybackRate(next);
        if (audioRef.current) audioRef.current.playbackRate = next;
    };

    return (
        <motion.div
            drag
            dragConstraints={{ left: -500, right: 500, top: -800, bottom: 0 }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 cursor-grab active:cursor-grabbing"
        >
            <div className="bg-[#141422]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/10 via-transparent to-[var(--accent)]/5 opacity-50 pointer-events-none" />

                <div className="flex flex-col gap-4 relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                                    {loadError
                                        ? <AlertCircle className="w-5 h-5 text-red-400" />
                                        : <Volume2 className="w-5 h-5 text-[var(--primary)]" />
                                    }
                                </div>
                                {!loadError && isPlaying && (
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute -inset-1 rounded-full border border-[var(--primary)]/30"
                                    />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--primary)] font-black">AI Recap · Sterling</span>
                                <span className="font-sans text-sm text-white font-bold truncate max-w-[220px]">{title || "Lesson Insight"}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <AudioVisualizer isPlaying={isPlaying && !loadError} />
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/40 hover:text-white border border-white/5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Error state */}
                    {loadError ? (
                        <div className="text-center py-4 px-2">
                            <p className="text-red-400 text-xs font-mono font-bold uppercase tracking-wider">Audio Signal Lost</p>
                            <p className="text-white/30 text-[10px] mt-1 font-medium">The deep-dive recap is currently unavailable. Try re-generating.</p>
                        </div>
                    ) : (
                        <>
                            {/* Controls */}
                            <div className="flex items-center justify-center gap-8 mb-1">
                                <button className="text-white/30 hover:text-[var(--primary)] transition-all transform hover:scale-110" onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}>
                                    <SkipBack className="w-6 h-6 fill-current" />
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.1, boxShadow: "0 0 30px var(--primary-glow)" }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={togglePlay}
                                    className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#141422] shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                >
                                    {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current translate-x-0.5" />}
                                </motion.button>
                                <button className="text-white/30 hover:text-[var(--primary)] transition-all transform hover:scale-110" onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}>
                                    <SkipForward className="w-6 h-6 fill-current" />
                                </button>
                            </div>

                            {/* Progress */}
                            <div className="space-y-3 px-2">
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden cursor-pointer relative" onClick={seek}>
                                    <motion.div
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] shadow-[0_0_15px_var(--primary-glow)]"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] font-black">
                                    <span>{audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00"}</span>
                                    <div className="flex items-center gap-6">
                                        <button onClick={changeSpeed} className="hover:text-[var(--primary)] transition-all px-3 py-1 rounded-lg border border-white/5 bg-white/5 font-black hover:bg-white/10">
                                            {playbackRate}x
                                        </button>
                                        <span>{audioRef.current ? formatTime(audioRef.current.duration) : "0:00"}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {url && (
                    <audio
                        ref={audioRef}
                        src={url}
                        onError={() => setLoadError(true)}
                        onEnded={() => { setIsPlaying(false); onPlayStateChange?.(false); }}
                    />
                )}
            </div>
        </motion.div>
    );
}

function formatTime(seconds: number) {
    if (!seconds || isNaN(seconds)) return "0:00";
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}
