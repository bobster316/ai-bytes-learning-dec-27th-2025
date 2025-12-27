
"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { GreenScreenVideo } from "@/components/ui/green-screen-video";
import { BorderBeam } from "@/components/ui/border-beam";
import { TextReveal } from "@/components/ui/text-reveal";
import { FlipWords } from "@/components/ui/flip-words";

export function AppleHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const router = useRouter();

    const [courseTitle, setCourseTitle] = useState("");
    const [difficulty, setDifficulty] = useState("beginner");
    const [isGenerating, setIsGenerating] = useState(false);

    // Parallax effects
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);
    const scale = useTransform(scrollY, [0, 500], [1, 1.1]);

    const handleGenerate = async () => {
        if (!courseTitle.trim()) return;

        setIsGenerating(true);
        try {
            const response = await fetch('/api/course/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    courseName: courseTitle,
                    difficultyLevel: difficulty,
                    targetDuration: 60, // Fixed duration for quick generation
                    targetAudience: 'General Learners'
                }),
            });

            if (!response.ok) {
                throw new Error('Generation failed');
            }

            const data = await response.json();
            if (data.success) {
                // Redirect to the new course page
                router.push(`/courses/${data.courseId}`);
            }
        } catch (error) {
            console.error("Course generation error:", error);
            setIsGenerating(false);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full bg-background text-foreground flex items-center py-20 lg:py-32">
            {/* Background - Abstract Digital Waves (Constrained to Container) */}
            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden">
                <motion.div
                    style={{ scale }}
                    className="w-full container mx-auto px-4 h-[calc(100vh-4rem)]"
                >
                    <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80 z-10" />
                        <img
                            src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2564&auto=format&fit=crop"
                            alt="Abstract AI Waves"
                            className="w-full h-full object-cover opacity-60 transition-all duration-500"
                        />
                    </div>
                </motion.div>
            </div>

            {/* Content Container */}
            <div className="container mx-auto px-6 md:px-12 relative z-20">
                <div className="grid lg:grid-cols-2 gap-8 items-center">

                    {/* Left: Text Content - Now Centered */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ y: y1, opacity }}
                        className="space-y-8 text-center relative z-20"
                    >

                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter-apple text-balance leading-none text-white drop-shadow-2xl">
                            Master <br />
                            <FlipWords words={[
                                // Core AI
                                "AI", "ML", "NLP", "LLMs", "AGI", "GPT", "RAG", "CNN", "RNN", "GAN",
                                // Languages
                                "Python", "JavaScript", "SQL", "R", "Julia", "Rust", "Go",
                                // Tools & Platforms
                                "ChatGPT", "Claude", "Gemini", "Copilot", "Grok", "Perplexity",
                                "OpenAI", "Anthropic", "Mistral", "Llama", "Deepseek", "Cohere",
                                // Image AI
                                "DALL-E", "Midjourney", "Flux", "Sora", "Runway", "VEO", "Pika",
                                // Voice & Audio
                                "Whisper", "ElevenLabs", "Suno", "Udio",
                                // Frameworks
                                "TensorFlow", "PyTorch", "Keras", "JAX", "FastAI", "LangChain",
                                // Data
                                "Pandas", "NumPy", "Spark", "Kafka", "Redis", "Postgres",
                                // Cloud
                                "AWS", "Azure", "GCP", "Vercel", "Docker", "K8s",
                                // Concepts (short)
                                "Prompts", "Agents", "Coding", "Data", "Vision", "Voice",
                                "Robotics", "Chatbots", "Embeddings", "Vectors", "Tokens",
                                "Fine-Tune", "Training", "Inference", "Models", "APIs",
                                // Trending
                                "AI Art", "AI Code", "AI Music", "AI Video", "AI Voice",
                                "GLM", "o1", "GPT-4o", "Sonnet", "Opus", "Haiku"
                            ]} className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-purple-600" />
                            <br />
                            <span className="text-white text-5xl md:text-7xl lg:text-8xl">in 60 Minutes.</span>
                        </h1>

                        {/* Text Reveal Effect for Subtitle */}
                        <div className="h-[100px] overflow-hidden flex justify-center">
                            <TextReveal text="The world's most complex technology, decoded into ultra-short, cinematic lessons." className="h-auto min-h-0" />
                        </div>

                        {/* NEW: Course Generation Form */}
                        <div className="w-full max-w-xl mx-auto space-y-4 pt-4 backdrop-blur-xl bg-white/5 p-6 rounded-3xl border border-white/10 shadow-2xl">
                            <div className="flex flex-col gap-4">
                                <input
                                    type="text"
                                    placeholder="What do you want to learn? (e.g. 'Quantum Computing')"
                                    value={courseTitle}
                                    onChange={(e) => setCourseTitle(e.target.value)}
                                    className="w-full px-6 py-4 text-xl rounded-full bg-black/40 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
                                />

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="px-6 py-4 text-lg rounded-full bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer text-center sm:w-1/3"
                                    >
                                        <option value="beginner" className="text-black bg-white">Beginner</option>
                                        <option value="intermediate" className="text-black bg-white">Intermediate</option>
                                        <option value="advanced" className="text-black bg-white">Advanced</option>
                                    </select>

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !courseTitle.trim()}
                                        size="lg"
                                        className="flex-1 rounded-full px-8 py-8 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-all hover:scale-[1.02] border-none shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                Generate Course <Sparkles className="ml-3 w-6 h-6" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <p className="text-white/40 text-sm">
                                AI will generate a complete, expert-level course in ~3 minutes.
                            </p>
                        </div>

                    </motion.div>

                    {/* Right: Avatar (HeroVideo) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative mx-auto w-full flex items-center justify-center lg:scale-125 lg:origin-center"
                    >
                        {/* Glow Effect */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-full blur-3xl opacity-30 animate-pulse"></div>

                        <div className="relative z-10 transform hover:scale-[1.02] transition-transform duration-500 w-full">
                            <BorderBeam size={250} duration={12} delay={9} className="z-10" />
                            <div className="relative group rounded-2xl overflow-hidden w-full aspect-square z-30">
                                <GreenScreenVideo
                                    src="/ai_avatar/avatar greeen screen.mp4"
                                    className="w-full h-full object-cover"
                                    threshold={100} // Adjust as needed
                                    smoothing={0.1}
                                    autoPlay={false}
                                />
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
            >
                <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-foreground to-transparent opacity-50" />
            </motion.div>
        </div >
    );
}
