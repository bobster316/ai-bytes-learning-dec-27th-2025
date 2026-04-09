import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Target, Brain, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default function SelectionPage() {
    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)]">
            <Header />

            {/* Hero Section */}
            <section className="relative mx-auto w-[95%] max-w-screen-2xl my-8 rounded-3xl border border-white/5 shadow-2xl py-20 lg:py-32 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-slate-900 to-slate-900"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center max-w-4xl mx-auto space-y-6">
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1.5">
                            PHASE 01
                        </Badge>
                        <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight">
                            AI-Powered Course <span className="text-cyan-400">Selection</span>
                        </h1>
                        <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
                            Browse curated content with AI-powered course selection to match your goals and skill level perfectly.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="mx-auto w-[95%] max-w-screen-2xl my-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl py-16 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-6">
                    {/* Feature Image */}
                    <div className="relative h-[400px] rounded-2xl overflow-hidden mb-12 shadow-2xl">
                        <Image
                            src="/mastery/Phase 1.png"
                            alt="AI-Powered Course Selection"
                            fill
                            className="object-cover"
                            sizes="(max-width: 1280px) 100vw, 1280px"
                        />
                    </div>

                    {/* Description */}
                    <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto space-y-8">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Your Personalized Learning Path Starts Here
                        </h2>

                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            Finding the right AI course shouldn't feel overwhelming. Our intelligent selection system analyzes your background,
                            goals, and available time to recommend the perfect learning path. No more endless scrolling through irrelevant content.
                        </p>

                        {/* Key Features */}
                        <div className="grid md:grid-cols-2 gap-6 my-12">
                            {[
                                {
                                    thumbnail: "/assets/thumbnails/instruction.png",
                                    title: "AI-Powered Recommendations",
                                    description: "Our algorithm learns from your preferences and skill level to suggest courses that match your exact needs."
                                },
                                {
                                    thumbnail: "/assets/thumbnails/target.png",
                                    title: "Goal-Oriented Matching",
                                    description: "Tell us what you want to achieve, and we'll map out the most efficient route to get you there."
                                },
                                {
                                    thumbnail: "/assets/thumbnails/visual-dna.png",
                                    title: "Curated Quality Content",
                                    description: "Every course is hand-selected and vetted by AI experts to ensure you learn from the best."
                                },
                                {
                                    thumbnail: "/assets/thumbnails/assessment.png",
                                    title: "Skill Level Assessment",
                                    description: "Start at exactly the right difficulty level with our intelligent skill assessment."
                                }
                            ].map((feature, idx) => (
                                <Card key={idx} className="border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all">
                                    <CardContent className="p-6 space-y-3">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                                            <img src={feature.thumbnail} className="w-8 h-8 object-contain" alt={feature.title} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                            {feature.title}
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-12">
                            How It Works
                        </h3>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-[#030305] flex items-center justify-center font-bold">1</div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">Tell Us Your Goals</h4>
                                    <p className="text-slate-600 dark:text-slate-400">Share what you want to learn and why. Career change? New skill? We'll tailor our recommendations.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-[#030305] flex items-center justify-center font-bold">2</div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">Quick Skill Assessment</h4>
                                    <p className="text-slate-600 dark:text-slate-400">Take our 5-minute assessment to determine your current knowledge level.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-[#030305] flex items-center justify-center font-bold">3</div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">Get Your Personalized Path</h4>
                                    <p className="text-slate-600 dark:text-slate-400">Receive a custom learning roadmap designed specifically for your success.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center mt-16">
                        <Link href="/courses">
                            <Button size="lg" className="bg-primary hover:brightness-110 text-[#030305] font-black px-8 h-14 text-lg rounded-full shadow-lg shadow-primary/20">
                                Browse All Courses <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Next Phase */}
                    <div className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-center space-y-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Next Phase</p>
                            <Link href="/phases/execution">
                                <Button variant="outline" size="lg" className="rounded-full">
                                    Phase 02: Execution &rarr;
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

