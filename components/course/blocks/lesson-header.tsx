"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LessonAudioPlayer } from "./lesson-audio-player";
import { CinematicVideoPlayer } from "./cinematic-video-player";
import { useCourseDNA } from "@/components/course/course-dna-provider";

// ─────────────────────────────────────────────────────────────────────────────
// Shared utilities
// ─────────────────────────────────────────────────────────────────────────────

function MetaChip({ label, accent }: { label: string; accent: string }) {
    return (
        <span
            className="font-mono text-[0.62rem] tracking-[0.12em] uppercase px-3 py-1.5 rounded-full border"
            style={{ borderColor: `${accent}40`, color: accent, background: `${accent}08` }}
        >
            {label}
        </span>
    );
}

function AudioVideoCTAs({ videoUrl, videoOverviewUrl, accent, onVideo }: any) {
    return (
        <div className="flex gap-3 flex-wrap">
            {(videoUrl || videoOverviewUrl) && (
                <button
                    onClick={onVideo}
                    className="font-mono text-[0.62rem] tracking-[0.1em] uppercase px-5 py-2 rounded-full font-bold transition-all hover:opacity-90"
                    style={{ background: accent, color: "#080810" }}
                >
                    ▶ Watch
                </button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE 0 — "Command Center"
// Neural network canvas · 3-column orbital grid · DNA-coloured accents
// ─────────────────────────────────────────────────────────────────────────────

function CanvasNet({ accent }: { accent: string }) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = ref.current; if (!canvas) return;
        const ctx = canvas.getContext("2d"); if (!ctx) return;
        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize();
        window.addEventListener("resize", resize);
        const nodes = Array.from({ length: 30 }, (_, i) => ({
            x: (i * 137.5) % canvas.width, y: (i * 97.3) % canvas.height,
            vx: ((i % 5) - 2) * 0.22, vy: ((i % 3) - 1) * 0.22, r: (i % 3) + 1.2,
        }));
        let raf: number;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const [r, g, b] = [
                parseInt(accent.slice(1, 3), 16),
                parseInt(accent.slice(3, 5), 16),
                parseInt(accent.slice(5, 7), 16),
            ];
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 140) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - dist / 140) * 0.18})`;
                        ctx.lineWidth = 0.6;
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }
            nodes.forEach(n => {
                ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},0.55)`; ctx.fill();
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
                if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
            });
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
    }, [accent]);
    return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.35, zIndex: 1 }} aria-hidden="true" />;
}

function OrbitalRing({ accent }: { accent: string }) {
    return (
        <div className="relative flex items-center justify-center" style={{ width: 80, height: "100%" }}>
            <div className="absolute rounded-full" style={{
                width: 56, height: 56,
                border: `1px solid ${accent}30`,
                boxShadow: `0 0 20px ${accent}15`,
                animation: "orb-spin 14s linear infinite",
            }}>
                <div className="absolute rounded-full" style={{
                    width: 8, height: 8, background: accent,
                    boxShadow: `0 0 10px ${accent}`,
                    top: -4, left: "50%", transform: "translateX(-50%)",
                }} />
            </div>
            <div className="absolute rounded-full" style={{
                width: 80, height: 80,
                border: `1px solid ${accent}18`,
                animation: "orb-spin 22s linear infinite reverse",
            }}>
                <div className="absolute rounded-full" style={{
                    width: 5, height: 5, background: "#FFB347",
                    boxShadow: "0 0 8px #FFB347",
                    bottom: -2.5, left: "50%", transform: "translateX(-50%)",
                }} />
            </div>
            <div style={{ width: 1, height: "100%", background: `linear-gradient(180deg, transparent, ${accent}20 40%, ${accent}20 60%, transparent)`, position: "absolute" }} />
            {["INPUT", "PROCESS", "OUTPUT", "APPLY"].map((label, i) => (
                <div key={i} className="font-mono absolute" style={{
                    fontSize: "0.48rem", letterSpacing: "0.18em", textTransform: "uppercase",
                    padding: "0.25rem 0.5rem", borderRadius: 100, whiteSpace: "nowrap",
                    border: `1px solid ${accent}35`, color: accent, background: "rgba(8,8,16,0.7)",
                    top: `${20 + i * 20}%`, transform: "translateX(-50%)", left: "50%",
                    animation: `orb-fade 3s ease-in-out infinite`, animationDelay: `${i * 0.75}s`,
                }}>{label}</div>
            ))}
        </div>
    );
}

