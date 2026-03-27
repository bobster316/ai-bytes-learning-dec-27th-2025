"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, Square, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceAvatarProps {
    className?: string;
    src?: string;
    keyColor?: { r: number; g: number; b: number };
    transparent?: boolean;
    controls?: boolean;
    overlayControls?: boolean;
    externalIsPlaying?: boolean;
    poster?: string;
    instructor?: 'sarah' | 'gemma';
}

export function VoiceAvatar({
    className,
    src,
    keyColor = { r: 0, g: 255, b: 0 },
    transparent = false,
    controls = true,
    overlayControls = false,
    externalIsPlaying,
    poster,
    instructor = 'sarah'
}: VoiceAvatarProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Animation Frame ID and frame skip counter
    const requestRef = useRef<number | null>(null);
    const frameCountRef = useRef(0);

    const processFrame = useCallback(() => {
        if (transparent) return; // No processing needed for transparent videos

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // Skip every other frame for better performance (30fps instead of 60fps)
        frameCountRef.current++;
        if (frameCountRef.current % 2 !== 0) {
            if (isPlaying) {
                requestRef.current = requestAnimationFrame(processFrame);
            }
            return;
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: true });
        if (!ctx) return;

        // Set canvas dimensions to match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
        }

        // Draw current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Simple Green Screen Removal (Chroma Key)
        // Only apply if we actually have image data
        if (canvas.width > 0 && canvas.height > 0) {
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const l = frame.data.length / 4;

            for (let i = 0; i < l; i++) {
                const r = frame.data[i * 4 + 0];
                const g = frame.data[i * 4 + 1];
                const b = frame.data[i * 4 + 2];

                // Simple Green Dominance Check which is more robust for lighting
                // If Green is significantly brighter than Red and Blue
                if (g > r + 45 && g > b + 45) {
                    frame.data[i * 4 + 3] = 0;
                }
            }
            ctx.putImageData(frame, 0, 0);
        }

        if (isPlaying) {
            requestRef.current = requestAnimationFrame(processFrame);
        }
    }, [keyColor, isPlaying, transparent]);

    // Initial draw and seek updates (ONLY ONCE)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleDraw = () => {
            if (video.readyState >= 2) {
                processFrame();
            }
        };

        const handleMetadata = () => {
            const canvas = canvasRef.current;
            if (canvas && video) {
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 360;
                processFrame();
            }
        };

        video.addEventListener('loadeddata', handleDraw);
        video.addEventListener('seeked', handleDraw);
        video.addEventListener('canplay', handleDraw);
        video.addEventListener('loadedmetadata', handleMetadata);

        video.preload = "auto";
        video.currentTime = 0;

        return () => {
            video.removeEventListener('loadeddata', handleDraw);
            video.removeEventListener('seeked', handleDraw);
            video.removeEventListener('canplay', handleDraw);
            video.removeEventListener('loadedmetadata', handleMetadata);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []); // Only run on mount to setup listeners

    // Force video reload when src changes
    useEffect(() => {
        if (videoRef.current && src) {
            videoRef.current.load();
            setHasStarted(false);
            setIsPlaying(false);
            setIsLoading(false);
        }
    }, [src]);

    // Watch isPlaying to trigger loop
    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(processFrame);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, processFrame]);

    // Construct external control effect
    useEffect(() => {
        if (externalIsPlaying === undefined || !videoRef.current) return;

        if (externalIsPlaying) {
            if (src) {
                videoRef.current.play().catch(e => console.error("Auto-play prevented:", e));
                setIsPlaying(true);
            }
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [externalIsPlaying, src]);


    const togglePlay = () => {
        if (videoRef.current) {
            if (!src) {
                // Silently return to avoid console spam during job processing
                return;
            }

            if (videoRef.current.paused) {
                // Optimistically remove poster layer
                setHasStarted(true);
                setIsPlaying(true);

                setIsLoading(true);
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.warn("Playback failed:", e);
                        setIsPlaying(false);
                        setIsLoading(false);
                        setHasStarted(false); // Reset so poster comes back if blocked
                    });
                }
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    const stopVideo = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            // setIsPlaying is updated by onPause event on the video element
            // 'seeked' event will trigger handleDraw to redraw the first frame
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className={cn("relative w-full h-full overflow-hidden", className)}>
            {/* Main Video Viewport */}
            <div className="absolute inset-0 w-full h-full bg-transparent">
                {/* Video Source - Visible if transparent */}
                <video
                    ref={videoRef}
                    src={src}
                    className={transparent ? "w-full h-full object-cover" : "opacity-0 pointer-events-none absolute inset-0 w-full h-full"}
                    playsInline
                    muted={isMuted}
                    preload="auto"
                    crossOrigin="anonymous"
                    onPlay={() => {
                        setIsPlaying(true);
                        setHasStarted(true);
                        setIsLoading(false);
                    }}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                        setIsPlaying(false);
                        setHasStarted(false);
                    }}
                    onWaiting={() => setIsLoading(true)}
                    onPlaying={() => setIsLoading(false)}
                    onStalled={() => setIsLoading(true)}
                    onClick={togglePlay}
                />

                {/* Poster Image Overlay - Visible when not playing and not yet started */}
                {(poster || (instructor === 'gemma' ? '/gemma_host.png' : '/sarah_host.png')) && !hasStarted && (
                    <div
                        className="absolute inset-0 w-full h-full z-10 cursor-pointer"
                        onClick={togglePlay}
                    >
                        <img
                            src={poster || (instructor === 'gemma' ? '/gemma_host.png' : '/sarah_host.png')}
                            alt="Video Thumbnail"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Display Canvas (Chroma Key) - Only if not transparent */}
                {!transparent && (
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={togglePlay}
                    />
                )}

                {/* Loading State Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-20 pointer-events-none">
                        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                    </div>
                )}
            </div>

            {/* Controls */}
            {controls && (
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all"
                        onClick={stopVideo}
                        title="Stop"
                    >
                        <Square className="w-3 h-3 fill-current" />
                    </Button>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="w-10 h-10 rounded-full bg-white text-slate-900 hover:bg-cyan-400 border-none shadow-lg transition-all"
                        onClick={togglePlay}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </Button>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all"
                        onClick={toggleMute}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                </div>
            )}
        </div>
    );
}
