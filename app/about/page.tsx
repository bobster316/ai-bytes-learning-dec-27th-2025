"use client";

import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, Lightbulb, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden py-20 bg-slate-900 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>
        <div className="container relative z-10 mx-auto px-4 max-w-7xl">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-primary/20 text-cyan-300 font-medium text-lg tracking-wide uppercase">
              ABOUT US
            </span>
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight leading-tight">
              Making AI Education <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">Accessible</span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              AI Bytes Learning is dedicated to demystifying artificial intelligence and making it accessible to learners of all backgrounds.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">Our Mission</h2>
                <p className="text-xl text-foreground/80 leading-relaxed">
                  We believe that understanding AI is no longer optional—it's essential. Our mission is to empower individuals with the knowledge and skills they need to thrive in an AI-driven world. Through our carefully crafted courses, we make learning AI straightforward, engaging, and practical.
                </p>
              </div>
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">Our Vision</h2>
                <p className="text-xl text-foreground/80 leading-relaxed">
                  We envision a future where AI literacy is universal, enabling people from all walks of life to harness the power of artificial intelligence. By breaking down barriers to AI education, we're building a more informed and capable global community.
                </p>
              </div>
            </div>

            {/* Values Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card border-border shadow-sm hover:border-primary/50 transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Focused Learning</h3>
                  <p className="text-lg text-foreground/70">
                    Bite-sized lessons designed for maximum retention.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm hover:border-primary/50 transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Community First</h3>
                  <p className="text-lg text-foreground/70">
                    Learn alongside thousands of students in a supportive environment.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm hover:border-primary/50 transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Lightbulb className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Innovation</h3>
                  <p className="text-lg text-foreground/70">
                    Cutting-edge content that keeps pace with AI.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm hover:border-primary/50 transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Excellence</h3>
                  <p className="text-lg text-foreground/70">
                    High-quality courses developed by AI experts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-8 text-center">Our Story</h2>
            <div className="space-y-6 text-xl text-foreground/80 leading-relaxed">
              <p>
                AI Bytes Learning was founded with a simple observation: while AI was rapidly transforming every industry, quality education about artificial intelligence remained inaccessible to most people. Courses were either too technical for beginners or too simplified for serious learners.
              </p>
              <p>
                We set out to change that by creating a learning platform that strikes the perfect balance—comprehensive enough to build real understanding, yet approachable enough for anyone to start their AI journey. Our "bytes" approach breaks down complex topics into digestible pieces that can be learned in 60 minutes.
              </p>
              <p>
                Today, we're proud to serve thousands of learners worldwide, from students and professionals to business leaders and curious minds. Our community spans diverse backgrounds and industries, united by a common goal: to understand and leverage the power of AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-5xl lg:text-6xl font-bold text-primary mb-2">50+</p>
              <p className="text-xl text-foreground/70 font-medium">Courses</p>
            </div>
            <div className="text-center">
              <p className="text-5xl lg:text-6xl font-bold text-primary mb-2">10K+</p>
              <p className="text-xl text-foreground/70 font-medium">Students</p>
            </div>
            <div className="text-center">
              <p className="text-5xl lg:text-6xl font-bold text-primary mb-2">95%</p>
              <p className="text-xl text-foreground/70 font-medium">Satisfaction</p>
            </div>
            <div className="text-center">
              <p className="text-5xl lg:text-6xl font-bold text-primary mb-2">24/7</p>
              <p className="text-xl text-foreground/70 font-medium">Support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
