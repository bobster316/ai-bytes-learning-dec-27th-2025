"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Rocket, Target, Code, Briefcase, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const learningPaths = [
    {
        id: "ai-fundamentals",
        title: "AI Fundamentals",
        description: "Start your AI journey with core concepts, terminology, and real-world applications.",
        icon: Brain,
        courses: 8,
        duration: "8 hours",
        level: "Beginner",
        color: "from-cyan-500 to-blue-500",
        image: "/categories/AI Foundations & Fundamentals.png"
    },
    {
        id: "prompt-engineering",
        title: "Prompt Engineering Mastery",
        description: "Learn to craft powerful prompts for ChatGPT, Claude, and other LLMs.",
        icon: Target,
        courses: 6,
        duration: "6 hours",
        level: "Intermediate",
        color: "from-cyan-600 to-blue-600",
        image: "/categories/Prompt Engineering & AI Communication.png"
    },
    {
        id: "ai-for-business",
        title: "AI for Business Leaders",
        description: "Strategic AI implementation, ROI analysis, and transformation roadmaps.",
        icon: Briefcase,
        courses: 5,
        duration: "5 hours",
        level: "Intermediate",
        color: "from-teal-500 to-cyan-500",
        image: "/categories/AI for Business & Strategy.png"
    },
    {
        id: "generative-ai",
        title: "Generative AI Expert",
        description: "Master text, image, and video generation with cutting-edge AI tools.",
        icon: Rocket,
        courses: 7,
        duration: "7 hours",
        level: "Advanced",
        color: "from-blue-500 to-indigo-500",
        image: "/categories/Generative AI & Large Language Models (LLMs).png"
    },
    {
        id: "ai-development",
        title: "AI Development",
        description: "Build AI applications, agents, and automation workflows.",
        icon: Code,
        courses: 10,
        duration: "10 hours",
        level: "Advanced",
        color: "from-cyan-500 to-teal-500",
        image: "/categories/AI Agents & Automation.png"
    },
    {
        id: "ai-ethics",
        title: "AI Ethics & Governance",
        description: "Responsible AI, bias mitigation, privacy, and regulatory compliance.",
        icon: Shield,
        courses: 4,
        duration: "4 hours",
        level: "All Levels",
        color: "from-blue-600 to-cyan-600",
        image: "/categories/AI Ethics, Governance & Responsible AI.png"
    }
];

export default function LearningPathsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
            <Header />

            {/* Hero */}
            <section className="relative mx-auto w-[95%] max-w-screen-2xl my-4 rounded-3xl border border-white/5 shadow-2xl py-16 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-900"></div>
                <div className="container relative z-10 mx-auto px-4 max-w-screen-2xl text-center">
                    <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        STRUCTURED LEARNING
                    </Badge>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
                        Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Paths</span>
                    </h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        Curated course sequences designed to take you from beginner to expert in specific AI domains.
                    </p>
                </div>
            </section>

            {/* Paths Grid */}
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-screen-2xl">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {learningPaths.map((path) => (
                            <Card key={path.id} className="group overflow-hidden bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-500 cursor-pointer">
                                <div className="relative h-40 overflow-hidden">
                                    <Image src={path.image} alt={path.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900">{path.level}</Badge>
                                </div>
                                <CardContent className="p-6 space-y-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${path.color} flex items-center justify-center`}>
                                        <path.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">
                                        {path.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{path.description}</p>
                                    <div className="flex items-center justify-between text-sm text-slate-500">
                                        <span>{path.courses} courses</span>
                                        <span>{path.duration}</span>
                                    </div>
                                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                                        Start Path <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

