"use client";

export const dynamic = 'force-dynamic';

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, BarChart3, Shield, Zap, Award, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export default function EnterprisePage() {
    const features = [
        { icon: Users, title: "Team Management", description: "Centralized dashboard to manage team access, progress, and certifications." },
        { icon: BarChart3, title: "Advanced Analytics", description: "Comprehensive reporting on team performance and learning outcomes." },
        { icon: Shield, title: "Enterprise Security", description: "SSO, SAML integration, and enterprise-grade data protection." },
        { icon: Zap, title: "Custom Content", description: "Tailored AI courses specific to your industry and use cases." },
        { icon: Award, title: "Bulk Certifications", description: "Generate and manage certificates for your entire organization." },
        { icon: Building2, title: "Dedicated Support", description: "Priority support with a dedicated account manager." },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
            <Header />

            {/* Hero */}
            <section className="relative mx-auto w-[95%] max-w-screen-2xl my-4 rounded-3xl border border-white/5 shadow-2xl py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]"></div>
                <div className="container relative z-10 mx-auto px-4 max-w-screen-2xl">
                    <div className="max-w-3xl">
                        <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            ENTERPRISE SOLUTIONS
                        </Badge>
                        <h1 className="text-4xl lg:text-5xl font-black text-white mb-6">
                            AI Training for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Your Organization</span>
                        </h1>
                        <p className="text-lg text-slate-300 mb-8">
                            Empower your entire team with comprehensive AI education. Custom learning paths, advanced analytics, and enterprise-grade security.
                        </p>
                        <Link href="/contact">
                            <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-full font-bold">
                                Contact Sales <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-screen-2xl">
                    <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">Enterprise Features</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
                            <Card key={idx} className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50">
                                <CardContent className="p-6 space-y-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                                    <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 mx-auto w-[95%] max-w-screen-2xl rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-600 mb-8">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your team?</h2>
                    <p className="text-white/80 mb-8 max-w-2xl mx-auto">Starting at £50/user/month for organizations with 10+ users.</p>
                    <Link href="/contact">
                        <Button size="lg" className="bg-white text-cyan-600 hover:bg-slate-100 rounded-full font-bold h-14 px-8">
                            Get a Demo <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}

