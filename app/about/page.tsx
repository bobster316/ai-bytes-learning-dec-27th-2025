"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Users, Lightbulb, Award, Brain, Rocket, Globe, Zap, ArrowRight, CheckCircle2, BookOpen, GraduationCap, Heart, Gauge } from "lucide-react";
import { MomentumMetaphor } from "@/components/momentum-metaphor";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <Header />

      {/* Hero Section - Homepage Style */}
      <section className="relative mx-auto w-[95%] max-w-screen-2xl my-4 rounded-3xl border border-white/5 shadow-2xl py-16 flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-900 pointer-events-none rounded-3xl"></div>
        <div className="container relative z-10 mx-auto px-4 max-w-screen-2xl">
          <div className="text-center space-y-6">
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-primary/20 text-[#00FFB3] font-medium text-lg tracking-wide uppercase">
              ABOUT US
            </span>
            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Making AI Education <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">Accessible</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              AI Bytes Learning is a UK-based organisation dedicated to simplifying artificial intelligence and making it accessible to learners of all backgrounds.
            </p>
          </div>
        </div>
      </section>

      {/* Who We Are Section with Image */}
      <section className="py-20 bg-[var(--page-surface)]">
        <div className="container mx-auto px-4 max-w-screen-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-wide uppercase">
                WHO WE ARE
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                Pioneering the Future of AI Education
              </h2>
              <p className="text-lg text-white/65 leading-relaxed">
                At AI Bytes Learning, we&apos;re more than just an education platform—we&apos;re a movement dedicated to democratizing artificial intelligence knowledge. Founded by a team of AI researchers, educators, and industry experts, we understand both the technical depths and the real-world applications of AI.
              </p>
              <p className="text-lg text-white/65 leading-relaxed">
                Our unique &quot;bytes&quot; approach is a direct response to the rambling, time-consuming methods of traditional education. We break down complex AI concepts into focused, zero-fluff micro courses, allowing anyone to gain true understanding in the most time-efficient way possible.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 text-white/65">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>Expert-Led Courses</span>
                </div>
                <div className="flex items-center gap-2 text-white/65">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>Hands-On Projects</span>
                </div>
                <div className="flex items-center gap-2 text-white/65">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>Industry Certifications</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&q=90"
                alt="Team collaboration in modern tech office"
                className="rounded-2xl shadow-2xl w-full object-cover"
              />
              <div className="absolute -bottom-6 -right-6 bg-slate-900 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">10,000+</p>
                    <p className="text-sm text-slate-400">Active Learners</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-[var(--page-bg)]">
        <div className="container mx-auto px-4 max-w-screen-2xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-slate-900 rounded-3xl p-8 lg:p-10 border border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-[#00FFB3]/20 flex items-center justify-center mb-6">
                  <Rocket className="w-8 h-8 text-[#00FFB3]" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">Our Mission</h3>
                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  We believe that understanding AI is no longer optional—it&apos;s essential for thriving in the modern world. Our mission is to empower every individual with the knowledge and skills they need to use AI effectively.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-[#00FFB3] mt-0.5 flex-shrink-0" />
                    <span>Break down complex AI concepts into accessible learning modules</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-[#00FFB3] mt-0.5 flex-shrink-0" />
                    <span>Provide practical, hands-on experience with real AI tools</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-[#00FFB3] mt-0.5 flex-shrink-0" />
                    <span>Foster a supportive community of AI learners worldwide</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Vision */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-slate-900 rounded-3xl p-8 lg:p-10 border border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
                  <Globe className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">Our Vision</h3>
                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  We envision a future where AI literacy is universal—where people from all walks of life can confidently understand, evaluate, and use artificial intelligence in their work and daily lives.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Create a world where AI knowledge is not limited to experts</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Bridge the gap between cutting-edge research and practical application</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Build an informed global community prepared for the AI revolution</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Sets Us Apart Section with Image */}
      <section className="py-20 bg-[var(--page-surface)]">
        <div className="container mx-auto px-4 max-w-screen-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop&q=90"
                alt="Student learning with advanced technology"
                className="rounded-2xl shadow-2xl w-full object-cover"
              />
              <div className="absolute -top-6 -left-6 bg-primary rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">Micro</p>
                    <p className="text-sm text-white/80">Lessons</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-wide uppercase">
                WHAT SETS US APART
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                The &quot;Bytes&quot; Approach to Learning
              </h2>
              <p className="text-lg text-white/65 leading-relaxed">
                Traditional AI courses can be overwhelming—hundreds of hours of content, complex prerequisites, and abstract theory. We&apos;ve reimagined AI education with our unique &quot;bytes&quot; methodology.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--page-surface)] border border-[var(--page-border)]">
                  <div className="w-12 h-12 rounded-xl bg-[#00FFB3]/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-[#00FFB3]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Micro-Learning Modules</h4>
                    <p className="text-sm text-white/50">Each concept is broken down into digestible micro-sessions</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--page-surface)] border border-[var(--page-border)]">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">No Prerequisites</h4>
                    <p className="text-sm text-white/50">Start from zero and progress at your own pace</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--page-surface)] border border-[var(--page-border)]">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Practical Application</h4>
                    <p className="text-sm text-white/50">Every lesson includes hands-on exercises with real AI tools</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* New Momentum Section */}
          <div className="mt-20 border-t border-white/[0.08] pt-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="inline-block py-1 px-3 rounded-full bg-[#00FFB3]/10 text-[#00FFB3] font-medium text-sm tracking-wide uppercase">
                  OUR PHILOSOPHY
                </span>
                <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                  The Physics of Learning: Momentum
                </h2>
                <p className="text-lg text-white/65 leading-relaxed">
                  We don&apos;t just track your progress; we measure your intellectual momentum. We believe learning AI is like starting a high-performance engine. It requires a specific initial force, a transition into a flow state, and sustained consistency to reach peak velocity.
                </p>
                <p className="text-lg text-white/65 leading-relaxed italic">
                  &quot;In the world of AI, speed is good, but velocity is better. Speed is just how fast you move; velocity is speed with a clear direction.&quot; — Sterling
                </p>
              </div>
              <div className="max-w-md mx-auto lg:ml-auto w-full">
                <MomentumMetaphor />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20 bg-[var(--page-bg)]">
        <div className="container mx-auto px-4 max-w-screen-2xl">
          <div className="text-center mb-12">
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-wide uppercase mb-4">
              OUR VALUES
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              What Drives Us Every Day
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/[0.04] border-white/[0.08] shadow-sm hover:border-primary/50 hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Focused Learning</h3>
                <p className="text-sm text-white/50">
                  Byte-sized lessons designed for maximum retention and immediate application.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.04] border-white/[0.08] shadow-sm hover:border-primary/50 hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Community First</h3>
                <p className="text-sm text-white/50">
                  Learn alongside thousands of students in a supportive, collaborative environment.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.04] border-white/[0.08] shadow-sm hover:border-primary/50 hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Lightbulb className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Innovation</h3>
                <p className="text-sm text-white/50">
                  Cutting-edge content that keeps pace with the rapidly evolving AI landscape.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.04] border-white/[0.08] shadow-sm hover:border-primary/50 hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Excellence</h3>
                <p className="text-sm text-white/50">
                  High-quality courses developed by industry experts and AI researchers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story Section with Image */}
      <section className="py-20 bg-[var(--page-surface)]">
        <div className="container mx-auto px-4 max-w-screen-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-wide uppercase">
                OUR STORY
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                From a Simple Idea to a Global Movement
              </h2>
              <div className="space-y-4 text-lg text-white/65 leading-relaxed">
                <p>
                  AI Bytes Learning was founded with a simple observation: while AI was rapidly transforming every industry, quality education about artificial intelligence remained inaccessible to most people.
                </p>
                <p>
                  Courses were either too technical for beginners or too simplified for serious learners. We saw a gap—and we decided to fill it.
                </p>
                <p>
                  Our founders, a team of AI researchers from leading tech companies and universities, came together with a shared vision: to create an education platform that makes AI truly accessible without sacrificing depth or quality.
                </p>
                <p>
                  Today, we&apos;re proud to serve thousands of learners worldwide, from students and professionals to business leaders and curious minds. Our community spans diverse backgrounds and industries, united by a common goal: to understand and leverage the power of AI.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&q=90"
                alt="Innovation and teamwork in modern workspace"
                className="rounded-2xl shadow-2xl w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-4 max-w-screen-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Impact by the Numbers
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-4xl lg:text-5xl font-bold text-[#00FFB3] mb-2">50+</p>
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">AI Courses</p>
            </div>
            <div className="text-center">
              <p className="text-4xl lg:text-5xl font-bold text-[#00FFB3] mb-2">10K+</p>
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Students</p>
            </div>
            <div className="text-center">
              <p className="text-4xl lg:text-5xl font-bold text-[#00FFB3] mb-2">95%</p>
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Satisfaction</p>
            </div>
            <div className="text-center">
              <p className="text-4xl lg:text-5xl font-bold text-[#00FFB3] mb-2">150+</p>
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Countries</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--page-bg)]">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Start Your AI Journey?
          </h2>
          <p className="text-lg text-white/65 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already growing with AI through our byte-sized, practical courses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:brightness-110 text-[#030305] font-black">
                Explore Courses <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

