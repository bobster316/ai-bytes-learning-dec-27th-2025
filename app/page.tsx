"use client";

import Link from "next/link";
import Image from "next/image";
import { NewsTicker } from "@/components/ui/news-ticker";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Play,
  Zap,
  Brain,
  Shield,
  MessageSquare,
  Database,
  Smartphone,
  TrendingUp,
  Bot,
  Building2,
  Layout,
  Image as ImageIcon,
  ChevronRight,
  Star,
  BookOpen,
  Award,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { VoiceAvatar } from "@/components/voice/voice-avatar";
import { AICompaniesGrid } from "@/components/ui/ai-companies-grid";
import { TrendingNews } from "@/components/trending-news";
import { WordSwitcher } from "@/components/ui/word-switcher";
import { NeuralNetworkAnimation } from "@/components/ui/neural-network-animation";
import { Logo } from "@/components/logo";

// ── Hero word switcher words ────────────────────────────────────────────────
const HERO_WORDS = [
  "15-Min Bytes.", 
  "Daily Habits.", 
  "Real Skills.", 
  "Plain English.", 
  "Clear Ideas.", 
  "Quick Wins.", 
  "AHA Moments.", 
  "Less Fluff.", 
  "Core Concepts.",
  "Small Steps.",
  "Pure Logic.",
  "Smart Moves.",
  "Your Terms.",
  "Fast Facts.",
  "Easy Wins."
];

// ── Animated counter hook ──────────────────────────────────────────────────
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return { count, ref };
}

// ── Category data ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "ai-foundations",     label: "AI Foundations",          icon: Brain,         colour: "#4b98ad", wide: true  },
  { id: "generative-ai",      label: "Generative AI & LLMs",    icon: Sparkles,      colour: "#4b98ad", wide: false },
  { id: "prompt-engineering", label: "Prompt Engineering",      icon: MessageSquare, colour: "#FFB347", wide: false },
  { id: "ai-tools",           label: "AI Tools & Apps",         icon: Smartphone,    colour: "#4b98ad", wide: false },
  { id: "business-ai",        label: "AI for Business",         icon: TrendingUp,    colour: "#4b98ad", wide: false },
  { id: "ai-agents",          label: "AI Agents & Automation",  icon: Bot,           colour: "#4b98ad", wide: true  },
  { id: "nlp",                label: "NLP & Conversational AI", icon: MessageSquare, colour: "#4b98ad", wide: false },
  { id: "computer-vision",    label: "Computer Vision",         icon: ImageIcon,     colour: "#FFB347", wide: false },
  { id: "industry-ai",        label: "AI in Industry",          icon: Building2,     colour: "#4b98ad", wide: false },
  { id: "data-ai",            label: "Data & AI Fundamentals",  icon: Database,      colour: "#4b98ad", wide: false },
  { id: "ai-ethics",          label: "AI Ethics & Governance",  icon: Shield,        colour: "#FF6B6B", wide: true  },
  { id: "ai-product",         label: "AI Product Dev",          icon: Layout,        colour: "#FFB347", wide: true  },
];

// ── Marquee course names ────────────────────────────────────────────────────
const MARQUEE_ROW_1 = [
  { label: "ChatGPT Mastery",         colour: "#4b98ad" },
  { label: "Neural Networks",         colour: "#4b98ad" },
  { label: "Prompt Engineering",      colour: "#FFB347" },
  { label: "AI for Marketing",        colour: "#4b98ad" },
  { label: "LangChain Fundamentals",  colour: "#4b98ad" },
  { label: "Computer Vision",         colour: "#FF6B6B" },
  { label: "AI Product Strategy",     colour: "#FFB347" },
  { label: "Fine-tuning LLMs",        colour: "#4b98ad" },
  { label: "Generative AI",           colour: "#4b98ad" },
  { label: "AI in Healthcare",        colour: "#FFB347" },
  { label: "Autonomous Agents",       colour: "#4b98ad" },
  { label: "RAG Systems",             colour: "#FF6B6B" },
];

