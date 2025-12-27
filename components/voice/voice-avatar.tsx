"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, Square, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceAvatarProps {
    className?: string;
    src?: string;
    keyColor?: { r: number; g: number; b: number };
    transparent?: boolean;
    controls?: boolean;
    externalIsPlaying?: boolean;
}

export function VoiceAvatar({
    className,
    src = "/ai_avatar/ai-avatar-light.mp4",
    keyColor = { r: 0, g: 255, b: 0 },
    transparent = false,
    controls = true,
    externalIsPlaying
}: VoiceAvatarProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

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

    // Initial draw and seek updates
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleDraw = () => {
            // Verify video has data
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

                // Retry drawing a few times to ensure first frame isn't missed
                setTimeout(processFrame, 100);
                setTimeout(processFrame, 500);
                setTimeout(processFrame, 1000);
            }
        };

        video.addEventListener('loadeddata', handleDraw);
        video.addEventListener('seeked', handleDraw);
        video.addEventListener('canplay', handleDraw);
        video.addEventListener('loadedmetadata', handleMetadata);

        // Force load of first frame
        video.preload = "auto";
        // Small seek to trigger rendering of first frame
        video.currentTime = 0.1;

        return () => {
            video.removeEventListener('loadeddata', handleDraw);
            video.removeEventListener('seeked', handleDraw);
            video.removeEventListener('canplay', handleDraw);
            video.removeEventListener('loadedmetadata', handleMetadata);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [processFrame]);

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
            videoRef.current.play().catch(e => console.error("Auto-play prevented:", e));
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [externalIsPlaying]);


    // Controls
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            // setIsPlaying is updated by onPlay/onPause events on the video element
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
        <div className={`flex flex-col gap-3 ${className}`}>
            {/* Main Video Viewport */}
            <div className="relative w-full aspect-square overflow-hidden bg-transparent">
                {/* Video Source - Visible if transparent */}
                <video
                    ref={videoRef}
                    src={src}
                    className={transparent ? "w-full h-full object-contain" : "hidden"}
                    playsInline
                    muted={isMuted}
                    preload="auto"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                />

                {/* Display Canvas (Chroma Key) - Only if not transparent */}
                {!transparent && (
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full object-contain"
                    />
                )}
            </div>

            {/* Controls - Below and Left Aligned */}
            {/* Controls - Below and Left Aligned */}
            {controls && (
                <div className="flex items-center justify-start gap-3 pl-2">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                        onClick={stopVideo}
                        title="Stop"
                    >
                        <Square className="w-5 h-5 fill-current" />
                    </Button>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="w-12 h-12 rounded-full text-white hover:bg-white/10 border border-white/20 hover:border-white/40 backdrop-blur-sm"
                        onClick={togglePlay}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </Button>

                    <Button
                        size="icon"
                        variant="ghost"
                        className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                        onClick={toggleMute}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                </div>
            )}
        </div>
    );
}
