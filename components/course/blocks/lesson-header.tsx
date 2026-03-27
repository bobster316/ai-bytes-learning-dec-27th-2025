"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LessonAudioPlayer } from "./lesson-audio-player";
import { CinematicVideoPlayer } from "./cinematic-video-player";

const ACCENT_CYCLE = ["#00FFB3", "#4b98ad", "#FFB347", "#FF6B6B"];

// ── Cinematic lesson-image panel (shown when heroImage is available) ─────────
function HeroImagePanel({ src, tag }: { src: string; tag: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.45, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: "relative", borderRadius: 20, overflow: "hidden",
                width: "100%",
                aspectRatio: "16 / 9",
                border: "1px solid rgba(155,143,255,0.22)",
                boxShadow: "0 0 60px rgba(155,143,255,0.14), 0 0 120px rgba(155,143,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
        >
            <img
                src={src}
                alt=""
                aria-hidden="true"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {/* Gradient vignette */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,8,16,0.15) 0%, transparent 35%, rgba(8,8,16,0.55) 100%)" }} />
            {/* Iris corner glow */}
            <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(circle at 100% 0%, rgba(155,143,255,0.18), transparent 65%)", pointerEvents: "none" }} />
            {/* Tag pill */}
            <div style={{ position: "absolute", bottom: "1rem", left: "1rem" }}>
                <span className="font-mono" style={{ fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#4b98ad", background: "rgba(8,8,16,0.75)", backdropFilter: "blur(8px)", padding: "0.3rem 0.75rem", borderRadius: 100, border: "1px solid rgba(155,143,255,0.28)" }}>
                    {tag}
                </span>
            </div>
            {/* Animated horizontal scan line */}
            <motion.div
                style={{ position: "absolute", left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(155,143,255,0.7) 50%, transparent 100%)" }}
                animate={{ top: ["-2%", "105%"] }}
                transition={{ duration: 4.5, delay: 1.4, repeat: Infinity, repeatDelay: 7, ease: "linear" }}
            />
        </motion.div>
    );
}

// ── Lesson blueprint (shown when no heroImage — uses actual lesson objectives) ─
function LessonBlueprint({ objectives }: { objectives: string[] }) {
    const items = objectives.slice(0, 4);
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
                borderRadius: 20, overflow: "hidden",
                width: "100%",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "linear-gradient(135deg, rgba(155,143,255,0.04) 0%, rgba(8,8,16,0.4) 100%)",
                padding: "1.5rem 1.5rem 0.5rem",
            }}
        >
            <div className="font-mono" style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: "#4b98ad", boxShadow: "0 0 8px #4b98ad" }} />
                What you'll learn
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
                {items.map((obj, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            display: "flex", alignItems: "flex-start", gap: "0.875rem",
                            padding: "0.85rem 0",
                            borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        }}
                    >
                        <div style={{
                            width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                            background: `${ACCENT_CYCLE[i]}12`,
                            border: `1px solid ${ACCENT_CYCLE[i]}38`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <span className="font-mono" style={{ fontSize: "0.55rem", color: ACCENT_CYCLE[i], fontWeight: 700 }}>
                                {String(i + 1).padStart(2, "0")}
                            </span>
                        </div>
                        <span className="font-body" style={{ fontSize: "0.9rem", color: "rgba(200,200,224,0.82)", lineHeight: 1.6, flex: 1 }}>
                            {obj}
                        </span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

const MID_NODES = [
    { label: "INPUT",   color: "#00FFB3", border: "rgba(0,255,179,0.4)"   },
    { label: "LEARN",   color: "#4b98ad", border: "rgba(155,143,255,0.4)" },
    { label: "APPLY",   color: "#FFB347", border: "rgba(255,179,71,0.4)"  },
    { label: "GROW",    color: "#FF6B6B", border: "rgba(255,107,107,0.4)" },
];

const STAT_COLOURS = ["#00FFB3", "#4b98ad", "#FFB347", "#FF6B6B"]; // used in outcomes dots

export function LessonHeader(props: any) {
    const {
        title, titleEmphasis,
        tag, lessonTag, moduleTag,
        duration, difficulty, questionCount,
        description, subtitle,
        objectives, learningObjectives,
        images, audioUrl, videoUrl, videoOverviewUrl,
        isAudioVisible, setIsAudioVisible,
        lessonMetadata,
    } = props;

    const finalTag  = tag || lessonTag || moduleTag || "Core Concept";
    const finalDesc = description || subtitle || "";
    const rawObjs   = objectives || learningObjectives || [];
    // Normalise: could be strings or objects with a `text` field
    const finalObjectives: string[] = rawObjs.map((o: any) =>
        typeof o === "string" ? o : o?.text || o?.objective || String(o)
    );

    // Metadata Prioritisation: 
    // 1. Block-specific props (AI generated) 
    // 2. Official Lesson metadata (Page level)
    // 3. Fallbacks
    const finalDuration   = duration || lessonMetadata?.duration;
    const finalDifficulty = difficulty || lessonMetadata?.difficulty;
    const finalTitle      = (title && title !== "Untitled Lesson") ? title : props.lessonTitle;
    
    const heroImage = images?.[0]?.image_url || images?.[0]?.url || props.imageUrl || props.image_url;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mounted, setMounted]           = useState(false);
    const [isVideoVisible, setIsVideoVisible] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);

    useEffect(() => setMounted(true), []);

    // Animated canvas network
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const nodes = Array.from({ length: 28 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r:  Math.random() * 2.5 + 1,
        }));

        let raf: number;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx   = nodes[i].x - nodes[j].x;
                    const dy   = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 160) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(155,143,255,${(1 - dist / 160) * 0.25})`;
                        ctx.lineWidth   = 0.5;
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }
            nodes.forEach(n => {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(155,143,255,0.6)";
                ctx.fill();
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
                if (n.y < 0 || n.y > canvas.height)  n.vy *= -1;
            });
            raf = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(raf);
        };
    }, []);


    return (
        <section className="lesson-hero-section relative overflow-hidden" style={{ minHeight: "100vh", background: "#080810" }}>

            {/* ── Mesh gradient blobs ── */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div className="mesh-blob-1 absolute rounded-full" />
                <div className="mesh-blob-2 absolute rounded-full" />
                <div className="mesh-blob-3 absolute rounded-full" />
            </div>

            {/* ── Animated canvas network ── */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ opacity: 0.4, zIndex: 1 }}
                aria-hidden="true"
            />

            {/* ── 3-column grid ── */}
            <div className="hook-grid-inner relative" style={{ zIndex: 2, maxWidth: 1600, margin: "0 auto" }}>

                {/* ───────── LEFT ───────── */}
                <div className="hook-left-col" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "calc(80px + 7vh) 3vw 8vh 6vw" }}>

                    {/* Tag label */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono text-[#00FFB3] flex items-center gap-4 mb-8"
                        style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase" }}
                    >
                        <span className="block w-10 h-px bg-[#00FFB3]" />
                        {finalTag}
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.25 }}
                        className="font-display font-black text-[#f0f0f8] mb-10"
                        style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: "16ch" }}
                    >
                        {finalTitle}
                        {titleEmphasis && (
                            <em className="font-body font-light not-italic block" style={{ color: "#00FFB3", fontStyle: "italic" }}>
                                {titleEmphasis}
                            </em>
                        )}
                    </motion.h1>

                    {/* Description */}
                    {finalDesc && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="font-body text-[#c8c8dc] mb-10"
                            style={{ fontSize: "1.15rem", maxWidth: "48ch", lineHeight: 1.75 }}
                        >
                            {finalDesc}
                        </motion.p>
                    )}

                    {/* Meta chips */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.65 }}
                        className="flex gap-3 flex-wrap items-center mb-6"
                    >
                        <span className="font-mono text-[0.65rem] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full border text-[#00FFB3]"
                            style={{ borderColor: "#00FFB3" }}>
                            ⏱ {finalDuration || "15 min"} {typeof finalDuration === 'number' ? 'min' : ''}
                        </span>
                        {questionCount && (
                            <span className="font-mono text-[0.65rem] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full border border-white/10 text-white/50">
                                {questionCount} checks
                            </span>
                        )}
                        <span className="font-mono text-[0.65rem] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full border border-white/10 text-white/50">
                            {finalDifficulty || "Beginner"}
                        </span>
                    </motion.div>

                    {/* Scroll hint */}
                    <div className="flex items-center gap-3 font-mono text-[#6b6b80] mb-10 scroll-bounce"
                        style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
                        aria-label="Scroll to continue">
                        <svg width="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
                            <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                        Scroll to begin
                    </div>

                    {/* Audio / Video CTAs */}
                    <div className="flex gap-3 flex-wrap mb-8">
                        {audioUrl && (
                            <button
                                onClick={() => setIsAudioVisible(true)}
                                className="font-mono text-[0.65rem] tracking-[0.1em] uppercase px-4 py-2 rounded-full border border-white/10 text-white/50 hover:border-white/30 hover:text-white/70 transition-colors"
                            >
                                🎧 Listen
                            </button>
                        )}
                        {(videoUrl || videoOverviewUrl) && (
                            <button
                                onClick={() => setIsVideoVisible(true)}
                                className="font-mono text-[0.65rem] tracking-[0.1em] uppercase px-4 py-2 rounded-full font-bold transition-all hover:opacity-90"
                                style={{ background: "#00FFB3", color: "#080810" }}
                            >
                                ▶ Watch Overview
                            </button>
                        )}
                    </div>

                    {/* Outcomes card */}
                    {finalObjectives.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            className="rounded-xl p-5"
                            style={{ background: "rgba(0,255,179,0.03)", border: "1px solid rgba(0,255,179,0.1)" }}
                        >
                            <div className="font-mono text-[#00FFB3] mb-4"
                                style={{ fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                                After this lesson you can
                            </div>
                            {finalObjectives.slice(0, 4).map((obj, i) => (
                                <div key={i}
                                    className="flex items-start gap-3 py-2 font-body text-[#c0c0d8] leading-snug"
                                    style={{ fontSize: "0.9rem", borderBottom: i < Math.min(finalObjectives.length, 4) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                                >
                                    <span className="text-[#00FFB3] flex-shrink-0 mt-0.5" style={{ opacity: 0.7 }}>→</span>
                                    {obj}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* ───────── MIDDLE ───────── */}
                <div className="hook-mid-col" aria-hidden="true"
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "calc(80px + 10vh) 0 8vh" }}
                >
                    {MID_NODES.map((node, i) => (
                        <React.Fragment key={i}>
                            <div style={{ width: 1, flex: 1, minHeight: 48, background: "linear-gradient(180deg, transparent, rgba(155,143,255,0.22) 40%, rgba(155,143,255,0.22) 60%, transparent)" }} />
                            <div className="font-mono"
                                style={{ fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.3rem 0.6rem", borderRadius: 100, border: `1px solid ${node.border}`, color: node.color, whiteSpace: "nowrap", background: "rgba(8,8,16,0.6)" }}
                            >
                                {node.label}
                            </div>
                        </React.Fragment>
                    ))}
                    <div style={{ width: 1, flex: 1, minHeight: 48, background: "linear-gradient(180deg, transparent, rgba(155,143,255,0.22) 40%, rgba(155,143,255,0.22) 60%, transparent)" }} />
                </div>

                {/* ───────── RIGHT — lesson visual + stat grid ───────── */}
                <div className="hook-right-col"
                    style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "1rem", padding: "calc(80px + 7vh) 6vw 8vh 3vw" }}
                >
                    {/* Lesson image (if available) or objectives blueprint */}
                    {heroImage
                        ? <HeroImagePanel src={heroImage} tag={finalTag} />
                        : <LessonBlueprint objectives={finalObjectives} />
                    }

                    {/* 2×2 stat grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.75, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}
                    >
                        {[
                            { value: finalDuration ? String(finalDuration).replace(/\D/g,'') || "12" : "12", unit: "min", label: "to complete", colour: "#00FFB3" },
                            { value: String(questionCount || finalObjectives.length || "4"), unit: "checks", label: "built in", colour: "#4b98ad" },
                            { value: "100", unit: "xp", label: "on completion", colour: "#FFB347" },
                            { value: finalDifficulty === "Advanced" ? "3" : finalDifficulty === "Intermediate" ? "2" : "1", unit: "level", label: finalDifficulty || "Beginner", colour: "#FF6B6B" },
                        ].map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.9 + i * 0.08, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                                style={{
                                    borderRadius: 12, padding: "1rem",
                                    background: "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                }}
                            >
                                <div className="font-display font-black" style={{ fontSize: "2rem", lineHeight: 1, color: s.colour, letterSpacing: "-0.03em" }}>
                                    {s.value}
                                </div>
                                <div className="font-mono" style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: s.colour, opacity: 0.7, marginTop: "0.2rem" }}>
                                    {s.unit}
                                </div>
                                <div className="font-body" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginTop: "0.35rem" }}>
                                    {s.label}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

            </div>

            {/* ── Portalled overlays ── */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isAudioVisible && audioUrl && (
                        <LessonAudioPlayer
                            url={audioUrl}
                            title={title}
                            onPlayStateChange={setIsAudioPlaying}
                            onClose={() => { setIsAudioVisible(false); setIsAudioPlaying(false); }}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}
            {mounted && createPortal(
                <AnimatePresence>
                    {isVideoVisible && (videoUrl || videoOverviewUrl || audioUrl) && (
                        <CinematicVideoPlayer
                            url={videoOverviewUrl || videoUrl}
                            audioUrl={audioUrl}
                            images={images}
                            introUrl={videoOverviewUrl ? videoUrl : undefined}
                            title={title}
                            onClose={() => setIsVideoVisible(false)}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}

            <style>{`
                .hook-grid-inner {
                    display: grid;
                    grid-template-columns: 1.2fr 80px 1fr;
                    min-height: 100vh;
                    width: 100%;
                }
                .mesh-blob-1 {
                    width: 800px; height: 800px;
                    background: #4b98ad; top: -300px; left: -200px;
                    filter: blur(100px); opacity: 0.25;
                    animation: lh-drift 25s linear infinite;
                }
                .mesh-blob-2 {
                    width: 500px; height: 500px;
                    background: #00FFB3; top: 20%; right: -150px;
                    filter: blur(80px); opacity: 0.18;
                    animation: lh-drift 32s linear infinite reverse;
                }
                .mesh-blob-3 {
                    width: 400px; height: 400px;
                    background: #FF6B6B; bottom: -100px; left: 30%;
                    filter: blur(80px); opacity: 0.18;
                    animation: lh-drift 20s linear infinite;
                    animation-delay: -10s;
                }
                @keyframes lh-drift {
                    0%   { transform: translate(0,0) scale(1); }
                    33%  { transform: translate(40px,-30px) scale(1.05); }
                    66%  { transform: translate(-20px,20px) scale(0.95); }
                    100% { transform: translate(0,0) scale(1); }
                }
                .scroll-bounce { animation: lh-bounceY 2s ease-in-out infinite; }
                @keyframes lh-bounceY {
                    0%,100% { transform: translateY(0); }
                    50%     { transform: translateY(6px); }
                }
                @media (max-width: 900px) {
                    .hook-grid-inner { grid-template-columns: 1fr !important; }
                    .hook-mid-col, .hook-right-col { display: none !important; }
                    .hook-left-col { padding: 14vh 8vw 8vh !important; }
                }
            `}</style>
        </section>
    );
}
