"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, ArrowRight, Heart, Zap, Users, Globe } from "lucide-react";

const openPositions = [
    { title: "Senior AI Content Creator", department: "Content", location: "Remote", type: "Full-time" },
    { title: "Full-Stack Developer", department: "Engineering", location: "Remote", type: "Full-time" },
    { title: "UX/UI Designer", department: "Design", location: "Remote", type: "Full-time" },
    { title: "AI Curriculum Specialist", department: "Education", location: "Remote", type: "Contract" },
];

const perks = [
    { icon: Globe, title: "Remote First", description: "Work from anywhere in the world" },
    { icon: Zap, title: "Latest Tech", description: "Work with cutting-edge AI tools" },
    { icon: Heart, title: "Health & Wellness", description: "Comprehensive benefits package" },
    { icon: Users, title: "Great Team", description: "Collaborative, supportive culture" },
];

export default function CareersPage() {
    return (
        <div className="min-h-screen bg-[var(--page-bg)]">
            <Header />

            {/* Hero */}
            <section className="keep-dark relative mx-auto w-[95%] max-w-screen-2xl my-4 rounded-3xl border border-white/5 shadow-2xl py-16 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-900"></div>
                <div className="container relative z-10 mx-auto px-4 max-w-screen-2xl text-center">
                    <Badge className="mb-4 bg-[#00FFB3]/20 text-[#00FFB3] border-[#00FFB3]/30">
                        JOIN OUR TEAM
                    </Badge>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
                        Shape the Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI Education</span>
                    </h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        We're on a mission to democratize AI education. Join us and help millions learn the skills of tomorrow.
                    </p>
                </div>
            </section>

            {/* Perks */}
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-screen-2xl">
                    <h2 className="text-3xl font-bold text-center text-white mb-12">Why Work With Us</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {perks.map((perk, idx) => (
                            <Card key={idx} className="bg-white/[0.04] border-white/[0.08] text-center">
                                <CardContent className="p-6 space-y-3">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mx-auto">
                                        <perk.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{perk.title}</h3>
                                    <p className="text-white/50 text-sm">{perk.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section className="py-16 bg-[var(--page-surface)]">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-3xl font-bold text-center text-white mb-12">Open Positions</h2>
                    <div className="space-y-4">
                        {openPositions.map((job, idx) => (
                            <Card key={idx} className="bg-white/[0.03] border-white/[0.08] hover:shadow-lg transition-all cursor-pointer">
                                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">{job.title}</h3>
                                        <div className="flex flex-wrap gap-3 text-sm text-white/40">
                                            <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.department}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {job.type}</span>
                                        </div>
                                    </div>
                                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shrink-0">
                                        Apply <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <p className="text-center text-white/40 mt-8">Don't see a fit? Email us at <a href="mailto:admin@ai-bytes.org" className="text-[#00FFB3] hover:underline">admin@ai-bytes.org</a></p>
                </div>
            </section>

            <Footer />
        </div>
    );
}

