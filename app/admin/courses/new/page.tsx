"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Sparkles,
    Layers,
    Zap,
    BookOpen,
    ArrowLeft,
    Wand2,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import NeuralLoom from "@/components/generation/neural-loom";

const LESSONS_PER_MODULE = 2; // fixed — each module always has 2 lessons

const MODULE_OPTIONS = [
    { count: 1, label: "1 Module",  desc: "2 lessons · Quick intro" },
    { count: 2, label: "2 Modules", desc: "4 lessons · Core course" },
    { count: 3, label: "3 Modules", desc: "6 lessons · Extended" },
    { count: 4, label: "4 Modules", desc: "8 lessons · Full programme" },
];

export default function NewCoursePage() {
    const router = useRouter();
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
    const [courseHost, setCourseHost] = useState<'sarah' | 'gemma'>('sarah');
    const [moduleHost, setModuleHost] = useState<'sarah' | 'gemma'>('sarah');
    const [isGenerating, setIsGenerating] = useState(false);
    const [topicCount, setTopicCount] = useState(2);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [progress, setProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState("Initialising Protocol...");
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState<{ title: string, message: string, details?: string } | null>(null);

    useEffect(() => {
        if (!isGenerating || progress >= 100) return;
        const messages = [
            "Consulting expert knowledge base...",
            "Refining lesson quality...",
            "Ensuring pedagogical alignment...",
            "Validating strict constraints...",
            "Optimising media prompts...",
            "Synthesising final modules..."
        ];
        let msgIndex = 0;
        const heartbeat = setInterval(() => {
            setLogs(prev => {
                const nextMsg = messages[msgIndex % messages.length];
                if (prev[0] !== nextMsg) return [nextMsg, ...prev].slice(0, 5);
                return prev;
            });
            msgIndex++;
        }, 6000);
        return () => clearInterval(heartbeat);
    }, [progress, isGenerating]);

    const totalLessons = topicCount * LESSONS_PER_MODULE;

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setLogs(["Initialising connection..."]);
        setProgress(0);
        setCurrentStage("Initialising...");

        try {
            const endpoint = '/api/course/generate-v2';

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseName: topic,
                    difficultyLevel: difficulty,
                    targetAudience: "Professionals",
                    courseDescription: `A comprehensive ${difficulty} course on ${topic}.`,
                    targetDuration: 60,
                    topicCount,
                    lessonsPerTopic: LESSONS_PER_MODULE,
                    videoSettings: { courseHost, moduleHost }
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`Generation Service Unavailable: ${errorData.message || `Status: ${res.status}`}`);
            }

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value);
                const lines = chunkValue.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.stage === 'error') {
                                const safeMessages = [
                                    "Validation Failed", "Content Violation", "Safety Policy",
                                    "Prohibited pattern", "Paragraph sentence limit", "Hard pipeline violation"
                                ];
                                const isSafe = safeMessages.some(msg => (data.message || '').includes(msg));
                                setError({
                                    title: "Course Creation Failed",
                                    message: "The system encountered a quality control issue.",
                                    details: isSafe ? data.message : "The generated content did not meet strict quality standards after multiple repair attempts. Please try again or adjust your topic."
                                });
                                return;
                            }

                            if (data.message) {
                                const stageMap: Record<string, string> = {
                                    'init': 'Initialising...',
                                    'setup': 'Creating Shell...',
                                    'planning': 'Drafting Syllabus...',
                                    'generating': 'Building Lessons...',
                                    'finalizing': 'Polishing...',
                                    'completed': 'Ready.'
                                };
                                if (data.stage && stageMap[data.stage]) setCurrentStage(stageMap[data.stage]);
                                setLogs(prev => [data.message, ...prev].slice(0, 8));
                            }

                            if (data.progress) setProgress(data.progress);

                            if (data.stage === 'completed') {
                                setLogs(prev => ["Redirecting to course...", ...prev]);
                                setCurrentStage("Complete");
                                setTimeout(() => router.push(`/courses/${data.courseId}`), 1000);
                            }
                        } catch {
                            // skip malformed lines
                        }
                    }
                }
            }
        } catch (e: any) {
            console.error(e);
            setError({ title: "System Error", message: "An unexpected error occurred during creation.", details: e.message });
        }
    };

    if (isGenerating) {
        return <NeuralLoom progress={progress} logs={logs} stage={currentStage} error={error} />;
    }

    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] font-sans selection:bg-violet-500/20">

            {/* AMBIENT BACKGROUND */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-[#9B8FFF]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-[#00FFB3]/5 rounded-full blur-[120px]" />
            </div>

            {/* HEADER */}
            <nav className="relative z-50 px-8 py-6 flex items-center justify-between">
                <Link href="/admin/courses" className="flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Studio
                </Link>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">Architect Engine v4.0</span>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <main className="relative z-10 container mx-auto px-4 max-w-4xl min-h-[80vh] flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full pb-20"
                >
                    {/* H1 HEADER */}
                    <div className="text-center mb-12 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] mb-4">
                            <Sparkles className="w-3.5 h-3.5 text-[#9B8FFF] fill-[#9B8FFF]" />
                            <span className="text-xs font-semibold text-white/60 tracking-wide uppercase">Course Designer</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
                            Name your subject. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9B8FFF] to-[#00FFB3]">
                                Our AI architects the rest.
                            </span>
                        </h1>
                        <p className="text-lg text-white/45 max-w-2xl mx-auto">
                            Design professional courses in seconds. Our curriculum engine crafts the syllabus, content, and diagrams while you focus on the vision.
                        </p>
                    </div>

                    {/* INTERACTIVE CARD */}
                    <div className="bg-white/[0.04] backdrop-blur-sm rounded-[2rem] p-8 md:p-12 border border-white/[0.08] space-y-10 relative overflow-hidden group">

                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        {/* COURSE SUBJECT */}
                        <div className="space-y-4 relative z-10">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Course Subject</label>
                            <div className="relative group/input">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9B8FFF] to-[#00FFB3] rounded-2xl opacity-0 group-focus-within/input:opacity-20 transition-opacity duration-300 blur-sm" />
                                <input
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Advanced Neural Architectures..."
                                    className="relative w-full bg-white/[0.06] border border-white/[0.10] text-white text-2xl md:text-3xl font-medium placeholder:text-white/20 rounded-xl px-6 py-6 focus:outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all duration-300"
                                    autoFocus
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">
                                    <Wand2 className={cn("w-6 h-6", topic ? "text-violet-500 animate-pulse" : "")} />
                                </div>
                            </div>
                        </div>

                        {/* COURSE STRUCTURE — module count */}
                        <div className="space-y-4 relative z-10">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">
                                Course Structure
                                <span className="ml-2 font-normal normal-case text-white/30">— each module contains 2 lessons</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {MODULE_OPTIONS.map((opt) => {
                                    const active = topicCount === opt.count;
                                    return (
                                        <button
                                            key={opt.count}
                                            onClick={() => setTopicCount(opt.count)}
                                            className={cn(
                                                "relative rounded-xl border p-4 text-left transition-all duration-200",
                                                active
                                                    ? "bg-white/[0.10] border-[#9B8FFF]/50 shadow-xl scale-[1.03] ring-2 ring-[#9B8FFF]/30"
                                                    : "bg-white/[0.03] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06]"
                                            )}
                                        >
                                            <div className={cn("text-2xl font-bold mb-1", active ? "text-white" : "text-white/70")}>
                                                {opt.count}
                                            </div>
                                            <div className={cn("text-xs font-semibold", active ? "text-[#9B8FFF]" : "text-white/40")}>
                                                {opt.label}
                                            </div>
                                            <div className={cn("text-[10px] mt-0.5", active ? "text-white/40" : "text-white/30")}>
                                                {opt.desc}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* DIFFICULTY */}
                        <div className="space-y-4 relative z-10">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Target Audience</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { id: "beginner", label: "Beginner", desc: "Foundational Concepts", icon: BookOpen },
                                    { id: "intermediate", label: "Intermediate", desc: "Practical Application", icon: Layers },
                                    { id: "advanced", label: "Advanced", desc: "Expert Mastery", icon: Zap }
                                ].map((level) => {
                                    const Icon = level.icon;
                                    const active = difficulty === level.id;
                                    return (
                                        <button
                                            key={level.id}
                                            onClick={() => setDifficulty(level.id as any)}
                                            className={cn(
                                                "relative md:h-32 rounded-xl border p-4 text-left transition-all duration-200 group/card",
                                                active
                                                    ? "bg-white/[0.10] border-[#9B8FFF]/50 shadow-xl scale-[1.02]"
                                                    : "bg-white/[0.03] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06]"
                                            )}
                                        >
                                            <div className="flex flex-col h-full justify-between">
                                                <div className={cn("p-2 rounded-lg w-fit transition-colors", active ? "bg-white/10 text-white" : "bg-white/[0.06] text-white/40 group-hover/card:bg-white/[0.10]")}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className={cn("font-semibold", active ? "text-white" : "text-white/70")}>{level.label}</div>
                                                    <div className={cn("text-xs mt-1", active ? "text-white/40" : "text-white/35")}>{level.desc}</div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* AVATAR SELECTION */}
                        <div className="space-y-4 relative z-10">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Exclusive AI Host</label>
                            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* SARAH */}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setCourseHost('sarah'); setModuleHost('sarah'); }}
                                        className={cn(
                                            "relative w-full overflow-hidden rounded-xl border text-left transition-all duration-300 group/avatar h-56 z-10 cursor-pointer",
                                            courseHost === 'sarah'
                                                ? "border-[#9B8FFF] ring-2 ring-[#9B8FFF] shadow-xl scale-[1.02] bg-[#0A4F70]"
                                                : "border-white/[0.10] bg-white/[0.04] hover:border-white/20 opacity-80 hover:opacity-100"
                                        )}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <img src="/sarah_host.png?v=2" alt="Sarah" className="h-full w-auto object-contain" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                                        </div>
                                        <div className="absolute bottom-0 left-0 p-5 w-full pointer-events-none">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className={cn("w-2 h-2 rounded-full", courseHost === 'sarah' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" : "bg-slate-400")} />
                                                <span className={cn("text-[10px] font-bold uppercase tracking-widest", courseHost === 'sarah' ? "text-emerald-400" : "text-slate-400")}>
                                                    {courseHost === 'sarah' ? "AI HOST ACTIVE" : "SELECT SARAH"}
                                                </span>
                                            </div>
                                            <div className="font-bold text-white text-xl">Sarah</div>
                                            <div className="text-xs text-slate-300 font-medium opacity-90">Warm, Professional, Insightful</div>
                                        </div>
                                    </button>

                                    {/* GEMMA */}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setCourseHost('gemma'); setModuleHost('gemma'); }}
                                        className={cn(
                                            "relative w-full overflow-hidden rounded-xl border text-left transition-all duration-300 group/avatar h-56 z-10 cursor-pointer",
                                            courseHost === 'gemma'
                                                ? "border-[#00FFB3] ring-2 ring-[#00FFB3] shadow-xl scale-[1.02] bg-[#3B2C50]"
                                                : "border-white/[0.10] bg-white/[0.04] hover:border-white/20 opacity-80 hover:opacity-100"
                                        )}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <img src="/gemma_host.png?v=2" alt="Gemma" className="h-full w-auto object-contain" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-cyan-900/40 to-transparent opacity-80" />
                                        </div>
                                        <div className="absolute bottom-0 left-0 p-5 w-full pointer-events-none">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className={cn("w-2 h-2 rounded-full", courseHost === 'gemma' ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" : "bg-slate-400")} />
                                                <span className={cn("text-[10px] font-bold uppercase tracking-widest", courseHost === 'gemma' ? "text-[#00FFB3]" : "text-slate-400")}>
                                                    {courseHost === 'gemma' ? "AI HOST ACTIVE" : "SELECT GEMMA"}
                                                </span>
                                            </div>
                                            <div className="font-bold text-white text-xl">Gemma</div>
                                            <div className="text-xs text-slate-300 font-medium opacity-90">Energetic, Professional, Clear</div>
                                        </div>
                                    </button>
                                </div>

                                <div className="mt-4 p-4 rounded-xl bg-[#9B8FFF]/10 border border-[#9B8FFF]/20">
                                    <p className="text-[11px] text-[#9B8FFF] leading-relaxed font-medium">
                                        <strong>Selection Tip:</strong> Sarah uses a warm, nurturing tone perfect for soft skills and theory, while Gemma's energetic delivery is ideal for fast-moving technical bytes.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ACTION */}
                        <div className="pt-4 relative z-10 space-y-4">
                            <button
                                onClick={handleGenerate}
                                disabled={!topic}
                                className={cn(
                                    "w-full relative overflow-hidden rounded-xl py-6 font-bold text-lg tracking-wide transition-all duration-300 shadow-xl",
                                    topic
                                        ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01]"
                                        : "bg-white/[0.04] text-white/20 cursor-not-allowed"
                                )}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {topic ? (
                                        <>
                                            <Sparkles className="w-5 h-5 fill-white/20" />
                                            Generate Curriculum
                                        </>
                                    ) : (
                                        "Enter a Subject to Begin"
                                    )}
                                </span>
                                {topic && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                                )}
                            </button>

                            {topic && (
                                <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                                    <div className="flex items-center gap-1.5">
                                        <Layers className="w-3 h-3 text-[#9B8FFF]" />
                                        {topicCount} module{topicCount > 1 ? 's' : ''} · {totalLessons} lessons
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <div className="flex items-center gap-1.5">
                                        <Zap className="w-3 h-3 text-[#FFB347]" />
                                        Est. Cost: ~£{(topicCount * 0.20).toFixed(2)}
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <div className="flex items-center gap-1.5">
                                        <BookOpen className="w-3 h-3 text-[#00FFB3]" />
                                        1 AI Intro Video (45s)
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* FOOTER METRICS */}
                    <div className="mt-8 grid grid-cols-3 gap-8 text-center px-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-white">1.2s</div>
                            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">Avg. Gen Time</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-white">Top 1%</div>
                            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">Quality Score</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-white">4K+</div>
                            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">Courses Created</div>
                        </div>
                    </div>

                </motion.div>
            </main>
        </div>
    );
}
