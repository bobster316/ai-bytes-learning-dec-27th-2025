import { Footer } from "@/components/footer";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlipWords } from "@/components/ui/flip-words";
import { MathBackground } from "@/components/ui/math-background";
import { VoiceAvatar } from "@/components/voice/voice-avatar";
import {
  Sparkles,
  PlayCircle,
  ArrowRight,
  Zap,
  BookOpen,
  Award,
  Brain,
  MessageSquare,
  Database,
  Code,
  Compass,
  Target,
  Rocket,
  CheckCircle2,
  Users,
  TrendingUp,
  Clock,
  BarChart3,
  Shield,
  Briefcase,
  Bot,
  Eye,
  Building2,
  Lightbulb,
  Wand2,
  MessageCircle
} from "lucide-react";
import { Header } from "@/components/header";
import { TrendingNews } from "@/components/trending-news";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { NeuralNetworkAnimation } from "@/components/ui/neural-network-animation";
import { AICompaniesGrid } from "@/components/ui/ai-companies-grid";

export default function Home() {
  const words = [
    "The Future", "ML Systems", "Statistical Learning", "AI Optimization", "Neural Architectures", "Scaled Deep Learning", "Probabilistic AI", "Causal Inference", "Causal AI", "Continual Learning", "Lifelong Learning",
    "AI Benchmarking", "Supervised Learning", "Unsupervised ML", "Semi-Supervised ML", "Self-Supervised ML", "Reinforcement Learn.", "Offline RL", "Multi-Agent RL", "Meta-Learning", "Few-Shot Learning", "Zero-Shot Learning", "Transfer Learning", "Curriculum Learning", "Active Learning",
    "Foundation Models", "Large Lang Models", "Multimodal Models", "Multimodal AI", "Generative AI", "Diffusion Models", "Autoregressive Mods", "World Models", "Video Models", "Audio Models", "Agentic Models", "Transformers", "Mixture of Experts", "State Space Models", "Graph Neural Nets", "CNNs", "RNNs", "Energy-Based Models", "GANs", "Neuro-Symbolic AI",
    "AI Agents", "Autonomous Agents", "Tool-Using Agents", "Multi-Agent Systems", "Agent Orchestration", "Planning Agents", "Reasoning Agents", "Memory Agents", "Reflective Agents", "Swarm Intelligence", "Simulated Societies", "HITL Systems",
    "Reasoning Models", "Chain-of-Thought", "Tree-of-Thought", "Program-of-Thought", "Planning and Search", "Model Alignment", "Constitutional AI", "Interpretability", "Explainable AI", "Model Evaluation",
    "AI Data Engineering", "Synthetic Data", "Data Curation", "Knowledge Graphs", "Retrieval-Augmented", "Advanced RAG", "Multimodal RAG", "Embeddings", "Vector Databases", "Long-Context AI",
    "AI Engineering", "MLOps", "LLMOps", "Model Deployment", "Model Serving", "Inference Optimize", "Model Distillation", "Model Compression", "Quantization", "Fine-Tuning", "LoRA", "QLoRA", "Adapters", "Evaluation Pipeline", "Model Monitoring", "Drift Detection", "Cost-Aware AI",
    "Computer Vision", "Vision-Lang Models", "Video Generation", "3D Generation", "World Simulation", "Speech Recognition", "Text-to-Speech", "Voice Cloning", "Music Generation", "Comp. Creativity", "Conversational AI",
    "Coding AI", "Software Eng AI", "Robotics", "Embodied AI", "Automation", "RPA", "Autonomous Vehicles", "Healthcare AI", "BioAI", "Drug Discovery AI", "Finance AI", "Trading AI", "Marketing AI", "Personalization AI", "Education AI", "Legal AI", "Compliance AI", "Cybersecurity AI",
    "Smart Cities", "Smart Infra", "Digital Twins", "Simulation Systems", "Spatial Computing", "XR AI", "Edge AI", "On-Device AI", "IoT AI", "Neuromorphic Comp", "AI Accelerators", "Distributed AI", "Cloud-Native AI", "Eco-Friendly AI", "Real-Time AI",
    "AI Safety", "AI Alignment", "Responsible AI", "Bias Detection", "Bias Mitigation", "Data Privacy", "AI Security", "AI Governance", "AI Regulation", "Risk Management", "Secure AI Systems", "Deepfake Detection", "Identity Verify",
    "AGI", "Superintelligence", "Emergent Intel", "Collective Intel", "Self-Improving AI", "AI for Science", "Quantum ML", "Hybrid Intelligence",
    "GPT-5.2", "Claude 4.5", "Gemini 3 Pro", "Llama 3", "Mistral Large", "Falcon", "Midjourney", "Stable Diffusion", "DALL-E 3", "Sora", "Runway Gen-3", "Pika"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      <Header />

      {/* HERO SECTION - RESTRUCTURED */}
      <section className="relative mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-white/5 shadow-2xl py-8 lg:py-0 min-h-[clamp(30rem,60vh,50rem)] flex items-center overflow-hidden bg-slate-900">

        <MathBackground />

        <div className="container relative z-20 mx-auto px-4 max-w-7xl h-full">
          <div className="grid lg:grid-cols-2 gap-8 items-center h-full">

            {/* Left Content */}
            <div className="space-y-6 text-left animate-fade-in relative z-20 pt-8 lg:pt-0 pb-12 lg:pb-0">



              <h1 className="font-black tracking-tight leading-[1.1] text-white text-[clamp(2.25rem,4.5vw,4.5rem)]">
                Learn <br />
                <span className="block min-h-[1.2em] w-full text-cyan-400">
                  <FlipWords words={words} className="text-cyan-400 drop-shadow-md whitespace-nowrap" />
                </span>
                <span className="block mt-2 text-white opacity-90 text-[clamp(1.8rem,3.6vw,3.15rem)]">in 60 Minutes</span>
              </h1>

              <p className="font-light text-neutral-400 tracking-wide font-mono mt-4 max-w-lg text-[clamp(1rem,1.5vw,1.5rem)]">
                complex technology, decoded<span className="animate-pulse text-primary font-bold">_</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link href="/courses">
                  <Button size="lg" className="w-full sm:w-auto h-[clamp(3rem,4vw,4.5rem)] px-[clamp(1.5rem,2vw,2.5rem)] text-[clamp(1rem,1.2vw,1.25rem)] rounded-full bg-white text-slate-900 hover:bg-slate-200 shadow-xl transition-all hover:scale-105 font-bold">
                    Start Learning
                    <ArrowRight className="ml-2 w-[clamp(1rem,1.2vw,1.5rem)] h-[clamp(1rem,1.2vw,1.5rem)]" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="ghost" className="w-full sm:w-auto h-[clamp(3rem,4vw,4.5rem)] px-[clamp(1.5rem,2vw,2.5rem)] text-[clamp(1rem,1.2vw,1.25rem)] rounded-full text-white hover:bg-white/10 gap-2 border border-white/20 hover:border-white/40">
                    <PlayCircle className="w-[clamp(1.2rem,1.5vw,1.5rem)] h-[clamp(1.2rem,1.5vw,1.5rem)]" />
                    How it works
                  </Button>
                </Link>
              </div>

              {/* Social Proof Mini */}
              <div className="pt-6 flex items-center gap-3 text-sm lg:text-base font-medium text-slate-500 dark:text-slate-400">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700" />
                  ))}
                </div>
                <div>Joined by 12,000+ Learners</div>
              </div>

            </div>

            {/* Right Content - The Avatar */}
            <div className="relative h-full flex items-end justify-center lg:justify-end animate-fade-in animate-delay-200 lg:mt-0">
              <div className="relative w-full max-w-[38rem] h-[clamp(25rem,60vh,45rem)]">
                {/* Back Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial-gradient from-primary/20 to-transparent blur-3xl pointer-events-none" />

                <VoiceAvatar
                  className="w-full h-full object-contain object-bottom mx-auto"
                  src="/ai_avatar/ai_avatar_no_back_ground.mp4"
                  transparent={false}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Three-Phase Approach */}
      <section className="mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl py-20 lg:py-32 bg-slate-50 dark:bg-[#0B101E] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl opacity-20 dark:opacity-10"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20 dark:opacity-10"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary font-semibold text-xs tracking-wider uppercase mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Learning Approach</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
              Your Journey to <span className="text-primary">AI Success</span>
            </h2>
            <p className="text-[clamp(1rem,1.4vw,1.35rem)] text-slate-900 dark:text-slate-100 max-w-2xl mx-auto font-medium">
              A structured, proven methodology designed to take you from beginner to expert
            </p>
          </div>

          {/* Three Phase Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-6xl mx-auto">
            {[
              {
                phase: "01",
                icon: Target,
                title: "Selection",
                description: "Browse curated content with AI-powered course selection to match your goals and skill level.",
                color: "from-primary to-cyan-500",
                bgColor: "bg-cyan-50 dark:bg-primary/10",
                iconColor: "text-primary",
                image: "/mastery/Phase 1.png"
              },
              {
                phase: "02",
                icon: Rocket,
                title: "Execution",
                description: "Engage with world-class lessons, practical exercises, and AI tutoring for optimal learning outcomes.",
                color: "from-cyan-500 to-emerald-500",
                bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
                iconColor: "text-emerald-600",
                image: "/mastery/Phase 2.png"
              },
              {
                phase: "03",
                icon: Award,
                title: "Validation",
                description: "Complete assessments and earn verified certificates to showcase your expertise to employers worldwide.",
                color: "from-primary to-blue-500",
                bgColor: "bg-blue-50 dark:bg-blue-900/20",
                iconColor: "text-blue-600",
                image: "/mastery/Phase 3.png"
              },
            ].map((item, index) => {
              const phaseLinks = ['selection', 'execution', 'validation'];
              return (
                <Link href={`/phases/${phaseLinks[index]}`} key={index}>
                  <div className="group relative h-full">
                    {/* Connecting line (hidden on mobile) */}
                    {index < 2 && (
                      <div className="hidden md:block absolute top-14 left-full w-8 h-0.5 bg-gradient-to-r from-slate-200 to-slate-200/50 dark:from-slate-700 dark:to-slate-700/50 z-0">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      </div>
                    )}

                    <Card className="relative h-full bg-white dark:bg-slate-800 border-none shadow-lg hover:shadow-2xl hover:ring-2 hover:ring-primary/50 transition-all duration-300 group-hover:-translate-y-2 overflow-hidden cursor-pointer">
                      {/* Image Header */}
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Gradient overlay */}


                        {/* Phase number badge */}
                        <div className="absolute top-4 left-4 z-10">
                          <div className="inline-block px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white font-bold text-base shadow-lg border border-white/30">
                            PHASE {item.phase}
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-6 space-y-5">
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-2xl ${item.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <h3 className="text-[14pt] font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-slate-900 dark:text-slate-100 leading-relaxed font-medium text-[12pt]">
                            {item.description}
                          </p>
                        </div>

                        {/* Decorative element */}
                        <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${item.color} group-hover:w-full transition-all duration-500`}></div>
                      </CardContent>
                    </Card>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Stats Section - Enhanced with Image */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-w-5xl mx-auto">
            {/* Image Header */}
            <div className="relative h-64 overflow-hidden">
              <Image
                src="/mastery/Phase 1.png"
                alt="Trusted by Thousands Worldwide"
                fill
                className="object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/60 to-cyan-500/60"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-800 via-white/50 dark:via-slate-800/50 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="p-8 lg:p-12 -mt-16 relative z-10">
              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Trusted by Thousands Worldwide
                </h3>
                <p className="text-base text-slate-600 dark:text-slate-400">
                  Join a growing community of AI enthusiasts and professionals
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: "500+", label: "Completed", icon: CheckCircle2, color: "bg-green-500" },
                  { value: "150+", label: "Courses", icon: BookOpen, color: "bg-blue-500" },
                  { value: "5000+", label: "Students", icon: Users, color: "bg-indigo-500" },
                  { value: "99.5%", label: "Uptime", icon: TrendingUp, color: "bg-cyan-500" },
                ].map((stat, index) => (
                  <div key={index} className="text-center group">
                    <div className={`w-16 h-16 ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-[clamp(1.5rem,2vw,2.5rem)] font-bold text-slate-900 dark:text-white mb-2">
                      {stat.value}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Performance Section */}
      <section className="mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl py-20 lg:py-32 bg-white dark:bg-[#020617] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl opacity-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl opacity-10"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/10 rounded-full border border-primary/20">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm text-primary font-semibold uppercase tracking-wider">
                Features
              </span>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-cyan-500">Performance</span>
              </h2>
              <p className="text-base lg:text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Enterprise-grade learning infrastructure designed for modern professionals seeking excellence
              </p>
            </div>
          </div>


          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                image: "/icons/structured_learning.png",
                title: "Structured Learning",
                description: "Bite-sized lessons with clear progression paths for maximum retention",
                gradient: "from-primary to-cyan-500",
                bgGradient: "from-cyan-50 to-blue-50",
                link: "/features/structured-learning",
              },
              {
                image: "/icons/time_optimised.png",
                title: "Time-Optimised",
                description: "60-minute courses designed for busy professionals who value their time",
                gradient: "from-[#06b6d4] to-primary",
                bgGradient: "from-cyan-50 to-teal-50",
                link: "/features/time-optimised",
              },
              {
                image: "/icons/ai_powered.png",
                title: "AI-Powered",
                description: "Intelligent study companion and adaptive learning recommendations",
                gradient: "from-emerald-500 to-primary",
                bgGradient: "from-emerald-50 to-teal-50",
                link: "/features/ai-powered",
              },
              {
                image: "/icons/analytics.png",
                title: "Progress Analytics",
                description: "Track your learning journey with detailed completion and performance insights",
                gradient: "from-primary to-[#0e7490]",
                bgGradient: "from-teal-50 to-cyan-50",
                link: "/features/progress-analytics",
              },
              {
                image: "/icons/certification.png",
                title: "Verified Certification",
                description: "Industry-recognised certificates with blockchain verification and LinkedIn integration",
                gradient: "from-primary to-emerald-500",
                bgGradient: "from-teal-50 to-emerald-50",
                link: "/features/verified-certification",
              },
              {
                image: "/icons/enterprise.png",
                title: "Enterprise Ready",
                description: "Team management with bulk certificate generation and comprehensive admin dashboards",
                gradient: "from-cyan-500 to-teal-500",
                bgGradient: "from-cyan-50 to-teal-50",
                link: "/features/enterprise-ready",
              },
            ].map((feature, index) => (
              <Link href={feature.link} key={index} className="block group h-full">
                <Card
                  className="group relative bg-white dark:bg-slate-800 border-none shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden h-full"
                >
                  {/* Gradient border on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`}></div>
                  <div className="absolute inset-[2px] bg-white dark:bg-slate-800 rounded-lg -z-5"></div>

                  {/* Background gradient */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.bgGradient} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                  <CardContent className="relative p-8 space-y-5">
                    {/* Icon/Thumbnail Image */}
                    <div className="relative mx-auto w-40">
                      <div className={`w-40 h-40 rounded-2xl bg-gradient-to-r ${feature.gradient} p-[2px] shadow-lg group-hover:scale-105 group-hover:rotate-1 transition-all duration-500`}>
                        <div className="w-full h-full bg-slate-900 rounded-2xl overflow-hidden relative">
                          <Image
                            src={feature.image}
                            alt={feature.title}
                            fill
                            className="object-cover"
                            sizes="256px"
                            unoptimized
                          />
                        </div>
                      </div>
                      {/* Glow effect */}
                      <div className={`absolute inset-0 w-40 h-40 rounded-2xl bg-gradient-to-r ${feature.gradient} blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 -z-10`}></div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3 text-center">
                      <h3 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-slate-900 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-slate-300 transition-all duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm lg:text-base">
                        {feature.description}
                      </p>
                    </div>

                    {/* Decorative element */}
                    <div className="flex items-center gap-2 pt-2">
                      <div className={`h-1 rounded-full bg-gradient-to-r ${feature.gradient} w-8 group-hover:w-full transition-all duration-700`}></div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-full transition-all duration-1000"></div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 
        NEURAL NETWORK ANIMATION SECTION
        "Visualizing Intelligence"
      */}
      <section className="mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl py-12 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <Badge variant="outline" className="mb-4 border-primary/50 text-cyan-400">
              <Sparkles className="w-3 h-3 mr-1" />
              INTERACTIVE SIMULATION
            </Badge>
            <h2 className="text-2xl lg:text-4xl font-bold mb-4">
              Watch AI <span className="text-cyan-400">Think</span>
            </h2>
            <p className="text-base lg:text-lg text-slate-400">
              Visualize the inner workings of a neural network. Watch how data flows through layers of artificial neurons to make predictions in real-time.
            </p>
          </div>

          <div className="flex justify-center">
            <NeuralNetworkAnimation />
          </div>
        </div>
      </section>

      {/* 
        TRUST SECTION
        Minimal Logos 
      */}
      <section className="mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl py-16 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <p className="text-center text-lg font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-10">
            Master the tools from industry leaders
          </p>

          <div className="max-w-7xl mx-auto">
            <AICompaniesGrid />
          </div>


        </div>
      </section>

      {/* 
        TOP CATEGORIES SECTION 
        Re-integrated from previous design, updated with new theme 
      */}
      <section className="mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl py-12 lg:py-16 bg-slate-50 dark:bg-[#020617]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-10">
            <div className="space-y-3 max-w-2xl mx-auto">
              <Badge variant="secondary" className="mb-2 bg-blue-100 text-primary dark:bg-primary/20 dark:text-cyan-200 border-none text-xs px-2.5 py-0.5">
                <BookOpen className="w-3.5 h-3.5 mr-1" />
                EXPLORE PATHS
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                Course <span className="text-gradient">Categories</span>
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-400">
                Explore our comprehensive range of AI learning paths - from foundations to advanced applications.
              </p>
            </div>
          </div>
          <div className="text-center mb-6">
            <Link href="/courses">
              <Button variant="outline" size="sm" className="rounded-full px-6 h-10 text-base border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary">
                View All Categories <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[
              {
                icon: Brain,
                label: "AI Foundations & Fundamentals",
                desc: "The essential starting point - AI concepts, terminology, and real-world applications.",
                color: "text-primary",
                bg: "bg-cyan-50 dark:bg-primary/20",
                image: "/categories/AI Foundations & Fundamentals.png"
              },
              {
                icon: Wand2,
                label: "Generative AI & LLMs",
                desc: "Master ChatGPT, Claude, Gemini and text, image, video generation.",
                color: "text-purple-600",
                bg: "bg-purple-50 dark:bg-purple-900/20",
                image: "/categories/Generative AI & Large Language Models (LLMs).png"
              },
              {
                icon: MessageSquare,
                label: "Prompt Engineering",
                desc: "Write effective prompts and master AI communication techniques.",
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-900/20",
                image: "/categories/Prompt Engineering & AI Communication.png"
              },
              {
                icon: Code,
                label: "AI Tools & Applications",
                desc: "Hands-on with ChatGPT, Midjourney, and AI productivity platforms.",
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-900/20",
                image: "/categories/AI Tools & Practical Applications.png"
              },
              {
                icon: Briefcase,
                label: "AI for Business & Strategy",
                desc: "AI transformation, ROI, implementation roadmaps for leaders.",
                color: "text-orange-600",
                bg: "bg-orange-50 dark:bg-orange-900/20",
                image: "/categories/AI for Business & Strategy.png"
              },
              {
                icon: Shield,
                label: "AI Ethics & Governance",
                desc: "Responsible AI, bias, privacy, regulation, and compliance.",
                color: "text-red-600",
                bg: "bg-red-50 dark:bg-red-900/20",
                image: "/categories/AI Ethics, Governance & Responsible AI.png"
              },
              {
                icon: Bot,
                label: "AI Agents & Automation",
                desc: "Agentic AI systems, RAG, and multi-agent workflow automation.",
                color: "text-indigo-600",
                bg: "bg-indigo-50 dark:bg-indigo-900/20",
                image: "/categories/AI Agents & Automation.png"
              },
              {
                icon: MessageCircle,
                label: "NLP & Conversational AI",
                desc: "Text analysis, chatbots, sentiment analysis, and voice AI.",
                color: "text-teal-600",
                bg: "bg-teal-50 dark:bg-teal-900/20",
                image: "/categories/Natural Language Processing (NLP) & Conversational AI.png"
              },
              {
                icon: Eye,
                label: "Computer Vision & Image AI",
                desc: "Image recognition, object detection, and visual analysis.",
                color: "text-pink-600",
                bg: "bg-pink-50 dark:bg-pink-900/20",
                image: "/categories/Computer Vision & Image AI.png"
              },
              {
                icon: Building2,
                label: "AI in Industry Applications",
                desc: "Sector-specific AI: Healthcare, Finance, Marketing, Manufacturing.",
                color: "text-slate-600",
                bg: "bg-slate-50 dark:bg-slate-900/20",
                image: "/categories/AI in Industry Applications.png"
              },
              {
                icon: Database,
                label: "Data & AI Fundamentals",
                desc: "Data literacy, preparation, quality, and privacy for AI.",
                color: "text-cyan-600",
                bg: "bg-cyan-50 dark:bg-cyan-900/20",
                image: "/categories/Data & AI Fundamentals.png"
              },
              {
                icon: Lightbulb,
                label: "AI Product Development",
                desc: "Build AI applications, prototyping, testing, and project management.",
                color: "text-yellow-600",
                bg: "bg-yellow-50 dark:bg-yellow-900/20",
                image: "/categories/Photorealistic image of a diverse product team collaborating around a large table covered with AI product prototypes, sketches, tablets showing no-code AI builders, and holographic product mockups floating above the su.png"
              }
            ].map((cat, idx) => (
              <div key={idx} className="group flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all cursor-pointer bg-white dark:bg-slate-900 relative overflow-hidden h-full">
                {/* Image Header */}
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                  {/* Floating Icon overlapping image */}
                  <div className={`absolute bottom-3 left-5 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md bg-white/90 dark:bg-slate-900/90 ${cat.color} shadow-lg shadow-black/10`}>
                    <cat.icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Text Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">{cat.label}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4 flex-1 text-sm">{cat.desc}</p>
                  <div className="flex items-center text-sm font-bold text-primary opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all mt-auto">
                    Explore Courses <ArrowRight className="ml-1 w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRENDING COURSES SECTION */}
      <section className="mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl py-12 lg:py-16 bg-white dark:bg-[#0B101E]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-10">
            <div className="space-y-3 max-w-2xl mx-auto">
              <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-cyan-200 border-none text-xs px-2.5 py-0.5">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                MOST POPULAR
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">
                Trending <span className="text-gradient">Courses</span>
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-400">
                Join thousands learning these highly-rated AI courses right now.
              </p>
            </div>
          </div>
          <div className="text-center mb-6">
            <Link href="/courses">
              <Button variant="outline" size="sm" className="rounded-full px-6 h-10 text-base border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary">
                View All Courses <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Mastering ChatGPT & Prompt Engineering",
                description: "Learn to write powerful prompts and unlock the full potential of ChatGPT, Claude, and other LLMs.",
                image: "/course_title_images/Mastering ChatGPT & Prompt Engineering.png",
                level: "Beginner",
                duration: "60 min",
                students: "12,540",
                rating: "4.9"
              },
              {
                title: "Generative AI for Business Leaders",
                description: "Strategic guide to implementing AI transformation and driving ROI in your organization.",
                image: "/course_title_images/Generative AI for Business Leaders.png",
                level: "Intermediate",
                duration: "75 min",
                students: "8,320",
                rating: "4.8"
              },
              {
                title: "Building AI Agents & Automation",
                description: "Create intelligent AI agents with RAG, function calling, and multi-agent orchestration.",
                image: "/course_title_images/Building AI Agents & Automation.png",
                level: "Advanced",
                duration: "90 min",
                students: "6,890",
                rating: "4.9"
              }
            ].map((course, idx) => (
              <Link href={`/courses/${idx + 1}`} key={idx} className="block group">
                <Card className="h-full bg-white dark:bg-slate-800 border-none shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  {/* Course Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary text-white">{course.level}</Badge>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {course.description}
                    </p>

                    {/* Course Meta */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {course.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {course.students}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-yellow-600">
                        ⭐ {course.rating}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TrendingNews />

      {/* CTA Section */}
      <section className="mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl py-12 lg:py-16 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

        {/* Floating shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px]" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge className="mb-4 bg-primary text-white border-primary/50 py-1 px-4 text-sm font-medium">Limited Time Offer</Badge>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            Ready to Future-Proof <br className="hidden md:block" /> Your Career?
          </h2>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Join thousands of learners of all ages mastering AI. Start your free trial today and get unlimited access to all courses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-blue-50 border-none font-bold h-12 px-8 text-base rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border border-white/30 text-white hover:bg-white/10 hover:border-white h-12 px-8 text-base rounded-full bg-transparent backdrop-blur-sm">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400 font-medium opacity-80">
            7 day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* FOOTER - Minimalist & Clean */}
      <Footer />
    </div>
  );
}
