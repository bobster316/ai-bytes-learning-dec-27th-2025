"use client";

import React, { useRef, useEffect, useState } from 'react';
import { cn } from "@/lib/utils";

interface GreenScreenVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    threshold?: number;
    smoothing?: number;
    showLogo?: boolean; // New prop for user requirement
}

export const GreenScreenVideo = ({
    className,
    src,
    threshold = 0.4,
    smoothing = 0.1,
    showLogo = false,
    processGreenScreen = true,
    ...props
}: GreenScreenVideoProps & { processGreenScreen?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false); // Default to unmuted for avatars
    const [showControls, setShowControls] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const triggerControls = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlayStatus = () => setIsPlaying(true);
        const handlePauseStatus = () => setIsPlaying(false);

        video.addEventListener('play', handlePlayStatus);
        video.addEventListener('pause', handlePauseStatus);

        return () => {
            video.removeEventListener('play', handlePlayStatus);
            video.removeEventListener('pause', handlePauseStatus);
        };
    }, []);

    const togglePlay = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) video.play();
        else video.pause();
        triggerControls();
    };

    const toggleMute = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
        triggerControls();
    };

    useEffect(() => {
        if (!processGreenScreen) return; // Skip canvas logic if not needed

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const render = () => {
            if (video.paused || video.ended) return;

            // Set canvas size to match video
            if (canvas.width !== video.videoWidth) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            // Draw video frame to temporary canvas or directly
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get image data
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = frame.data;
            const len = data.length;

            // Chroma Key Logic (Target: #00FF00 Green)
            for (let i = 0; i < len; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const rbMax = Math.max(r, b);
                const diff = g - rbMax;

                // Improved threshold logic
                if (g > 80 && diff > 40 && g > r * 1.2 && g > b * 1.2) {
                    data[i + 3] = 0; // Transparent
                }
            }

            ctx.putImageData(frame, 0, 0);
            requestRef.current = requestAnimationFrame(render);
        };

        const onPlay = () => {
            render();
        };

        video.addEventListener('play', onPlay);

        return () => {
            video.removeEventListener('play', onPlay);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [src, threshold, processGreenScreen]);

    return (
        <div className={`relative group ${className}`}>
            {/* Standard Video (Hidden but active for audio/state) */}
            <video
                ref={videoRef}
                src={src}
                className={processGreenScreen ? "opacity-0 pointer-events-none absolute inset-0 w-full h-full" : "w-full h-full object-cover"}
                muted={isMuted}
                playsInline
                crossOrigin="anonymous"
                {...props}
            />

            {/* Display Canvas (Only if processing green screen) */}
            {processGreenScreen && (
                <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={togglePlay}
                />
            )}

            {/* Visual Controls Overlay (Custom) */}
            <div
                className={cn(
                    "absolute bottom-4 left-4 right-4 flex items-center justify-between transition-opacity duration-300 z-20 pointer-events-none",
                    showControls ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
            >
                <div className="flex gap-3 pointer-events-auto">
                    <button
                        onClick={togglePlay}
                        className="bg-black/60 hover:bg-black/80 p-0 rounded-full text-white backdrop-blur-md border border-white/10 w-12 h-12 flex items-center justify-center transition-all active:scale-95 shadow-xl"
                    >
                        {isPlaying ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        )}
                    </button>
                    <button
                        onClick={toggleMute}
                        className="bg-black/60 hover:bg-black/80 p-0 rounded-full text-white backdrop-blur-md border border-white/10 w-12 h-12 flex items-center justify-center transition-all active:scale-95 shadow-xl"
                    >
                        {isMuted ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.24.15-.49.27-.75.37v2.03c.81-.2 1.55-.54 2.15-.99L20.27 23 21 21.73 4.27 3zM10 15.17L7.83 13H5v-2h2.83l.88-.88L10 11.41v3.76z" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                        )}
                    </button>
                </div>

                {/* Autoplay blocked fallback */}
                {!isPlaying && !videoRef.current?.paused === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-auto cursor-pointer rounded-3xl" onClick={togglePlay}>
                        <div className="bg-primary/90 text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-bounce">
                            Click to Start AI Host
                        </div>
                    </div>
                )}
            </div>

            {/* DOM-based Logo Overlay for Crispness */}
            {showLogo && (
                <div className="absolute top-4 right-4 z-10 w-16 md:w-24 opacity-90">
                    <img
                        src="/logos/ai bytes learning light blue logo dark.png"
                        alt="AI Bytes Logo"
                        className="w-full h-auto drop-shadow-md"
                    />
                </div>
            )}
        </div>
    );
};