const MARQUEE_ROW_2 = [
  { label: "AI Ethics & Governance",  colour: "#FF6B6B" },
  { label: "Midjourney Mastery",      colour: "#4b98ad" },
  { label: "AI for Finance",          colour: "#FFB347" },
  { label: "Embeddings & Vectors",    colour: "#4b98ad" },
  { label: "Stable Diffusion",        colour: "#4b98ad" },
  { label: "NLP Fundamentals",        colour: "#FFB347" },
  { label: "AI Sales Automation",     colour: "#4b98ad" },
  { label: "Gemini for Business",     colour: "#4b98ad" },
  { label: "AI in Education",         colour: "#FF6B6B" },
  { label: "Multimodal AI",           colour: "#FFB347" },
  { label: "AI Workflow Design",      colour: "#4b98ad" },
  { label: "Data Science Basics",     colour: "#4b98ad" },
];

// ── Testimonials ───────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "Marketing Manager · London",
    quote:
      "I went from knowing nothing about AI to confidently using it in my campaigns — in a weekend. The 15-minute format is the only reason I actually finished a course.",
    stars: 5,
    rotation: "-1.2deg",
  },
  {
    name: "James T.",
    role: "Operations Lead · Manchester",
    quote:
      "Every other AI course I tried was either too shallow or too technical. AI Bytes hits the exact right level. I've completed 4 courses in a month.",
    stars: 5,
    rotation: "0.5deg",
  },
  {
    name: "Aisha K.",
    role: "Founder · Birmingham",
    quote:
      "The micro-lesson format is genius. I learn during my commute and actually retain it. The certificates have been great conversation starters too.",
    stars: 5,
    rotation: "1.8deg",
  },
];

// ── Pricing tiers ──────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    description: "Start learning immediately. No card needed.",
    features: [
      "Access to free courses",
      "Progress tracking",
      "Course certificates",
      "Mobile access",
    ],
    cta: "Start Free",
    href: "/auth/signup",
    highlight: false,
    accentColour: "#4b98ad",
  },
  {
    name: "Standard",
    price: "£15",
    period: "/month",
    description: "Unlimited access for committed learners.",
    features: [
      "All 50+ courses",
      "Unlimited certificates",
      "Priority support",
      "Offline access",
    ],
    cta: "Get Standard",
    href: "/pricing",
    highlight: true,
    accentColour: "#4b98ad",
  },
  {
    name: "Unlimited",
    price: "£35",
    period: "/month",
    description: "Everything, for serious professionals.",
    features: [
      "Everything in Standard",
      "AI tutor Sterling",
      "Team seats (up to 5)",
      "LinkedIn certificates",
    ],
    cta: "Go Unlimited",
    href: "/pricing",
    highlight: false,
    accentColour: "#FFB347",
  },
];

