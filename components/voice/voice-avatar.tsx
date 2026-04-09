"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
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

function formatTime(s: number): string {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
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
    instructor = 'sarah',
}: VoiceAvatarProps) {
    const videoRef      = useRef<HTMLVideoElement>(null);
    const canvasRef     = useRef<HTMLCanvasElement>(null);
    const containerRef  = useRef<HTMLDivElement>(null);
    const hideTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestRef    = useRef<number | null>(null);
    const frameCountRef = useRef(0);

    const [isPlaying,       setIsPlaying]       = useState(false);
    const [hasStarted,      setHasStarted]       = useState(false);
    const [isLoading,       setIsLoading]        = useState(false);
    const [isEnded,         setIsEnded]          = useState(false);
    const [isMuted,         setIsMuted]          = useState(false);
    const [volume,          setVolume]           = useState(1);
    const [currentTime,     setCurrentTime]      = useState(0);
    const [duration,        setDuration]         = useState(0);
    const [controlsVisible, setControlsVisible]  = useState(false);
    const [showVolSlider,   setShowVolSlider]     = useState(false);
    const [clickIcon,       setClickIcon]        = useState<'play' | 'pause' | null>(null);

    // ─── Chroma-key canvas renderer ───────────────────────────────────────────
    const processFrame = useCallback(() => {
        if (transparent) return;
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        frameCountRef.current++;
        if (frameCountRef.current % 2 !== 0) {
            if (isPlaying) requestRef.current = requestAnimationFrame(processFrame);
            return;
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: true });
        if (!ctx) return;

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width  = video.videoWidth  || 640;
            canvas.height = video.videoHeight || 360;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (canvas.width > 0 && canvas.height > 0) {
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const len   = frame.data.length / 4;
            for (let i = 0; i < len; i++) {
                const r = frame.data[i * 4];
                const g = frame.data[i * 4 + 1];
                const b = frame.data[i * 4 + 2];
                if (g > r + 45 && g > b + 45) frame.data[i * 4 + 3] = 0;
            }
            ctx.putImageData(frame, 0, 0);
        }

        if (isPlaying) requestRef.current = requestAnimationFrame(processFrame);
    }, [isPlaying, transparent]);

    // ─── Auto-hide controls after 3 s of inactivity ──────────────────────────
    const resetHideTimer = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setControlsVisible(true);
        hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }, []);

    // ─── Setup video event listeners ─────────────────────────────────────────
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onDraw     = () => { if (video.readyState >= 2) processFrame(); };
        const onMeta     = () => {
            const c = canvasRef.current;
            if (c) { c.width = video.videoWidth || 640; c.height = video.videoHeight || 360; }
            setDuration(video.duration || 0);
            processFrame();
        };
        const onTime     = () => setCurrentTime(video.currentTime);
        const onDuration = () => setDuration(video.duration || 0);

        video.addEventListener('loadeddata',    onDraw);
        video.addEventListener('seeked',        onDraw);
        video.addEventListener('canplay',       onDraw);
        video.addEventListener('loadedmetadata', onMeta);
        video.addEventListener('timeupdate',    onTime);
        video.addEventListener('durationchange', onDuration);

        video.preload       = "auto";
        video.currentTime   = 0;

        return () => {
            video.removeEventListener('loadeddata',     onDraw);
            video.removeEventListener('seeked',         onDraw);
            video.removeEventListener('canplay',        onDraw);
            video.removeEventListener('loadedmetadata', onMeta);
            video.removeEventListener('timeupdate',     onTime);
            video.removeEventListener('durationchange', onDuration);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reload when src changes
    useEffect(() => {
        if (videoRef.current && src) {
            videoRef.current.load();
            setHasStarted(false);
            setIsPlaying(false);
            setIsLoading(false);
            setIsEnded(false);
            setCurrentTime(0);
        }
    }, [src]);

    // Trigger canvas loop
    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(processFrame);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isPlaying, processFrame]);

    // External play/pause control
    useEffect(() => {
        if (externalIsPlaying === undefined || !videoRef.current) return;
        if (externalIsPlaying) {
            if (src) { videoRef.current.play().catch(() => {}); setIsPlaying(true); }
        } else {
            videoRef.current.pause(); setIsPlaying(false);
        }
    }, [externalIsPlaying, src]);

    // Keyboard shortcuts (Space, M, ←, →)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!containerRef.current?.contains(document.activeElement) &&
                document.activeElement !== containerRef.current) return;
            switch (e.code) {
                case 'Space':      e.preventDefault(); handleTogglePlay(); break;
                case 'KeyM':       handleToggleMute(); break;
                case 'ArrowRight': if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, duration); break;
                case 'ArrowLeft':  if (videoRef.current) videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0); break;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]);

    // ─── Actions ─────────────────────────────────────────────────────────────
    const flashIcon = (type: 'play' | 'pause') => {
        setClickIcon(type);
        setTimeout(() => setClickIcon(null), 550);
    };

    const handleTogglePlay = useCallback(() => {
        if (!src || !videoRef.current) return;
        if (videoRef.current.paused || isEnded) {
            if (isEnded) videoRef.current.currentTime = 0;
            setHasStarted(true);
            setIsEnded(false);
            setIsLoading(true);
            const p = videoRef.current.play();
            if (p) p.catch(() => { setIsPlaying(false); setIsLoading(false); setHasStarted(false); });
            flashIcon('play');
            resetHideTimer();
        } else {
            videoRef.current.pause();
            setControlsVisible(true);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            flashIcon('pause');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src, isEnded, resetHideTimer]);

    const handleToggleMute = () => {
        if (!videoRef.current) return;
        const next = !isMuted;
        videoRef.current.muted = next;
        setIsMuted(next);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (videoRef.current) {
            videoRef.current.volume = v;
            videoRef.current.muted  = v === 0;
            setIsMuted(v === 0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = parseFloat(e.target.value);
        if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t); }
    };

    const handleReplay = () => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
        setIsEnded(false);
        setHasStarted(true);
        resetHideTimer();
    };

    // ─── Derived values ───────────────────────────────────────────────────────
    const progress   = duration > 0 ? (currentTime / duration) * 100 : 0;
    const posterSrc  = poster || (instructor === 'gemma' ? '/gemma_host.png' : '/sarah_host.png');
    const effectiveVolume = isMuted ? 0 : volume;

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            role="region"
            aria-label="Video player"
            className={cn("relative w-full h-full overflow-hidden outline-none", className)}
            onMouseMove={() => { if (hasStarted && !isEnded) resetHideTimer(); }}
            onMouseLeave={() => { if (isPlaying) setControlsVisible(false); setShowVolSlider(false); }}
        >
            {/* ── Video layer ── */}
            <div className="absolute inset-0">
                <video
                    ref={videoRef}
                    src={src}
                    className={transparent ? "w-full h-full object-cover" : "opacity-0 pointer-events-none absolute inset-0 w-full h-full"}
                    playsInline
                    muted={isMuted}
                    preload="auto"
                    crossOrigin="anonymous"
                    onPlay={()    => { setIsPlaying(true); setHasStarted(true); setIsLoading(false); }}
                    onPause={()   => setIsPlaying(false)}
                    onEnded={()   => { setIsPlaying(false); setHasStarted(false); setIsEnded(true); setControlsVisible(true); }}
                    onWaiting={()  => setIsLoading(true)}
                    onPlaying={()  => setIsLoading(false)}
                    onStalled={()  => setIsLoading(true)}
                    onClick={handleTogglePlay}
                />

                {/* Poster */}
                {posterSrc && !hasStarted && (
                    <div className="absolute inset-0 z-10 cursor-pointer group/poster" onClick={handleTogglePlay}>
                        <img src={posterSrc} alt="Course intro" className="w-full h-full object-cover" />
                        {/* Bottom vignette for depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                        {/* Centered play button */}
                        {controls && src && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                {/* Slow pulse ring */}
                                <span className="absolute w-20 h-20 rounded-full bg-white/15 animate-ping" style={{ animationDuration: '2.4s' }} />
                                <span className="absolute w-20 h-20 rounded-full bg-white/10" />
                                <div className="relative z-10 w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-200 group-hover/poster:scale-110 group-hover/poster:bg-white group-hover/poster:shadow-[0_8px_48px_rgba(0,255,179,0.45)]">
                                    <Play className="w-6 h-6 fill-slate-900 text-slate-900 ml-1" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Canvas (chroma-key output) */}
                {!transparent && (
                    <canvas ref={canvasRef} className="w-full h-full object-cover cursor-pointer" onClick={handleTogglePlay} />
                )}

                {/* Buffering spinner */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-20 pointer-events-none">
                        <div className="w-10 h-10 rounded-full border-[3px] border-white/15 border-t-[#00FFB3] animate-spin shadow-[0_0_16px_rgba(0,255,179,0.3)]" />
                    </div>
                )}

                {/* Click-to-play/pause flash icon */}
                {clickIcon && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                        <div
                            className="w-16 h-16 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center"
                            style={{ animation: 'va-flash 0.55s ease-out forwards' }}
                        >
                            {clickIcon === 'play'
                                ? <Play  className="w-7 h-7 fill-white text-white ml-1" />
                                : <Pause className="w-7 h-7 fill-white text-white" />
                            }
                        </div>
                    </div>
                )}

                {/* Ended overlay */}
                {isEnded && controls && (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 z-20 cursor-pointer gap-3"
                        onClick={handleReplay}
                    >
                        <div className="w-16 h-16 rounded-full bg-white/90 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform">
                            <RotateCcw className="w-6 h-6 text-slate-900" />
                        </div>
                        <p className="text-white/75 text-sm font-medium tracking-wide">Watch again</p>
                    </div>
                )}
            </div>

            {/* ── Control bar (auto-hides) ── */}
            {controls && hasStarted && !isEnded && (
                <div
                    className={cn(
                        "absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out",
                        controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
                    )}
                    onMouseEnter={() => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }}
                    onMouseLeave={() => { if (isPlaying) hideTimerRef.current = setTimeout(() => setControlsVisible(false), 1200); }}
                >
                    {/* Gradient scrim behind controls */}
                    <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none rounded-b-[inherit]" />

                    <div className="relative px-4 pb-3 pt-2 space-y-1.5">
                        {/* ── Progress scrubber ── */}
                        <div className="group/prog flex items-center gap-2">
                            <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                step={0.05}
                                value={currentTime}
                                onChange={handleSeek}
                                className={cn(
                                    "w-full h-1 appearance-none rounded-full cursor-pointer",
                                    "transition-all duration-150 group-hover/prog:h-[5px]",
                                    "[&::-webkit-slider-thumb]:appearance-none",
                                    "[&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3",
                                    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00FFB3]",
                                    "[&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,255,179,0.6)]",
                                    "[&::-webkit-slider-thumb]:opacity-0 group-hover/prog:[&::-webkit-slider-thumb]:opacity-100",
                                    "[&::-webkit-slider-thumb]:scale-100 group-hover/prog:[&::-webkit-slider-thumb]:scale-110",
                                    "[&::-webkit-slider-thumb]:transition-all",
                                    "[&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3",
                                    "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#00FFB3]",
                                    "[&::-moz-range-thumb]:border-0",
                                )}
                                style={{
                                    background: `linear-gradient(to right, #00FFB3 ${progress}%, rgba(255,255,255,0.22) ${progress}%)`,
                                }}
                            />
                        </div>

                        {/* ── Button row ── */}
                        <div className="flex items-center justify-between">
                            {/* Left cluster */}
                            <div className="flex items-center gap-1">
                                {/* Play / Pause */}
                                <button
                                    onClick={handleTogglePlay}
                                    className="w-9 h-9 flex items-center justify-center text-white hover:text-[#00FFB3] transition-colors rounded-full hover:bg-white/10"
                                    title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                                >
                                    {isPlaying
                                        ? <Pause className="w-[18px] h-[18px] fill-current" />
                                        : <Play  className="w-[18px] h-[18px] fill-current ml-0.5" />
                                    }
                                </button>

                                {/* Volume button + expanding slider */}
                                <div
                                    className="flex items-center"
                                    onMouseEnter={() => setShowVolSlider(true)}
                                    onMouseLeave={() => setShowVolSlider(false)}
                                >
                                    <button
                                        onClick={handleToggleMute}
                                        className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10"
                                        title="Mute (M)"
                                    >
                                        {isMuted || effectiveVolume === 0
                                            ? <VolumeX className="w-4 h-4" />
                                            : <Volume2 className="w-4 h-4" />
                                        }
                                    </button>

                                    {/* Volume slider — expands on hover */}
                                    <div className={cn(
                                        "overflow-hidden transition-all duration-200 flex items-center",
                                        showVolSlider ? "w-[72px] opacity-100 ml-1" : "w-0 opacity-0 ml-0"
                                    )}>
                                        <input
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.02}
                                            value={effectiveVolume}
                                            onChange={handleVolumeChange}
                                            className={cn(
                                                "w-[72px] h-1 appearance-none rounded-full cursor-pointer",
                                                "[&::-webkit-slider-thumb]:appearance-none",
                                                "[&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3",
                                                "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white",
                                                "[&::-webkit-slider-thumb]:shadow-sm",
                                                "[&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3",
                                                "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white",
                                                "[&::-moz-range-thumb]:border-0",
                                            )}
                                            style={{
                                                background: `linear-gradient(to right, rgba(255,255,255,0.85) ${effectiveVolume * 100}%, rgba(255,255,255,0.22) ${effectiveVolume * 100}%)`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Time readout */}
                                <span className="text-white/55 text-[11px] font-mono tabular-nums ml-1 select-none">
                                    {formatTime(currentTime)}<span className="text-white/25 mx-0.5">/</span>{formatTime(duration)}
                                </span>
                            </div>

                            {/* Right cluster — restart */}
                            <button
                                onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0; }}
                                className="w-8 h-8 flex items-center justify-center text-white/35 hover:text-white/75 transition-colors rounded-full hover:bg-white/10"
                                title="Restart from beginning"
                            >
                                <RotateCcw className="w-[14px] h-[14px]" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Flash animation keyframes injected as a style tag */}
            <style>{`
                @keyframes va-flash {
                    0%   { opacity: 0; transform: scale(0.6); }
                    25%  { opacity: 1; transform: scale(1.05); }
                    70%  { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
}
