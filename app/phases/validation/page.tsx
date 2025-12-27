import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Award, Shield, Trophy, Globe, Linkedin, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ValidationPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            {/* Hero Section */}
            <section className="relative mx-auto w-[95%] max-w-7xl my-8 rounded-3xl border border-white/5 shadow-2xl py-20 lg:py-32 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-slate-900"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center max-w-4xl mx-auto space-y-6">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm px-4 py-1.5">
                            PHASE 03
                        </Badge>
                        <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight">
                            Certification & <span className="text-blue-400">Validation</span>
                        </h1>
                        <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
                            Complete assessments and earn verified certificates to showcase your expertise to employers worldwide.
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
                            src="/mastery/Phase 3.png"
                            alt="Certification and Validation"
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Description */}
                    <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto space-y-8">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Prove Your Skills, Advance Your Career
                        </h2>

                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            Learning is one thing—proving you've mastered it is another. Our comprehensive validation system ensures your
                            achievements are recognized by employers and peers globally. Earn certificates that actually matter.
                        </p>

                        {/* Certificate Features */}
                        <div className="grid md:grid-cols-2 gap-6 my-12">
                            {[
                                {
                                    icon: Award,
                                    title: "Industry-Recognized Certificates",
                                    description: "Our certificates are valued by top tech companies and recruiters worldwide."
                                },
                                {
                                    icon: Shield,
                                    title: "Blockchain Verified",
                                    description: "Each certificate is cryptographically secured on the blockchain for authenticity."
                                },
                                {
                                    icon: Linkedin,
                                    title: "LinkedIn Integration",
                                    description: "Instantly add your achievements to your LinkedIn profile with one click."
                                },
                                {
                                    icon: Globe,
                                    title: "Public Portfolio",
                                    description: "Get a shareable link to showcase your certificates to employers and clients."
                                }
                            ].map((feature, idx) => (
                                <Card key={idx} className="border-slate-200 dark:border-slate-700 hover:border-blue-500/50 transition-all">
                                    <CardContent className="p-6 space-y-3">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                            <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                            Assessment Process
                        </h3>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">Knowledge Check</h4>
                                    <p className="text-slate-600 dark:text-slate-400">Complete a comprehensive exam covering all course topics with scenario-based questions.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">Practical Project</h4>
                                    <p className="text-slate-600 dark:text-slate-400">Build and submit a capstone project demonstrating real-world application of skills.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">Peer Review (Optional)</h4>
                                    <p className="text-slate-600 dark:text-slate-400">Get feedback from other students and industry professionals on your work.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">4</div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">Receive Certificate</h4>
                                    <p className="text-slate-600 dark:text-slate-400">Upon passing, instantly receive your verified digital certificate.</p>
                                </div>
                            </div>
                        </div>

                        {/* Certificate Preview */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-2xl p-8 my-12">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
                                Your Certificate Includes
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4 text-slate-700 dark:text-slate-300">
                                {[
                                    "Your full name and achievement date",
                                    "Course title and skill level completed",
                                    "Unique certificate ID for verification",
                                    "AI Bytes Learning official seal",
                                    "Blockchain verification hash",
                                    "Instructor signatures (where applicable)",
                                    "Skills and competencies demonstrated",
                                    "QR code for instant verification"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-12">
                            Why Our Certificates Stand Out
                        </h3>

                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            We don't just hand out participation trophies. Our certificates represent genuine skill mastery, validated
                            through rigorous assessment. Employers trust our credentials because they know graduates have proven hands-on competence.
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border-l-4 border-blue-600">
                            <p className="text-slate-700 dark:text-slate-300 italic">
                                "Adding my AI Bytes Learning certificate to LinkedIn resulted in 3 recruiter messages within a week.
                                The blockchain verification gave employers immediate confidence in my skills."
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">— Sarah Chen, AI Product Manager</p>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center mt-16">
                        <Link href="/courses">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 text-lg rounded-full shadow-lg shadow-blue-600/20">
                                Start Earning Certificates <Trophy className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <div className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-center space-y-4">
                            <Link href="/phases/execution">
                                <Button variant="outline" size="lg" className="rounded-full">
                                    &larr; Phase 02: Execution
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
