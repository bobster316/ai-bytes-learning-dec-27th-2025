"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, Maximize, Volume2, VolumeX, Film, Image as LucideImage } from "lucide-react";

interface VideoPlayerProps {
    url?: string;        // Cinematic cinematic video overview
    introUrl?: string;   // AI Avatar intro video
    audioUrl?: string;   // NotebookLM narration audio (separate from video)
    images?: any[];      // Lesson images for slideshow fallback
    onClose?: () => void;
    title?: string;
}

export function CinematicVideoPlayer({ url, introUrl, audioUrl, images = [], onClose, title }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isIntroPlaying, setIsIntroPlaying] = useState(!!introUrl);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [mounted, setMounted] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Determines which element drives progress/controls in the current phase
    const getActiveMedia = () => {
        if (isIntroPlaying) return videoRef.current;   // intro AI avatar
        if (url) return videoRef.current;               // main Cinematic video
        return audioRef.current;                        // audio-only slideshow
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync progress bar
    useEffect(() => {
        const updateProgress = () => {
            const media = getActiveMedia();
            if (media && media.duration) {
                setProgress((media.currentTime / media.duration) * 100);
            }
        };
        const interval = setInterval(updateProgress, 500);
        return () => clearInterval(interval);
    }, [isIntroPlaying, url]);

    // Image cycling — only active in audio-only mode (no video url)
    useEffect(() => {
        if (!isIntroPlaying && !url && isPlaying && images.length > 0) {
            const timer = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % images.length);
            }, 6000);
            return () => clearInterval(timer);
        }
    }, [isIntroPlaying, url, isPlaying, images.length]);

    // Start narration audio once intro ends — delay 200ms so React has time to mount the audio element
    useEffect(() => {
        if (!isIntroPlaying && audioUrl) {
            const timer = setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.play().catch(e => {
                        console.warn("Audio autoplay blocked:", e);
                        setIsPlaying(false);
                    });
                }
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isIntroPlaying, audioUrl]);

    const handleVideoEnd = () => {
        if (isIntroPlaying) {
            setIsIntroPlaying(false);
        } else {
            // Main video ended — close if no audio narration still playing
            if (!audioRef.current || audioRef.current.ended || !audioUrl) {
                if (onClose) onClose();
            }
        }
    };

    const skipIntro = () => setIsIntroPlaying(false);

    if (!mounted) return null;

    const togglePlay = () => {
        const media = getActiveMedia();
        if (!media) return;
        if (isPlaying) {
            media.pause();
            // Sync narration audio if playing alongside video
            if (!isIntroPlaying && url && audioRef.current) audioRef.current.pause();
        } else {
            media.play();
            if (!isIntroPlaying && url && audioRef.current) audioRef.current.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        const media = getActiveMedia();
        if (!media) return;
        media.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const media = getActiveMedia();
        if (!media) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        media.currentTime = percent * media.duration;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 lg:p-8 bg-[#0A0A12]/95 backdrop-blur-3xl"
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all z-[130]"
            >
                <X className="w-6 h-6" />
            </button>

            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-4xl aspect-video rounded-[2rem] overflow-hidden bg-black border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] relative group"
            >
                {/* MEDIA LAYERS */}
                <AnimatePresence mode="wait">
                    {isIntroPlaying && introUrl ? (
                        /* 1. INTRO: AI Avatar video */
                        <motion.video
                            key="intro-video"
                            ref={videoRef}
                            src={introUrl}
                            autoPlay
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                            onEnded={handleVideoEnd}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            className="w-full h-full object-contain bg-[#12121A]"
                        />
                    ) : url ? (
                        /* 2. MAIN VIDEO: Cinematic cinematic overview */
                        <motion.video
                            key="main-video"
                            ref={videoRef}
                            src={url}
                            autoPlay
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onEnded={handleVideoEnd}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            className="w-full h-full object-contain bg-[#12121A]"
                        />
                    ) : (
                        /* 3. AUDIO-ONLY: Image slideshow with narration */
                        <motion.div
                            key="audio-slideshow"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full h-full relative overflow-hidden"
                        >
                            <AnimatePresence mode="popLayout">
                                {images.length > 0 ? (
                                    <motion.div
                                        key={`slide-${currentImageIndex}`}
                                        initial={{ opacity: 0, scale: 1.15 }}
                                        animate={{ opacity: 1, scale: [1.15, 1], x: [0, -10, 0] }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="absolute inset-0"
                                    >
                                        <img
                                            src={images[currentImageIndex].image_url}
                                            alt="Lesson Visual"
                                            className="w-full h-full object-cover opacity-60 mix-blend-screen"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                                    </motion.div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/40">
                                        <LucideImage className="w-20 h-20 text-white/10 animate-pulse" />
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* Audio visualiser bars */}
                            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-end gap-1.5 h-12">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: isPlaying ? [10, 40, 15, 48, 10] : 8 }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-1.5 rounded-full bg-[var(--primary)] opacity-40 shadow-[0_0_10px_var(--primary-glow)]"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Narration Audio — only for explicit audioUrl, never falls back to video url */}
                {audioUrl && !isIntroPlaying && (
                    <audio
                        key="narration-audio"
                        ref={audioRef}
                        src={audioUrl}
                        autoPlay
                        onEnded={url ? undefined : onClose}
                        onError={(e) => console.error("Audio playback error:", e)}
                        className="hidden"
                    />
                )}

                {/* Skip Intro */}
                <AnimatePresence>
                    {isIntroPlaying && (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onClick={skipIntro}
                            className="absolute top-24 right-8 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-xl transition-all z-[140] flex items-center gap-2 group"
                        >
                            Skip AI Intro
                            <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                →
                            </motion.span>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Controls Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A12] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-10 z-[120]">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={togglePlay}
                                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-[var(--primary)] transition-colors shadow-2xl"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                                </motion.button>
                                <div className="flex flex-col">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--primary)] font-black">
                                        {isIntroPlaying ? "AI Audio Guide Intro" : "NotebookLM Deep Dive Visuals"}
                                    </span>
                                    <h4 className="text-white font-outfit text-xl font-extrabold tracking-tight mt-1">{title}</h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
                                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                </button>
                                <button className="text-white/60 hover:text-white transition-colors">
                                    <Maximize className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-4">
                            <div
                                className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer relative group/progress"
                                onClick={seek}
                            >
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-[var(--primary)] shadow-[0_0_25px_var(--primary-glow)]"
                                    style={{ width: `${progress}%` }}
                                />
                                <div className="absolute inset-0 opacity-0 group-hover/progress:opacity-100 bg-white/5 transition-opacity pointer-events-none" />
                            </div>
                            <div className="flex justify-between font-mono text-[9px] text-white/40 uppercase tracking-[0.4em] font-black">
                                <span>{getActiveMedia() ? formatTime(getActiveMedia()!.currentTime) : "0:00"}</span>
                                <span>{getActiveMedia() ? formatTime(getActiveMedia()!.duration) : "0:00"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding Tag */}
                <div className="absolute top-8 left-8 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-2.5 shadow-2xl group-hover:opacity-0 transition-opacity">
                    <Film className="w-3.5 h-3.5 text-[var(--primary)] animate-pulse" />
                    <span className="font-mono text-[9px] font-black text-white/70 uppercase tracking-[0.3em]">Advanced Multimodal Overview</span>
                </div>
            </motion.div>
        </motion.div>
    );
}

function formatTime(seconds: number) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