function CommandCenter(props: any) {
    const { finalTitle, finalTag, finalDesc, finalDuration, finalDifficulty, finalObjectives, heroImage, questionCount, accent, audioUrl, videoUrl, videoOverviewUrl, onAudio, onVideo } = props;
    return (
        <section className="lh-cc-section relative overflow-hidden" style={{ minHeight: "100vh", background: "#080810" }}>
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div className="lh-blob-1 absolute rounded-full" style={{ background: accent }} />
                <div className="lh-blob-2 absolute rounded-full" />
            </div>
            <CanvasNet accent={accent} />
            <motion.div className="lh-cc-grid relative" style={{ zIndex: 2, maxWidth: 1560, margin: "0 auto" }}>
                {/* LEFT */}
                <div className="lh-cc-left" style={{ padding: "calc(80px + 7vh) 3vw 8vh 6vw", display: "flex", flexDirection: "column" }}>
                    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                        className="font-mono flex items-center gap-4 mb-8"
                        style={{ fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: accent }}>
                        <span style={{ display: "block", width: 40, height: 1, background: accent }} />
                        {finalTag}
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
                        className="font-display font-black text-[#f0f0f8] mb-8"
                        style={{ fontSize: "clamp(1.8rem, 3.8vw, 3.2rem)", lineHeight: 1.08, letterSpacing: "-0.022em", maxWidth: "18ch" }}>
                        {finalTitle}
                    </motion.h1>
                    {finalDesc && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            className="font-body text-[#c0c0d8] mb-8"
                            style={{ fontSize: "1.05rem", maxWidth: "46ch", lineHeight: 1.78 }}>
                            {finalDesc}
                        </motion.p>
                    )}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="flex gap-3 flex-wrap mb-8">
                        <MetaChip label={`⏱ ${finalDuration || "15 min"}`} accent={accent} />
                        {questionCount && <MetaChip label={`${questionCount} checks`} accent="rgba(255,255,255,0.4)" />}
                        <MetaChip label={finalDifficulty || "Beginner"} accent="rgba(255,255,255,0.4)" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="mb-10">
                        <AudioVideoCTAs audioUrl={audioUrl} videoUrl={videoUrl} videoOverviewUrl={videoOverviewUrl} accent={accent} onAudio={onAudio} onVideo={onVideo} />
                    </motion.div>
                    {finalObjectives.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                            className="rounded-xl p-5" style={{ background: `${accent}06`, border: `1px solid ${accent}18` }}>
                            <div className="font-mono mb-4" style={{ fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: accent }}>
                                After this lesson
                            </div>
                            {finalObjectives.slice(0, 3).map((obj: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 py-2 font-body text-[#c0c0d8]"
                                    style={{ fontSize: "0.88rem", lineHeight: 1.6, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                    <span style={{ color: accent, opacity: 0.7, flexShrink: 0, marginTop: 2 }}>→</span>
                                    {obj}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>
                {/* MIDDLE — orbital spine */}
                <div className="lh-cc-mid" aria-hidden="true" style={{ padding: "calc(80px + 6vh) 0 8vh" }}>
                    <OrbitalRing accent={accent} />
                </div>
                {/* RIGHT */}
                <div className="lh-cc-right" style={{ padding: "calc(80px + 7vh) 6vw 8vh 3vw", display: "flex", flexDirection: "column", gap: "1rem", justifyContent: "center" }}>
                    {heroImage ? (
                        <motion.div initial={{ opacity: 0, x: 24, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.45, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${accent}22`, boxShadow: `0 0 60px ${accent}12` }}>
                            <img src={heroImage} alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(8,8,16,0.7) 100%)" }} />
                            <motion.div style={{ position: "absolute", left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }}
                                animate={{ top: ["-2%", "105%"] }} transition={{ duration: 4.5, delay: 1.4, repeat: Infinity, repeatDelay: 7, ease: "linear" }} />
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                            style={{ borderRadius: 20, padding: "1.5rem", border: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(135deg, rgba(255,255,255,0.025), transparent)" }}>
                            <div className="font-mono mb-5" style={{ fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}`, display: "block" }} />
                                Lesson blueprint
                            </div>
                            {finalObjectives.slice(0, 4).map((obj: string, i: number) => (
                                <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 + i * 0.1 }}
                                    style={{ display: "flex", gap: "0.875rem", padding: "0.8rem 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                    <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: `${accent}12`, border: `1px solid ${accent}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span className="font-mono" style={{ fontSize: "0.5rem", color: accent, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                                    </div>
                                    <span className="font-body" style={{ fontSize: "0.88rem", color: "rgba(200,200,224,0.8)", lineHeight: 1.6 }}>{obj}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                        {[
                            { value: finalDuration ? String(finalDuration).replace(/\D/, '') || "12" : "12", unit: "min", label: "to complete", colour: accent },
                            { value: String(questionCount || finalObjectives.length || "4"), unit: "checks", label: "built in", colour: "#FFB347" },
                            { value: "100", unit: "xp", label: "on complete", colour: "#00FFB3" },
                            { value: finalDifficulty === "Advanced" ? "3" : finalDifficulty === "Intermediate" ? "2" : "1", unit: "level", label: finalDifficulty || "Beginner", colour: "#FF6B6B" },
                        ].map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.88 + i * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
                                style={{ borderRadius: 12, padding: "0.9rem", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div className="font-display font-black" style={{ fontSize: "1.9rem", lineHeight: 1, color: s.colour, letterSpacing: "-0.03em" }}>{s.value}</div>
                                <div className="font-mono" style={{ fontSize: "0.56rem", letterSpacing: "0.12em", textTransform: "uppercase", color: s.colour, opacity: 0.7, marginTop: "0.2rem" }}>{s.unit}</div>
                                <div className="font-body" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.32)", marginTop: "0.3rem" }}>{s.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>
            <style>{`
                .lh-cc-grid { display: grid; grid-template-columns: 1.2fr 88px 1fr; min-height: 100vh; }
                .lh-blob-1 { width: 700px; height: 700px; top: -280px; left: -180px; filter: blur(110px); opacity: 0.2; animation: lh-drift 26s linear infinite; }
                .lh-blob-2 { width: 400px; height: 400px; background: #FFB347; bottom: -80px; right: -100px; filter: blur(90px); opacity: 0.12; animation: lh-drift 34s linear infinite reverse; }
                @keyframes orb-spin { to { transform: rotate(360deg); } }
                @keyframes orb-fade { 0%,100% { opacity: 0.4 } 50% { opacity: 0.9 } }
                @keyframes lh-drift { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(35px,-25px) scale(1.04); } 66% { transform: translate(-18px,18px) scale(0.97); } }
                @media (max-width: 900px) { .lh-cc-grid { grid-template-columns: 1fr !important; } .lh-cc-mid, .lh-cc-right { display: none !important; } .lh-cc-left { padding: 14vh 8vw 8vh !important; } }
            `}</style>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE 1 — "Deep Terminal"
// HUD status bar · hex-dot matrix bg · typewriter title · two-panel bottom
// ─────────────────────────────────────────────────────────────────────────────

function TerminalHeader(props: any) {
    const { finalTitle, finalTag, finalDesc, finalDuration, finalDifficulty, finalObjectives, heroImage, questionCount, accent, lessonNum, audioUrl, videoUrl, videoOverviewUrl, onAudio, onVideo } = props;
    const [cursorOn, setCursorOn] = useState(true);
    useEffect(() => { const id = setInterval(() => setCursorOn(v => !v), 530); return () => clearInterval(id); }, []);

    return (
        <section className="relative overflow-hidden" style={{ minHeight: "100vh", background: "#04060c" }}>
            {/* Dot matrix background */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
                style={{ backgroundImage: `radial-gradient(circle, ${accent}18 1px, transparent 1px)`, backgroundSize: "28px 28px", opacity: 0.5 }} />
            {/* Ambient glow */}
            <div className="absolute pointer-events-none" style={{ width: 600, height: 600, top: "10%", left: "5%", borderRadius: "50%", background: `radial-gradient(circle, ${accent}14, transparent 70%)`, filter: "blur(60px)" }} />

            {/* HUD top bar */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="relative font-mono flex items-center gap-4 px-8 py-3 border-b"
                style={{ zIndex: 10, marginTop: 72, borderColor: `${accent}20`, background: `${accent}06`, fontSize: "0.6rem", letterSpacing: "0.18em", color: `${accent}80`, textTransform: "uppercase" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}`, display: "inline-block", animation: "term-blink 1.4s ease-in-out infinite" }} />
                <span>LESSON_{String(lessonNum).padStart(2, "0")}</span>
                <span style={{ opacity: 0.4 }}>──</span>
                <span>{finalTag}</span>
                <span style={{ opacity: 0.4 }}>──</span>
                <span>{finalDifficulty || "Beginner"}</span>
                <div style={{ flex: 1 }} />
                <span style={{ opacity: 0.5 }}>{finalDuration || "15"} MIN</span>
            </motion.div>

            {/* Main content */}
            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "6vh 6vw 8vh", display: "grid", gridTemplateColumns: heroImage ? "1fr 1fr" : "1fr", gap: "4vw", alignItems: "center", minHeight: "calc(100vh - 120px)" }}>
                <div>
                    {/* Title */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
                        className="font-mono mb-2" style={{ fontSize: "0.62rem", letterSpacing: "0.22em", textTransform: "uppercase", color: `${accent}70` }}>
                        // {finalTag}
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
                        className="font-display font-black text-[#eeeef8] mb-3"
                        style={{ fontSize: "clamp(1.9rem, 4vw, 3.4rem)", lineHeight: 1.07, letterSpacing: "-0.025em", maxWidth: "20ch" }}>
                        {finalTitle}
                    </motion.h1>
                    {/* Cursor underline */}
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: 2, width: "min(320px, 80%)", background: `linear-gradient(90deg, ${accent}, transparent)`, marginBottom: "2rem", transformOrigin: "left" }} />

                    {finalDesc && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                            className="font-body text-[#b0b0cc] mb-8"
                            style={{ fontSize: "1.05rem", lineHeight: 1.8, maxWidth: "48ch" }}>
                            {finalDesc}
                        </motion.p>
                    )}

                    {/* Stats row */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                        className="flex gap-6 mb-8 flex-wrap">
                        {[
                            { label: "DURATION", value: `${finalDuration || "15"} MIN` },
                            { label: "DIFFICULTY", value: (finalDifficulty || "BEGINNER").toUpperCase() },
                            { label: "CHECKS", value: `${questionCount || finalObjectives.length || 4} QS` },
                        ].map((s, i) => (
                            <div key={i} className="font-mono" style={{ fontSize: "0.6rem", letterSpacing: "0.14em" }}>
                                <div style={{ color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: "0.2rem" }}>{s.label}</div>
                                <div style={{ color: accent, fontSize: "0.85rem", fontWeight: 700 }}>{s.value}</div>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }} className="mb-10">
                        <AudioVideoCTAs audioUrl={audioUrl} videoUrl={videoUrl} videoOverviewUrl={videoOverviewUrl} accent={accent} onAudio={onAudio} onVideo={onVideo} />
                    </motion.div>

                    {/* Objectives as terminal list */}
                    {finalObjectives.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }}
                            className="rounded-xl overflow-hidden" style={{ border: `1px solid ${accent}20`, background: "rgba(0,0,0,0.4)" }}>
                            <div className="font-mono px-5 py-3 border-b" style={{ fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: `${accent}70`, borderColor: `${accent}15`, display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <span style={{ color: "#FF6B6B" }}>●</span>
                                <span style={{ color: "#FFB347" }}>●</span>
                                <span style={{ color: "#00FFB3" }}>●</span>
                                <span style={{ marginLeft: "0.5rem" }}>objectives.md</span>
                            </div>
                            {finalObjectives.slice(0, 3).map((obj: string, i: number) => (
                                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.12 }}
                                    className="font-mono px-5 py-3 flex gap-3"
                                    style={{ fontSize: "0.8rem", color: "rgba(200,210,230,0.8)", borderBottom: i < 2 ? `1px solid ${accent}10` : "none" }}>
                                    <span style={{ color: `${accent}60`, flexShrink: 0 }}>{`>`}</span>
                                    {obj}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* Right: hero image with HUD overlay */}
                {heroImage && (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="relative rounded-2xl overflow-hidden"
                        style={{ aspectRatio: "4/3", border: `1px solid ${accent}25`, boxShadow: `0 0 80px ${accent}12` }}>
                        <img src={heroImage} alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${accent}12 0%, transparent 60%, rgba(4,6,12,0.5) 100%)` }} />
                        {/* Corner brackets */}
                        {[["top-3 left-3", "border-t border-l"], ["top-3 right-3", "border-t border-r"], ["bottom-3 left-3", "border-b border-l"], ["bottom-3 right-3", "border-b border-r"]].map(([pos, bdr], i) => (
                            <div key={i} className={`absolute ${pos} ${bdr} w-5 h-5`} style={{ borderColor: `${accent}60` }} />
                        ))}
                        {/* Scan sweep */}
                        <motion.div style={{ position: "absolute", left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accent}90, transparent)` }}
                            animate={{ top: ["-2%", "105%"] }} transition={{ duration: 3.5, delay: 1.2, repeat: Infinity, repeatDelay: 5, ease: "linear" }} />
                        <div className="absolute bottom-3 left-3 font-mono" style={{ fontSize: "0.55rem", letterSpacing: "0.14em", color: `${accent}80`, background: "rgba(4,6,12,0.7)", padding: "0.25rem 0.6rem", borderRadius: 4 }}>
                            SCAN ACTIVE
                        </div>
                    </motion.div>
                )}
            </div>
            <style>{`@keyframes term-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }`}</style>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE 2 — "Deep Field"
// Animated concentric orbit rings · center-anchored layout · particle drift
// ─────────────────────────────────────────────────────────────────────────────

function DeepField(props: any) {
    const { finalTitle, finalTag, finalDesc, finalDuration, finalDifficulty, finalObjectives, heroImage, questionCount, accent, audioUrl, videoUrl, videoOverviewUrl, onAudio, onVideo } = props;

    return (
        <section className="relative overflow-hidden" style={{ minHeight: "100vh", background: "#060810" }}>
            {/* Deep ambient blobs */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div className="absolute" style={{ width: 900, height: 900, top: "50%", left: "50%", transform: "translate(-50%,-50%)", borderRadius: "50%", background: `radial-gradient(circle, ${accent}0c 0%, transparent 65%)`, filter: "blur(40px)" }} />
                <div className="absolute" style={{ width: 500, height: 500, bottom: "-10%", right: "5%", borderRadius: "50%", background: "radial-gradient(circle, #FFB34714, transparent 70%)", filter: "blur(80px)" }} />
            </div>

            {/* Concentric orbit rings */}
            <div className="absolute pointer-events-none" aria-hidden="true"
                style={{ top: "50%", right: heroImage ? "38%" : "12%", transform: "translateY(-50%)", zIndex: 1 }}>
                {[220, 320, 420, 520].map((size, i) => (
                    <div key={i} className="absolute rounded-full" style={{
                        width: size, height: size,
                        top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                        border: `1px solid ${accent}${["18", "12", "0d", "08"][i]}`,
                        animation: `df-spin ${[18, 28, 38, 52][i]}s linear infinite ${i % 2 ? "reverse" : ""}`,
                    }}>
                        <div className="absolute rounded-full" style={{
                            width: [8, 6, 5, 4][i], height: [8, 6, 5, 4][i],
                            background: [accent, "#FFB347", "#FF6B6B", "#00FFB3"][i],
                            boxShadow: `0 0 ${[10, 8, 6, 5][i]}px ${[accent, "#FFB347", "#FF6B6B", "#00FFB3"][i]}`,
                            top: ["-4px", "-3px", "-2.5px", "-2px"][i], left: "50%", transform: "translateX(-50%)",
                        }} />
                    </div>
                ))}
                {/* Centre orb */}
                <div className="absolute rounded-full" style={{
                    width: 48, height: 48, top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                    background: `radial-gradient(circle, ${accent}50, ${accent}18)`,
                    border: `1px solid ${accent}50`,
                    boxShadow: `0 0 30px ${accent}35, 0 0 60px ${accent}15`,
                }} />
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "calc(80px + 7vh) 6vw 8vh", position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: heroImage ? "1fr 1fr" : "1fr", gap: "5vw", alignItems: "center", minHeight: "100vh" }}>
                <div>
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
                        className="flex items-center gap-3 mb-8">
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 12px ${accent}` }} />
                        <span className="font-mono" style={{ fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: `${accent}90` }}>{finalTag}</span>
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="font-display font-black text-[#eef0fa] mb-8"
                        style={{ fontSize: "clamp(1.9rem, 3.8vw, 3.2rem)", lineHeight: 1.08, letterSpacing: "-0.022em", maxWidth: "20ch" }}>
                        {finalTitle}
                    </motion.h1>

                    {finalDesc && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            className="font-body text-[#b8b8d0] mb-8"
                            style={{ fontSize: "1.05rem", lineHeight: 1.8, maxWidth: "44ch" }}>
                            {finalDesc}
                        </motion.p>
                    )}

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="flex gap-3 flex-wrap mb-8">
                        <MetaChip label={`⏱ ${finalDuration || "15 min"}`} accent={accent} />
                        {questionCount && <MetaChip label={`${questionCount} checks`} accent="rgba(255,255,255,0.38)" />}
                        <MetaChip label={finalDifficulty || "Beginner"} accent="rgba(255,255,255,0.38)" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.78 }} className="mb-10">
                        <AudioVideoCTAs audioUrl={audioUrl} videoUrl={videoUrl} videoOverviewUrl={videoOverviewUrl} accent={accent} onAudio={onAudio} onVideo={onVideo} />
                    </motion.div>

                    {/* Objectives as glowing cards row */}
                    {finalObjectives.length > 0 && (
                        <div className="space-y-2">
                            {finalObjectives.slice(0, 3).map((obj: string, i: number) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    style={{
                                        display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "0.85rem 1rem",
                                        borderRadius: 12, background: `${accent}06`, border: `1px solid ${accent}15`,
                                        transition: "border-color 0.2s",
                                    }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                                        background: `${accent}18`, border: `1px solid ${accent}40`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <span className="font-mono" style={{ fontSize: "0.48rem", color: accent, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                                    </div>
                                    <span className="font-body" style={{ fontSize: "0.88rem", color: "rgba(210,215,235,0.85)", lineHeight: 1.6 }}>{obj}</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hero image side */}
                {heroImage && (
                    <motion.div initial={{ opacity: 0, scale: 0.94, rotate: 1 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.4, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                        className="relative rounded-3xl overflow-hidden"
                        style={{ aspectRatio: "3/4", border: `1px solid ${accent}20`, boxShadow: `0 0 100px ${accent}14, 0 40px 80px rgba(0,0,0,0.5)` }}>
                        <img src={heroImage} alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 40%, rgba(6,8,16,0.8) 100%)` }} />
                        <motion.div style={{ position: "absolute", top: 0, bottom: 0, width: 1, background: `linear-gradient(180deg, transparent, ${accent}80, transparent)` }}
                            animate={{ left: ["-2%", "105%"] }} transition={{ duration: 4, delay: 1.5, repeat: Infinity, repeatDelay: 8, ease: "linear" }} />
                        {/* Stats overlay bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 flex gap-4">
                            {[
                                { v: finalDuration ? String(finalDuration).replace(/\D/, '') || "12" : "12", u: "min" },
                                { v: "100", u: "xp" },
                                { v: finalDifficulty === "Advanced" ? "3" : finalDifficulty === "Intermediate" ? "2" : "1", u: "lvl" },
                            ].map((s, i) => (
                                <div key={i} style={{ background: "rgba(6,8,16,0.75)", backdropFilter: "blur(12px)", borderRadius: 10, padding: "0.5rem 0.75rem", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    <div className="font-display font-black" style={{ fontSize: "1.4rem", color: accent, lineHeight: 1 }}>{s.v}</div>
                                    <div className="font-mono" style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{s.u}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
            <style>{`@keyframes df-spin { to { transform: translate(-50%,-50%) rotate(360deg); } }`}</style>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export — selects layout by lessonIndex
// ─────────────────────────────────────────────────────────────────────────────

export function LessonHeader(props: any) {
    const {
        title, titleEmphasis,
        tag, lessonTag, moduleTag,
        duration, difficulty, questionCount,
        description, subtitle,
        objectives, learningObjectives,
        images, audioUrl, videoUrl, videoOverviewUrl,
        isAudioVisible, setIsAudioVisible,
        lessonMetadata, lessonIndex,
    } = props;

    const { primary_colour } = useCourseDNA();
    const [mounted, setMounted] = useState(false);
    const [isVideoVisible, setIsVideoVisible] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    useEffect(() => setMounted(true), []);

    const accent = primary_colour || "#00FFB3";
    const finalTag        = tag || lessonTag || moduleTag || "Core Concept";
    const finalDesc       = description || subtitle || "";
    const finalDuration   = duration || lessonMetadata?.duration;
    const finalDifficulty = difficulty || lessonMetadata?.difficulty;
    const finalTitle      = (title && title !== "Untitled Lesson") ? title : props.lessonTitle || "Lesson";
    const rawObjs         = objectives || learningObjectives || [];
    const finalObjectives: string[] = rawObjs.map((o: any) =>
        typeof o === "string" ? o : o?.text || o?.objective || String(o)
    );
    const heroImage = images?.[0]?.image_url || images?.[0]?.url || props.imageUrl || props.image_url;
    const lessonNum = (lessonIndex ?? 0) + 1;
    const mode = (lessonIndex ?? 0) % 3;

    const shared = {
        finalTitle, finalTag, finalDesc, finalDuration, finalDifficulty,
        finalObjectives, heroImage, questionCount, accent, lessonNum,
        audioUrl, videoUrl, videoOverviewUrl,
        onAudio: () => setIsAudioVisible(true),
        onVideo: () => setIsVideoVisible(true),
    };

    return (
        <>
            {mode === 0 && <CommandCenter {...shared} />}
            {mode === 1 && <TerminalHeader {...shared} />}
            {mode === 2 && <DeepField {...shared} />}

            {mounted && createPortal(
                <AnimatePresence>
                    {isAudioVisible && audioUrl && (
                        <LessonAudioPlayer url={audioUrl} title={finalTitle}
                            onPlayStateChange={setIsAudioPlaying}
                            onClose={() => { setIsAudioVisible(false); setIsAudioPlaying(false); }} />
                    )}
                </AnimatePresence>,
                document.body
            )}
            {mounted && createPortal(
                <AnimatePresence>
                    {isVideoVisible && (videoUrl || videoOverviewUrl || audioUrl) && (
                        <CinematicVideoPlayer url={videoOverviewUrl || videoUrl} audioUrl={audioUrl}
                            images={images} introUrl={videoOverviewUrl ? videoUrl : undefined}
                            title={finalTitle} onClose={() => setIsVideoVisible(false)} />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
