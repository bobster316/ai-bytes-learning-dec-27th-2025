"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import {
    Brain, Zap, MessageSquare, Code, Cpu, TrendingUp, Shield, Eye,
    Sparkles, Trophy, Flame, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FloatingBadge3D } from "@/components/ui/floating-badge-3d";

// Brand-mapped category accent colours
const categoryAccent: Record<string, string> = {
    "foundational":        "#4b98ad",
    "generative":          "#FFB347",
    "prompt-engineering":  "#00FFB3",
    "applications":        "#4b98ad",
    "machine-learning":    "#FF6B6B",
    "business":            "#FFB347",
    "security":            "#4b98ad",
    "vision":              "#00FFB3",
};

const iconMap: Record<string, any> = {
    Brain, Zap, MessageSquare, Code, Cpu, TrendingUp, Shield, Eye
};

export default function MasteryPage() {
    const [data, setData]               = useState<any>(null);
    const [loading, setLoading]         = useState(true);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    useEffect(() => { fetchMastery(); }, []);

    const fetchMastery = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { window.location.href = "/auth/signin"; return; }
            const res = await fetch(`/api/user/mastery?userId=${user.id}`);
            const masteryData = await res.json();
            setData(masteryData);
        } catch (e) {
            console.error("Mastery fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="min-h-screen bg-[#080810] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4b98ad]" />
            </div>
        );
    }

    const { profile, categories } = data;
    const totalMastery = Math.round(
        categories.reduce((acc: number, c: any) => acc + c.mastery, 0) / categories.length
    );

    return (
        <div className="min-h-screen bg-[#080810] text-white font-body relative overflow-hidden">

            {/* ── Mesh gradient blobs ─────────────────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
                <div className="absolute rounded-full" style={{ width: 900, height: 900, background: "#4b98ad", top: "-5%",  left: "-20%", filter: "blur(120px)", opacity: 0.1,  animation: "stMesh 35s linear infinite" }} />
                <div className="absolute rounded-full" style={{ width: 700, height: 700, background: "#00FFB3", top: "40%",  right: "-15%",filter: "blur(120px)", opacity: 0.07, animation: "stMesh 28s linear infinite reverse" }} />
                <div className="absolute rounded-full" style={{ width: 600, height: 600, background: "#FFB347", bottom: "5%",left: "30%",  filter: "blur(120px)", opacity: 0.06, animation: "stMesh 22s linear infinite", animationDelay: "-11s" }} />
            </div>

            {/* ── Grain overlay ───────────────────────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, opacity: 0.025, mixBlendMode: "soft-light" }} aria-hidden="true">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <filter id="st-grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
                    <rect width="100%" height="100%" filter="url(#st-grain)" />
                </svg>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes stMesh {
                    0%   { transform: translate(0,0) scale(1); }
                    33%  { transform: translate(40px,-50px) scale(1.07); }
                    66%  { transform: translate(-30px,30px) scale(0.95); }
                    100% { transform: translate(0,0) scale(1); }
                }
            ` }} />

            <Header />

            <main className="relative z-10 max-w-[1140px] mx-auto px-[4vw] pt-20 pb-28">

                {/* ── Hero ────────────────────────────────────────────────── */}
                <div className="text-center mb-16">
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-white/40 mb-5"
                    >
                        Your Progress
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="font-display font-black leading-[0.92] tracking-[-0.03em] text-white mb-5"
                        style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
                    >
                        The AI{" "}
                        <span style={{ color: "#4b98ad" }}>Skill Tree</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.18 }}
                        className="font-body text-lg text-white/50 max-w-xl mx-auto leading-relaxed"
                    >
                        Visualise your neural progress across the AI landscape. Complete bytes to expand your influence.
                    </motion.p>

                    {/* ── How it works explanation ─────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28 }}
                        className="mt-10 grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left"
                    >
                        {[
                            {
                                emoji: "🌐",
                                title: "One node = one AI topic",
                                desc: "Each glowing node represents a category of AI knowledge — from Foundations to Generative AI to Machine Learning.",
                            },
                            {
                                emoji: "📈",
                                title: "Nodes grow as you learn",
                                desc: "Finish lessons and courses to increase your mastery % in that topic. Empty nodes light up as you progress.",
                            },
                            {
                                emoji: "🏆",
                                title: "Earn XP, levels & streaks",
                                desc: "Every completed byte earns XP and grows your level. Come back daily to build your streak.",
                            },
                        ].map(item => (
                            <div
                                key={item.title}
                                className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex flex-col gap-2"
                            >
                                <span className="text-2xl">{item.emoji}</span>
                                <p className="font-bold text-white text-sm leading-snug">{item.title}</p>
                                <p className="text-white/45 text-xs leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* ── Skill Tree Visualization ────────────────────────────── */}
                <div className="relative h-[540px] md:h-[760px] flex items-center justify-center">

                    {/* Orbital rings */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                            className="w-[280px] h-[280px] rounded-full border border-white/[0.04]"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[560px] h-[560px] rounded-full border border-white/[0.03]"
                        />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[720px] h-[720px] rounded-full border border-white/[0.02]"
                        />
                    </div>

                    {/* Central core */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
                        className="relative z-20"
                    >
                        <div
                            className="w-36 h-36 md:w-52 md:h-52 rounded-full flex flex-col items-center justify-center"
                            style={{
                                background: "radial-gradient(circle, #1a1a2e 0%, #0d0d1c 100%)",
                                border: "1px solid rgba(155,143,255,0.25)",
                                boxShadow: "0 0 60px rgba(155,143,255,0.12), 0 0 120px rgba(155,143,255,0.05)"
                            }}
                        >
                            <Brain className="w-8 h-8 md:w-10 md:h-10 mb-1.5" style={{ color: "#4b98ad" }} />
                            <p className="font-mono text-[0.52rem] uppercase tracking-[0.2em] text-white/35 mb-0.5">Growth Level</p>
                            <p className="font-display font-black text-white leading-none" style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)" }}>{totalMastery}%</p>
                            <p className="font-mono text-[0.52rem] uppercase tracking-[0.14em] text-white/30 mt-0.5">Total Mastery</p>
                        </div>
                        {/* Pulse ring */}
                        <div
                            className="absolute inset-0 rounded-full animate-ping opacity-[0.08]"
                            style={{ border: "1px solid #4b98ad" }}
                        />
                    </motion.div>

                    {/* Orbital nodes */}
                    {categories.map((cat: any, idx: number) => {
                        const Icon   = iconMap[cat.icon] || Brain;
                        const accent = categoryAccent[cat.id] ?? "#4b98ad";
                        const angle  = (idx / categories.length) * 2 * Math.PI - Math.PI / 2;
                        const radius = typeof window !== "undefined" && window.innerWidth < 768 ? 155 : 300;
                        const x      = Math.cos(angle) * radius;
                        const y      = Math.sin(angle) * radius;
                        const active = cat.mastery > 0;

                        return (
                            <motion.div
                                key={cat.id}
                                initial={{ x: 0, y: 0, opacity: 0 }}
                                animate={{ x, y, opacity: 1 }}
                                transition={{ delay: 0.3 + idx * 0.08, type: "spring", stiffness: 50 }}
                                onHoverStart={() => setHoveredNode(cat.id)}
                                onHoverEnd={() => setHoveredNode(null)}
                                className="absolute cursor-pointer"
                            >
                                {/* Connector line */}
                                <svg
                                    className="absolute top-1/2 left-1/2 pointer-events-none overflow-visible"
                                    style={{ zIndex: -1, transform: "translate(-50%,-50%)" }}
                                    width="2" height="2"
                                >
                                    <motion.line
                                        x1="0" y1="0" x2={-x} y2={-y}
                                        stroke={active ? accent : "rgba(255,255,255,0.06)"}
                                        strokeWidth="1"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ delay: 0.8 + idx * 0.06, duration: 0.8 }}
                                    />
                                </svg>

                                {/* Node */}
                                <div className="relative group">
                                    <div
                                        className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 border relative overflow-visible"
                                        style={{
                                            background: active ? `${accent}12` : "rgba(255,255,255,0.03)",
                                            borderColor: active ? `${accent}30` : "rgba(255,255,255,0.07)",
                                            boxShadow: active ? `0 0 30px ${accent}18` : "none",
                                        }}
                                    >
                                        <div className="absolute -inset-8 z-10 pointer-events-auto">
                                            <FloatingBadge3D
                                                icon={Icon}
                                                color={active ? accent : "#3a3a4a"}
                                                intensity={active ? Math.max(0.4, cat.mastery / 100) : 0.1}
                                            />
                                        </div>
                                    </div>

                                    {/* Mastery % badge */}
                                    {active && (
                                        <div
                                            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 font-mono text-[0.52rem] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
                                            style={{ background: `${accent}20`, borderColor: `${accent}40`, color: accent }}
                                        >
                                            {cat.mastery}%
                                        </div>
                                    )}

                                    {/* Tooltip */}
                                    <AnimatePresence>
                                        {hoveredNode === cat.id && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.93 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.93 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute top-full left-1/2 -translate-x-1/2 mt-5 w-52 p-5 rounded-2xl z-50 pointer-events-none"
                                                style={{
                                                    background: "#0d0d1c",
                                                    border: "1px solid rgba(255,255,255,0.07)",
                                                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
                                                }}
                                            >
                                                <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] mb-3" style={{ color: accent }}>{cat.label}</p>
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between">
                                                        <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-white/35">Progress</span>
                                                        <span className="font-mono text-[0.65rem] font-bold text-white/80">{cat.mastery}%</span>
                                                    </div>
                                                    <div className="w-full h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all" style={{ width: `${cat.mastery}%`, background: accent }} />
                                                    </div>
                                                    <div className="flex justify-between pt-1">
                                                        <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-white/35">Completed</span>
                                                        <span className="font-mono text-[0.65rem] font-bold text-white/80">{cat.completedCourses} / {cat.totalCourses}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Stat cards ──────────────────────────────────────────── */}
                <div className="grid md:grid-cols-3 gap-5 mt-10">
                    <StatCard icon={<Trophy className="w-5 h-5" style={{ color: "#FFB347" }} />} accent="#FFB347" label="Account Level"   value={profile?.current_level  ?? 1} subtext="Skill Rank" />
                    <StatCard icon={<Flame   className="w-5 h-5" style={{ color: "#FF6B6B" }} />} accent="#FF6B6B" label="Current Streak"  value={profile?.current_streak ?? 0} subtext="Day Continuity" />
                    <StatCard icon={<Zap     className="w-5 h-5" style={{ color: "#4b98ad" }} />} accent="#4b98ad" label="Total XP"        value={profile?.total_xp       ?? 0} subtext="Lifetime Influence" />
                </div>

                {/* ── CTA ─────────────────────────────────────────────────── */}
                <div className="mt-16 text-center">
                    <Link href="/courses">
                        <button
                            className="inline-flex items-center gap-2.5 h-13 px-10 rounded-full font-mono text-[0.68rem] uppercase tracking-[0.15em] border transition-all duration-200 hover:bg-[#4b98ad]/10 hover:border-[#4b98ad]/50"
                            style={{ height: "3.25rem", borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" }}
                        >
                            Expand Your Knowledge
                            <Sparkles className="w-4 h-4" style={{ color: "#4b98ad" }} />
                        </button>
                    </Link>
                </div>

            </main>
        </div>
    );
}

function StatCard({ icon, label, value, subtext, accent }: { icon: React.ReactNode; label: string; value: number; subtext: string; accent: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ ease: [0.16, 1, 0.3, 1] }}
            className="p-6 rounded-3xl border relative overflow-hidden"
            style={{ background: "#0d0d1c", borderColor: "rgba(255,255,255,0.06)" }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}
            >
                {icon}
            </div>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/40 mb-1.5">{label}</p>
            <p className="font-display font-black text-white tracking-tight leading-none mb-1.5" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>{value}</p>
            <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-white/30">{subtext}</p>

            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                 style={{ background: `${accent}08`, filter: "blur(40px)", transform: "translate(30%, -30%)" }} />
        </motion.div>
    );
}
