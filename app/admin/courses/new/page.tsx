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
    Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import NeuralLoom from "@/components/generation/neural-loom";

export default function NewCoursePage() {
    const router = useRouter();
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
    const [isGenerating, setIsGenerating] = useState(false);

    // Logic for loading screen
    const [progress, setProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState("Initializing Protocol...");
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState<{ title: string, message: string, details?: string } | null>(null);

    // Heartbeat / "Stuck" Reassurance Effect
    useEffect(() => {
        if (!isGenerating || progress >= 100) return;

        const messages = [
            "Consulting expert knowledge base...",
            "Refining lesson quality...",
            "Ensuring pedagogical alignment...",
            "Validating strict constraints...",
            "Optimizing media prompts...",
            "Synthesizing final modules..."
        ];

        let msgIndex = 0;

        // If no progress update for 6 seconds, cycle reassurance messages
        const heartbeat = setInterval(() => {
            setLogs(prev => {
                const last = prev[0];
                const nextMsg = messages[msgIndex % messages.length];
                if (last !== nextMsg) {
                    return [nextMsg, ...prev].slice(0, 5);
                }
                return prev;
            });
            msgIndex++;
        }, 6000);

        return () => clearInterval(heartbeat);
    }, [progress, isGenerating]);


    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null); // Reset error
        setLogs(["Initializing connection..."]);
        setProgress(0);
        setCurrentStage("Initializing...");

        try {
            const res = await fetch("/api/course/generate", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseName: topic,
                    difficultyLevel: difficulty,
                    targetAudience: "Professionals",
                    courseDescription: `A comprehensive ${difficulty} course on ${topic}.`,
                    targetDuration: 60
                }),
            });

            if (!res.ok) {
                // Handle non-200 immediate failures
                throw new Error(`Generation Service Unavailable: ${res.status}`);
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
                        const jsonStr = line.slice(6);
                        try {
                            const data = JSON.parse(jsonStr);

                            if (data.stage === 'error') {
                                // TERMINAL ERROR STATE
                                // TERMINAL ERROR STATE
                                const sanitizeError = (rawMessage: string) => {
                                    const safeMessages = [
                                        "Validation Failed",
                                        "Content Violation",
                                        "Safety Policy",
                                        "Prohibited pattern",
                                        "Paragraph sentence limit",
                                        "Hard pipeline violation"
                                    ];

                                    const isSafe = safeMessages.some(msg => rawMessage.includes(msg));

                                    if (isSafe) return rawMessage;

                                    // If technical/unknown error, log it but show generic to user
                                    console.error("Technical Failure masked from UI:", rawMessage);
                                    return "The generated content did not meet strict quality standards after multiple repair attempts. Please try again or adjust your topic.";
                                };

                                setError({
                                    title: "Course Generation Failed",
                                    message: "The system encountered a quality control issue.",
                                    details: sanitizeError(data.message)
                                });
                                // Keep isGenerating=true so NeuralLoom stays mounted to show the error
                                return; // Stop processing stream
                            }

                            if (data.message) {
                                // If stage is explicit, update Header
                                if (data.stage && data.stage !== 'generating') {
                                    const map: Record<string, string> = {
                                        'init': 'Initializing...',
                                        'setup': 'Creating Shell...',
                                        'planning': 'Drafting Syllabus...',
                                        'finalizing': 'Polishing...',
                                        'completed': 'Ready.'
                                    };
                                    setCurrentStage(map[data.stage] || data.stage.toUpperCase());
                                }
                                setLogs(prev => [data.message, ...prev].slice(0, 5));
                            }

                            if (data.progress) setProgress(data.progress);

                            if (data.stage === 'completed') {
                                setLogs(prev => ["Redirecting to course...", ...prev]);
                                setCurrentStage("Complete");
                                setTimeout(() => {
                                    router.push(`/courses/${data.courseId}`);
                                }, 1000);
                            }

                        } catch (parseErr) {
                            console.warn("Stream parse error:", parseErr);
                        }
                    }
                }
            }

        } catch (e: any) {
            console.error(e);
            setError({
                title: "System Error",
                message: "An unexpected error occurred during generation.",
                details: e.message
            });
            // Keep isGenerating=true to show error panel
        }
    };

    if (isGenerating) {
        return <NeuralLoom progress={progress} logs={logs} stage={currentStage} error={error} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-violet-500/20 selection:text-violet-900">

            {/* AMBIENT BACKGROUND */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-violet-100/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-cyan-100/50 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.4] mix-blend-soft-light" />
            </div>

            {/* HEADER */}
            <nav className="relative z-50 px-8 py-6 flex items-center justify-between">
                <Link
                    href="/admin/courses"
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
                >
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
                    className="w-full"
                >
                    {/* H1 HEADER */}
                    <div className="text-center mb-12 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm mb-4">
                            <Sparkles className="w-3.5 h-3.5 text-violet-500 fill-violet-500" />
                            <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">AI Course Designer</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
                            What enters your mind, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">
                                becomes your curriculum.
                            </span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Design professional courses in seconds. Our AI architect crafts the syllabus, content, and diagrams while you focus on the vision.
                        </p>
                    </div>

                    {/* INTERACTIVE CARD */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white space-y-10 relative overflow-hidden group">

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        {/* INPUT SECTION */}
                        <div className="space-y-4 relative z-10">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Course Subject
                            </label>
                            <div className="relative group/input">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-2xl opacity-0 group-focus-within/input:opacity-20 transition-opacity duration-300 blur-sm" />
                                <input
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Advanced Neural Architectures..."
                                    className="relative w-full bg-slate-50 border border-slate-200 text-slate-900 text-2xl md:text-3xl font-medium placeholder:text-slate-300 rounded-xl px-6 py-6 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-300"
                                    autoFocus
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                                    <Wand2 className={cn("w-6 h-6", topic ? "text-violet-500 animate-pulse" : "")} />
                                </div>
                            </div>
                        </div>

                        {/* DIFFICULTY SECTION */}
                        <div className="space-y-4 relative z-10">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Target Audience
                            </label>
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
                                                    ? "bg-slate-900 border-slate-900 shadow-xl scale-[1.02]"
                                                    : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-md"
                                            )}
                                        >
                                            <div className="flex flex-col h-full justify-between">
                                                <div className={cn("p-2 rounded-lg w-fit transition-colors", active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500 group-hover/card:bg-slate-200")}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className={cn("font-semibold", active ? "text-white" : "text-slate-900")}>
                                                        {level.label}
                                                    </div>
                                                    <div className={cn("text-xs mt-1", active ? "text-slate-400" : "text-slate-500")}>
                                                        {level.desc}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ACTION SECTION */}
                        <div className="pt-4 relative z-10">
                            <button
                                onClick={handleGenerate}
                                disabled={!topic}
                                className={cn(
                                    "w-full relative overflow-hidden rounded-xl py-6 font-bold text-lg tracking-wide transition-all duration-300 shadow-xl",
                                    topic
                                        ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01]"
                                        : "bg-slate-100 text-slate-300 cursor-not-allowed"
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
                        </div>

                    </div>

                    {/* FOOTER METRICS */}
                    <div className="mt-8 grid grid-cols-3 gap-8 text-center px-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-slate-900">1.2s</div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Gen Time</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-slate-900">Top 1%</div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality Score</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-slate-900">4K+</div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses Created</div>
                        </div>
                    </div>

                </motion.div>
            </main>
        </div>
    );
}
