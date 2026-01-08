import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Rocket, BookOpen, MessageSquare, Video, Code, ArrowRight } from "lucide-react";

export default function ExecutionPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            {/* Hero Section */}
            <section className="relative mx-auto w-[95%] max-w-7xl my-8 rounded-3xl border border-white/5 shadow-2xl py-20 lg:py-32 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-slate-900 to-slate-900"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center max-w-4xl mx-auto space-y-6">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm px-4 py-1.5">
                            PHASE 02
                        </Badge>
                        <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight">
                            Hands-On <span className="text-emerald-400">Execution</span>
                        </h1>
                        <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
                            Engage with world-class lessons, practical exercises, and AI tutoring for optimal learning outcomes.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="mx-auto w-[95%] max-w-7xl my-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl py-16 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-6">
                    {/* Feature Image */}
                    <div className="relative h-[400px] rounded-2xl overflow-hidden mb-12 shadow-2xl">
                        <Image
                            src="/mastery/Phase 2.png"
                            alt="Hands-On Execution"
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Description */}
                    <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto space-y-8">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Learn By Doing, Not Just Watching
                        </h2>

                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            Theory alone doesn't build expertise. Our execution phase immerses you in practical, hands-on learning experiences
                            designed to cement your understanding. Work on real projects, get instant AI feedback, and master skills through practice.
                        </p>

                        {/* Learning Features */}
                        <div className="grid md:grid-cols-3 gap-6 my-12">
                            {[
                                {
                                    icon: Video,
                                    title: "60-Minute Lessons",
                                    description: "Byte-sized, focused content that respects your time while delivering maximum value."
                                },
                                {
                                    icon: Code,
                                    title: "Practical Exercises",
                                    description: "Apply what you learn immediately with real-world coding challenges and projects."
                                },
                                {
                                    icon: MessageSquare,
                                    title: "AI Tutor Support",
                                    description: "Get instant answers and personalized guidance from our AI teaching assistant 24/7."
                                },
                                {
                                    icon: BookOpen,
                                    title: "Interactive Content",
                                    description: "Engage with quizzes, simulations, and hands-on labs to reinforce learning."
                                },
                                {
                                    icon: Rocket,
                                    title: "Progressive Challenges",
                                    description: "Gradually increase difficulty as your skills grow, keeping you in the optimal learning zone."
                                },
                                {
                                    icon: MessageSquare,
                                    title: "Community Discussions",
                                    description: "Collaborate with peers, share insights, and learn from other students' experiences."
                                }
                            ].map((feature, idx) => (
                                <Card key={idx} className="border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition-all">
                                    <CardContent className="p-6 space-y-3 text-center">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                                            <feature.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-12">
                            The Execution Experience
                        </h3>

                        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 space-y-6">
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">A Typical 60-Minute Lesson</h4>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-bold text-lg">0-15 min</div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">Introduction & Context</p>
                                        <p className="text-slate-600 dark:text-slate-400">Clear explanation of concepts with real-world examples</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-bold text-lg">15-35 min</div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">Hands-On Practice</p>
                                        <p className="text-slate-600 dark:text-slate-400">Build, code, and experiment with guided exercises</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-bold text-lg">35-50 min</div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">Real Project Application</p>
                                        <p className="text-slate-600 dark:text-slate-400">Apply your new skills to a practical mini-project</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-bold text-lg">50-60 min</div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">Review & Reinforcement</p>
                                        <p className="text-slate-600 dark:text-slate-400">Quick quiz and key takeaways to solidify learning</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center mt-16">
                        <Link href="/courses">
                            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-14 text-lg rounded-full shadow-lg shadow-emerald-600/20">
                                Start Learning Now <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <div className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                            <Link href="/phases/selection">
                                <Button variant="outline" size="lg" className="rounded-full">
                                    &larr; Phase 01: Selection
                                </Button>
                            </Link>
                            <Link href="/phases/validation">
                                <Button variant="outline" size="lg" className="rounded-full">
                                    Phase 03: Validation &rarr;
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