// ─────────────────────────────────────────────────────────────────────────
export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bigNumScale  = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const bigNumOpacity = useTransform(scrollYProgress, [0, 0.7], [0.07, 0.02]);

  // Stat counters
  const stat1 = useCounter(94);
  const stat3 = useCounter(15);

  return (
    <div className="min-h-screen bg-[#080810] text-[#f5f5f7] selection:bg-[#4b98ad]/30 selection:text-[#4b98ad] overflow-x-hidden">
      {/* CSS for marquee keyframes */}
      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        .marquee-left  { animation: marquee-left  30s linear infinite; }
        .marquee-right { animation: marquee-right 35s linear infinite; }
        .marquee-left:hover,
        .marquee-right:hover { animation-play-state: paused; }

        @keyframes blob-drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(40px, -30px) scale(1.05); }
          66%       { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes blob-drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-50px, 20px) scale(1.04); }
          66%       { transform: translate(30px, -40px) scale(0.96); }
        }
        @keyframes blob-drift-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(20px, 30px) scale(1.06); }
        }
        .blob-a { animation: blob-drift-a 18s ease-in-out infinite; }
        .blob-b { animation: blob-drift-b 22s ease-in-out infinite; }
        .blob-c { animation: blob-drift-c 14s ease-in-out infinite; }

        @keyframes scroll-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%       { transform: translateY(6px); opacity: 1; }
        }
        .scroll-bounce { animation: scroll-bounce 2s ease-in-out infinite; }

        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .pulse-ring { animation: pulse-ring 2s ease-out infinite; }
      `}</style>

      <Header />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — The 15 Promise
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden pt-20"
      >
        {/* Animated mesh gradient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="blob-a absolute top-[-12%] right-[-8%] w-[680px] h-[680px] rounded-full bg-[#4b98ad]/[0.18] blur-[130px]" />
          <div className="blob-b absolute bottom-[-10%] left-[-6%] w-[520px] h-[520px] rounded-full bg-[#4b98ad]/[0.10] blur-[110px]" />
          <div className="blob-c absolute top-[38%] left-[32%] w-[420px] h-[420px] rounded-full bg-[#FFB347]/[0.05] blur-[120px]" />
        </div>

        {/* Grain overlay — inline SVG, no external URL */}
        <div
          className="absolute inset-0 opacity-[0.032] pointer-events-none select-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "256px 256px",
          }}
        />

        {/* Giant "15" typographic background art */}
        <motion.div
          style={{ scale: bigNumScale, opacity: bigNumOpacity }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black text-[#4b98ad] leading-none"
            style={{ fontSize: "clamp(18rem, 45vw, 60rem)", letterSpacing: "-0.06em" }}
          >
            15
          </span>
        </motion.div>

        {/* Hero content grid */}
        <div className="relative z-10 mx-auto w-[88%] max-w-screen-xl px-6 lg:px-12 py-20 lg:py-32 -translate-y-[8vh] lg:-translate-y-[10vh]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">

            {/* LEFT: Copy */}
            <div className="md:col-span-7 space-y-8">

              {/* Brand + badge row */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-wrap items-center gap-3"
              >
                <span className="px-4 py-1.5 rounded-full bg-[#4b98ad]/[0.12] border border-[#4b98ad]/30 font-black text-[14px] text-[#4b98ad] uppercase tracking-widest">
                  AI Bytes Learning
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.10]">
                  <span className="relative flex h-2 w-2">
                    <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="font-mono text-[13px] text-white/50 uppercase tracking-[0.2em]">No experience needed</span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1
                  className="font-black tracking-tight leading-[0.95] text-white"
                  style={{ fontSize: "clamp(2.5rem, 6.3vw, 5rem)", letterSpacing: "-0.03em" }}
                >
                  Complex AI<br />
                  <span className="text-white/80">Simplified into </span>
                  <WordSwitcher words={HERO_WORDS} duration={7000} className="text-[#4b98ad] whitespace-nowrap" />
                </h1>
              </motion.div>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.25 }}
                className="text-lg md:text-xl text-white/55 leading-relaxed max-w-[540px]"
              >
                AI Bytes Learning gives you{" "}
                <span className="text-white font-semibold">real, job-ready AI skills</span>{" "}
                — not theory. Every course is broken into focused 15-minute lessons that fit your day and build your career.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.38 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/auth/signup">
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: "0 0 50px rgba(75,152,173,0.28)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2.5 h-14 px-8 rounded-full bg-[#4b98ad] text-[#080810] font-black text-[15px] uppercase tracking-wider shadow-[0_0_30px_rgba(75,152,173,0.18)] transition-shadow"
                  >
                    Start Learning Free
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link href="/courses">
                  <motion.button
                    whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.22)" }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2.5 h-14 px-8 rounded-full bg-white/[0.06] border border-white/[0.12] text-white font-bold text-[15px] tracking-wide hover:bg-white/[0.09] transition-all"
                  >
                    <Play className="w-4 h-4 text-[#4b98ad]" />
                    Browse Library
                  </motion.button>
                </Link>
              </motion.div>

              {/* Trust badges — matches original */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.56 }}
                className="flex flex-wrap items-center gap-6 pt-1"
              >
                {[
                  { icon: CheckCircle2, text: "Build AI Tools" },
                  { icon: Award,        text: "Get Certified" },
                  { icon: Brain,        text: "Lead with AI" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-white/40">
                    <Icon className="w-4 h-4 text-[#4b98ad]" />
                    <span className="font-semibold text-sm">{text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* RIGHT: Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 1.25, y: 20 }}
              animate={{ opacity: 1, scale: 1.3, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden md:block md:col-span-5 origin-center"
            >
              {/* Ambient glow behind card */}
              <div className="absolute -inset-8 bg-[#4b98ad]/12 rounded-full blur-[70px] -z-10" />

              <div className="relative rounded-[2rem] overflow-hidden border border-white/[0.10] shadow-2xl aspect-video bg-[#0c0c1a]">
                <VoiceAvatar
                  key="hero-intro-v11"
                  className="w-full h-full"
                  src="/videos/intro.mp4"
                  poster="/sarah_host.png"
                  transparent={false}
                  overlayControls={true}
                />

                {/* Gradient overlay at bottom of video */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#080810]/60 to-transparent pointer-events-none" />
              </div>

            </motion.div>

          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-bounce">
          <span className="font-mono text-[12px] uppercase tracking-[0.25em] text-white/25">Scroll</span>
          <ChevronDown className="w-4 h-4 text-white/25" />
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080810] to-transparent pointer-events-none" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1B — Watch AI Think
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-white/[0.06] py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-[#4b98ad]/[0.04] blur-[120px] rounded-full" />
        </div>
        <div className="relative mx-auto w-[95%] max-w-screen-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#4b98ad] mb-4 block">
              Interactive Simulation
            </span>
            <h2
              className="font-black text-white mb-4"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-0.03em" }}
            >
              Watch AI <span className="text-[#4b98ad]">Think</span>
            </h2>
            <p className="text-white/45 text-base md:text-lg leading-relaxed">
              Visualise the inner workings of a neural network. Watch how data flows through layers of artificial neurons to make predictions in real-time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center"
          >
            <NeuralNetworkAnimation />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — The Numbers Don't Lie
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-b border-white/[0.06] py-20 md:py-28 overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[#4b98ad]/[0.04] blur-[100px] rounded-full" />
        </div>

        <div className="relative mx-auto w-[95%] max-w-screen-2xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center font-mono text-[13px] uppercase tracking-[0.25em] text-white/25 mb-14"
          >
            The numbers don&apos;t lie
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06]">
            {/* Stat 1 */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0 }}
              className="bg-[#080810] px-10 py-16 md:py-20 flex flex-col gap-4"
            >
              <div className="font-black leading-none text-[#FF6B6B]"
                   style={{ fontSize: "clamp(4rem, 10vw, 7rem)" }}>
                <span ref={stat1.ref}>{stat1.count}</span>%
              </div>
              <div className="w-8 h-[2px] bg-[#FF6B6B]/40" />
              <p className="text-white/45 text-base md:text-lg leading-snug max-w-[240px]">
                Of traditional course takers quit before finishing
              </p>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.12 }}
              className="bg-[#080810] px-10 py-16 md:py-20 flex flex-col gap-4"
            >
              <div className="font-black leading-none text-[#FFB347]"
                   style={{ fontSize: "clamp(4rem, 10vw, 7rem)" }}>
                40 hrs
              </div>
              <div className="w-8 h-[2px] bg-[#FFB347]/40" />
              <p className="text-white/45 text-base md:text-lg leading-snug max-w-[240px]">
                Average AI course length. Most people have 15 minutes.
              </p>
            </motion.div>

            {/* Stat 3 */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.24 }}
              className="bg-[#080810] px-10 py-16 md:py-20 flex flex-col gap-4"
            >
              <div className="font-black leading-none text-[#4b98ad]"
                   style={{ fontSize: "clamp(4rem, 10vw, 7rem)" }}>
                <span ref={stat3.ref}>{stat3.count}</span> min
              </div>
              <div className="w-8 h-[2px] bg-[#4b98ad]/40" />
              <p className="text-white/45 text-base md:text-lg leading-snug max-w-[240px]">
                All you need. Per lesson. Per day. That&apos;s the whole promise.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — AI Companies (trust logos)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 border-b border-white/[0.06]">
        <div className="mx-auto w-[88%] max-w-6xl px-6 lg:px-12">
          <p className="text-center font-mono text-[12px] uppercase tracking-[0.28em] text-white/22 mb-10">
            Learn to use tools from the world&apos;s leading AI companies
          </p>
          <AICompaniesGrid />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — Velocity Ticker (Marquee)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-[#0a0a0f] border-b border-white/[0.05] overflow-hidden">
        <div className="mb-4 overflow-hidden">
          {/* Row 1 — scrolls left */}
          <div className="flex whitespace-nowrap">
            <div className="marquee-left flex gap-3 items-center">
              {[...MARQUEE_ROW_1, ...MARQUEE_ROW_1].map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.07] font-mono text-[14px] uppercase tracking-wider shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.colour }} />
                  <span className="text-white/55">{item.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 — scrolls right */}
        <div className="overflow-hidden">
          <div className="flex whitespace-nowrap">
            <div className="marquee-right flex gap-3 items-center">
              {[...MARQUEE_ROW_2, ...MARQUEE_ROW_2].map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.07] font-mono text-[14px] uppercase tracking-wider shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.colour }} />
                  <span className="text-white/55">{item.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — Old World vs New World (Manifesto)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-40 border-b border-white/[0.06]">
        <div className="mx-auto w-[88%] max-w-6xl px-6 lg:px-12">

          {/* Provocative statement */}
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16"
          >
            <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#FF6B6B] mb-5 block">The truth</span>
            <h2
              className="font-black text-white leading-[0.92]"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", letterSpacing: "-0.03em" }}
            >
              AI education was broken.<br />
              <span className="text-white/35">We fixed it.</span>
            </h2>
            <div className="mt-10">
              <Link href="/auth/signup">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(75,152,173,0.30)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-3 h-14 px-8 rounded-full bg-[#4b98ad] text-[#080810] font-black text-base uppercase tracking-wider shadow-[0_0_30px_rgba(75,152,173,0.18)] transition-shadow"
                >
                  Join Free — Start Today
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Comparison cards */}
          <div className="grid md:grid-cols-2 gap-4">

            {/* Old way */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 md:p-10"
            >
              <p className="font-mono text-[12px] uppercase tracking-[0.25em] text-white/25 mb-8">Old way</p>
              <ul className="space-y-5">
                {[
                  "Rambling 40-hour video lectures",
                  "Theory-first, practice never",
                  "Irrelevant academic bloat",
                  "Outdated content within months",
                  "No practical takeaways whatsoever",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3.5 text-white/35">
                    <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-[#FF6B6B]/60 shrink-0" />
                    <span className="text-[15px] leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* AI Bytes way */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="rounded-2xl bg-[#4b98ad]/[0.04] border border-[#4b98ad]/[0.18] p-8 md:p-10 relative overflow-hidden"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#4b98ad]/60 to-transparent" />
              <p className="font-mono text-[12px] uppercase tracking-[0.25em] text-[#4b98ad] mb-8">AI Bytes Learning way</p>
              <ul className="space-y-5">
                {[
                  "15-minute, high-impact micro-lessons",
                  "Instant, practical understanding",
                  "Zero fluff — outcome-focused only",
                  "AI-generated, always current content",
                  "Skills you can use tomorrow morning",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3.5 text-white">
                    <CheckCircle2 className="mt-[2px] w-4 h-4 text-[#4b98ad] shrink-0" />
                    <span className="text-[15px] leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — Three Steps. Then You're Dangerous.
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-40 border-b border-white/[0.06] overflow-hidden">
        <div className="mx-auto w-[88%] max-w-6xl px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-20"
          >
            <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#4b98ad] mb-5 block">How it works</span>
            <h2
              className="font-black text-white leading-[0.92]"
              style={{ fontSize: "clamp(2.6rem, 6vw, 5rem)", letterSpacing: "-0.03em" }}
            >
              Three steps.<br />
              <span className="text-white/30">Then you&apos;re dangerous.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-[3.5rem] left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-[1px] bg-gradient-to-r from-[#4b98ad]/30 via-[#4b98ad]/30 to-[#FFB347]/30" />

            {[
              {
                step: "01",
                title: "Pick your path",
                desc: "Choose from 12 AI learning categories — foundations, generative AI, business strategy, and more. No prerequisites. No gatekeeping.",
                colour: "#4b98ad",
                icon: BookOpen,
              },
              {
                step: "02",
                title: "Learn in Bytes",
                desc: "Each lesson is a focused 15-minute block. Real examples, interactive exercises, no filler. Finish one on your lunch break.",
                colour: "#4b98ad",
                icon: Zap,
              },
              {
                step: "03",
                title: "Get certified",
                desc: "Pass a short knowledge check and earn a verified certificate. Add it to LinkedIn — it&apos;s proof you did the work.",
                colour: "#FFB347",
                icon: Award,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.65, delay: i * 0.12 }}
                className="relative rounded-2xl bg-white/[0.03] border border-white/[0.07] p-8 overflow-hidden group hover:border-white/[0.14] transition-colors duration-300"
              >
                {/* Decorative step number */}
                <span
                  className="absolute -top-4 -left-2 font-black leading-none pointer-events-none select-none"
                  style={{ fontSize: "8rem", color: item.colour, opacity: 0.05 }}
                >
                  {item.step}
                </span>
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                     style={{ background: `linear-gradient(90deg, transparent, ${item.colour}55, transparent)` }} />

                <div className="relative">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: item.colour + "18" }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.colour }} />
                  </div>
                  <h3
                    className="font-black text-xl text-white mb-3 tracking-tight"
                  >
                    {item.title}
                  </h3>
                  <p className="text-white/48 text-[15px] leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-14">
            <Link href="/auth/signup">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(155,143,255,0.22)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 h-13 px-8 py-3.5 rounded-full bg-[#4b98ad] text-[#080810] font-black text-[14px] uppercase tracking-wider transition-shadow"
              >
                Start your first Byte
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6B — Meet Sterling
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-40 border-b border-white/[0.06] overflow-hidden">
        {/* Background: iris blob left, pulse blob right */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-64 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#4b98ad]/[0.07] blur-[120px]" />
          <div className="absolute -right-40 bottom-0 w-[500px] h-[500px] rounded-full bg-[#4b98ad]/[0.05] blur-[100px]" />
        </div>

        <div className="relative mx-auto w-[95%] max-w-screen-2xl grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* LEFT — Sterling orb visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center"
          >
            {/* Outer pulse ring */}
            <div className="absolute w-[340px] h-[340px] md:w-[420px] md:h-[420px] rounded-full border border-[#4b98ad]/[0.15] animate-[pulse-ring_3s_ease-in-out_infinite]" />
            <div className="absolute w-[280px] h-[280px] md:w-[350px] md:h-[350px] rounded-full border border-[#4b98ad]/[0.10] animate-[pulse-ring_3s_ease-in-out_infinite_0.5s]" />

            {/* Core orb */}
            <div className="relative w-[220px] h-[220px] md:w-[270px] md:h-[270px] rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(ellipse at 35% 35%, #4b98ad33 0%, #4b98ad11 50%, #080810 100%)",
                boxShadow: "0 0 80px rgba(155,143,255,0.18), inset 0 0 60px rgba(155,143,255,0.08)",
              }}
            >
              {/* Inner glow ring */}
              <div className="absolute inset-3 rounded-full"
                style={{ border: "1px solid rgba(155,143,255,0.25)", boxShadow: "inset 0 0 40px rgba(155,143,255,0.12)" }} />

              {/* Sterling wordmark */}
              <div className="text-center relative z-10">
                <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-[#4b98ad]/60 mb-2">AI Tutor</p>
                <p className="font-black text-white tracking-tight" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.03em" }}>Sterling</p>
                {/* Live indicator */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4b98ad]" style={{ boxShadow: "0 0 6px #4b98ad" }} />
                  <span className="font-mono text-[12px] text-[#4b98ad]/80 uppercase tracking-widest">Always On</span>
                </div>
              </div>

              {/* Orbiting ring 1 — iris dot */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-3 h-3 rounded-full bg-[#4b98ad]"
                  style={{ boxShadow: "0 0 10px #4b98ad" }} />
              </motion.div>

              {/* Orbiting ring 2 — pulse dot */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-[#4b98ad]/80"
                  style={{ boxShadow: "0 0 8px #4b98ad" }} />
              </motion.div>
            </div>

            {/* Floating capability chips around the orb */}
            {[
              { label: "Explains concepts",    colour: "#4b98ad", x: "-90%", y: "-25%",  delay: 0    },
              { label: "Answers questions",     colour: "#4b98ad", x: "35%",   y: "-85%", delay: 0.1  },
              { label: "Gives examples",        colour: "#FFB347", x: "65%",   y: "25%",   delay: 0.2  },
              { label: "Quizzes you",           colour: "#FF6B6B", x: "-75%",  y: "60%",   delay: 0.3  },
              { label: "Always available",      colour: "#4b98ad", x: "15%",   y: "90%",  delay: 0.4  },
            ].map((chip) => (
              <motion.div
                key={chip.label}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + chip.delay, duration: 0.5 }}
                className="absolute hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm whitespace-nowrap"
                style={{
                  left: `calc(50% + ${chip.x})`,
                  top: `calc(50% + ${chip.y})`,
                  borderColor: chip.colour + "30",
                  background: chip.colour + "0D",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: chip.colour }} />
                <span className="font-mono text-[13px] text-white/60 uppercase tracking-wider">{chip.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* RIGHT — Copy */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-8"
          >
            <div>
              <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#4b98ad] mb-5 block">Your AI tutor</span>
              <h2
                className="font-black leading-tight mb-6"
                style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)", letterSpacing: "-0.03em" }}
              >
                <span className="text-white/50">Meet</span> <span className="text-white">Sterling.</span><br />
                <span className="text-white/30">He knows everything.</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed max-w-md">
                Sterling is your always-on British AI tutor. Not a chatbot. Not a FAQ page.
                An actual intelligent guide who adapts to you — explaining concepts in your words,
                answering your real questions, and pushing you further when you&apos;re ready.
              </p>
            </div>

            {/* Capability list */}
            <ul className="space-y-4">
              {[
                {
                  icon: MessageSquare,
                  label: "Explains any concept",
                  desc: "Ask Sterling to break down anything — from attention mechanisms to boardroom AI strategy.",
                  colour: "#4b98ad",
                },
                {
                  icon: Brain,
                  label: "Knows your progress",
                  desc: "Sterling tracks what you've learned and focuses on what you're still fuzzy on.",
                  colour: "#4b98ad",
                },
                {
                  icon: Sparkles,
                  label: "Available mid-lesson",
                  desc: "Stuck on a slide? Hit the Sterling button. He's right there, always in context.",
                  colour: "#FFB347",
                },
                {
                  icon: Zap,
                  label: "Sharp, not sycophantic",
                  desc: "Sterling doesn't just tell you what you want to hear. He'll challenge you. That's the point.",
                  colour: "#FF6B6B",
                },
              ].map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div
                    className="mt-0.5 w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
                    style={{ background: item.colour + "16" }}
                  >
                    <item.icon className="w-4 h-4" style={{ color: item.colour }} />
                  </div>
                  <div>
                    <p className="font-black text-white text-[15px] tracking-tight mb-0.5">{item.label}</p>
                    <p className="text-white/40 text-[14px] leading-snug">{item.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>

            {/* CTA */}
            <div className="flex items-center gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(155,143,255,0.28)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.dispatchEvent(new CustomEvent('open-sterling'))}
                className="inline-flex items-center gap-2.5 h-12 px-7 rounded-full bg-[#4b98ad] text-[#080810] font-black text-[13px] uppercase tracking-wider transition-shadow cursor-pointer border-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#080810]/40 animate-pulse" />
                Talk to Sterling
              </motion.button>
              <span className="font-mono text-[14px] text-white/25 uppercase tracking-wider">Free with every account</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7 — Categories Bento Grid
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-40 border-b border-white/[0.06]">
        <div className="mx-auto w-[95%] max-w-screen-2xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#4b98ad] mb-4 block"
              >
                Explore
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
                className="font-black text-white leading-[0.92]"
                style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)", letterSpacing: "-0.03em" }}
              >
                12 learning paths.<br />
                <span className="text-white/30">One platform.</span>
              </motion.h2>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 font-mono text-[14px] text-white/35 uppercase tracking-widest hover:text-white/65 hover:gap-3 transition-all group"
            >
              View all courses
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Uniform Square Layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {CATEGORIES.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.9, y: 16 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  className="aspect-square"
                >
                  <Link
                    href={`/courses?category=${cat.id}`}
                    className="group relative flex flex-col items-center justify-center text-center p-4 md:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/[0.18] hover:shadow-[0_0_40px_rgba(75,152,173,0.15)] transition-all duration-500 h-full overflow-hidden"
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at top center, ${cat.colour}12 0%, transparent 70%)` }}
                    />

                    <div
                      className="relative w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-3 md:mb-5 transition-transform duration-500 group-hover:scale-110"
                      style={{ background: cat.colour + "16" }}
                    >
                      <cat.icon className="w-7 h-7 md:w-10 md:h-10 transition-transform duration-500" style={{ color: cat.colour }} />
                    </div>

                    <p className="relative font-black text-[15px] md:text-[17px] text-white/70 group-hover:text-white leading-tight transition-colors px-1 w-full truncate">
                      {cat.label}
                    </p>

                    <div
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 font-mono text-[10px] md:text-[11px] uppercase tracking-widest opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 w-full"
                      style={{ color: cat.colour }}
                    >
                      Explore
                      <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    </div>
                  </Link>
                </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7.5 — News Ticker
      ═══════════════════════════════════════════════════════════════════ */}
      <NewsTicker />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 8 — Testimonials (rotated cards)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-40 border-b border-white/[0.06] bg-[#09090f]">
        <div className="mx-auto w-[95%] max-w-screen-2xl">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#FFB347] mb-4 block"
            >
              What learners say
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="font-black text-white leading-[0.92]"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)", letterSpacing: "-0.03em" }}
            >
              Real people.<br />
              <span className="text-white/30">Real results.</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                whileHover={{ rotate: 0, y: -6, transition: { duration: 0.3 } }}
                style={{ rotate: t.rotation } as React.CSSProperties}
                className="rounded-2xl bg-white/[0.04] border border-white/[0.09] p-7 flex flex-col gap-5 cursor-default transition-shadow hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-[#FFB347] text-[#FFB347]" />
                  ))}
                </div>
                <p className="text-white/65 text-[15px] leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="border-t border-white/[0.07] pt-4">
                  <p className="font-bold text-white text-[14px]">{t.name}</p>
                  <p className="font-mono text-[12px] text-white/32 uppercase tracking-wider mt-0.5">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 9 — Pricing
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-40 border-b border-white/[0.06]">
        <div className="mx-auto w-[95%] max-w-screen-2xl">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#4b98ad] mb-4 block"
            >
              Pricing
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="font-black text-white leading-[0.92]"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)", letterSpacing: "-0.03em" }}
            >
              Start free.<br />
              <span className="text-white/30">Scale when ready.</span>
            </motion.h2>
            <p className="text-white/35 text-base mt-5">
              7-day free trial · No credit card for free tier · Cancel anytime
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                className={`relative rounded-2xl border p-8 flex flex-col gap-7 ${
                  plan.highlight
                    ? "bg-[#4b98ad]/[0.07] border-[#4b98ad]/35"
                    : "bg-white/[0.025] border-white/[0.08]"
                }`}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[1.5px] rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${plan.accentColour}60, transparent)` }}
                />

                {/* Most popular badge */}
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#4b98ad] text-[#080810] font-mono font-black text-[12px] uppercase tracking-widest">
                    Most Popular
                  </span>
                )}

                <div>
                  <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-white/35 mb-3">{plan.name}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-5xl text-white">{plan.price}</span>
                    <span className="font-mono text-[14px] text-white/32">{plan.period}</span>
                  </div>
                  <p className="text-white/40 text-sm mt-2.5">{plan.description}</p>
                </div>

                <ul className="space-y-3.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-white/65 text-[14px]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: plan.accentColour }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full h-12 rounded-xl font-bold text-[13px] uppercase tracking-wider transition-all ${
                      plan.highlight
                        ? "bg-[#4b98ad] text-[#080810] hover:bg-[#8b7fff]"
                        : "bg-white/[0.07] text-white hover:bg-white/[0.12] border border-white/[0.09]"
                    }`}
                  >
                    {plan.cta}
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 font-mono text-[13px] text-white/28 uppercase tracking-widest hover:text-white/55 transition-colors group"
            >
              See full pricing details
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 10 — Trending News
      ═══════════════════════════════════════════════════════════════════ */}
      <TrendingNews />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 11 — Final CTA (cinematic)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden py-28">
        {/* Atmospheric blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="blob-a absolute top-[-20%] left-[5%] w-[700px] h-[700px] rounded-full bg-[#4b98ad]/[0.12] blur-[140px]" />
          <div className="blob-b absolute bottom-[-20%] right-[5%] w-[600px] h-[600px] rounded-full bg-[#4b98ad]/[0.08] blur-[120px]" />
          <div className="blob-c absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-[#FFB347]/[0.04] blur-[100px]" />
        </div>

        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none select-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "256px 256px",
          }}
        />

        {/* Thin horizontal rule motif */}
        <div className="absolute top-0 left-[5%] right-[5%] h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="relative z-10 mx-auto w-[95%] max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <span className="font-mono text-[12px] uppercase tracking-[0.3em] text-white/22 block">
              Your move
            </span>

            <div>
              <h2
                className="font-black text-white block leading-[0.9]"
                style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", letterSpacing: "-0.04em" }}
              >
                Your AI future
              </h2>
              <h2
                className="font-black text-[#4b98ad] block leading-[0.9]"
                style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", letterSpacing: "-0.04em" }}
              >
                starts now.
              </h2>
            </div>

            <p className="text-lg md:text-xl text-white/40 leading-relaxed max-w-lg mx-auto pt-2">
              It takes 15 minutes. You already have 15 minutes.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 70px rgba(75,152,173,0.30)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-3 h-16 px-10 rounded-full bg-[#4b98ad] text-[#080810] font-black text-lg uppercase tracking-wider shadow-[0_0_40px_rgba(75,152,173,0.18)] transition-shadow"
                >
                  <Sparkles className="w-5 h-5" />
                  Start Free Today
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>

            <p className="font-mono text-[12px] text-white/20 uppercase tracking-[0.22em] pt-1">
              Free to start · No credit card required · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
