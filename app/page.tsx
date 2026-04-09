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
  Headphones,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { VoiceAvatar } from "@/components/voice/voice-avatar";
import { AICompaniesGrid } from "@/components/ui/ai-companies-grid";
import { TrendingNews } from "@/components/trending-news";
import { WordSwitcher } from "@/components/ui/word-switcher";
import { NeuralNetworkAnimation } from "@/components/ui/neural-network-animation";
import { NeuralNetworkAnimation3D } from "@/components/ui/neural-network-animation-3d";
import { LLMVisualization } from "@/components/ui/llm-visualization";
import { Logo } from "@/components/logo";
import { MatrixRain } from "@/components/ui/matrix-rain";

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
  "Easy Wins.",
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
const BASE = "https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-images/categories";
const CATEGORIES = [
  { id: "ai-foundations",     label: "AI Foundations",          icon: Brain,         colour: "#00FFB3", wide: true,  image: `${BASE}/ai-foundations.jpg`     },
  { id: "generative-ai",      label: "Generative AI & LLMs",    icon: Sparkles,      colour: "#00FFB3", wide: false, image: `${BASE}/generative-ai.jpg`      },
  { id: "prompt-engineering", label: "Prompt Engineering",      icon: MessageSquare, colour: "#FFB347", wide: false, image: `${BASE}/prompt-engineering.jpg` },
  { id: "ai-tools",           label: "AI Tools & Apps",         icon: Smartphone,    colour: "#00FFB3", wide: false, image: `${BASE}/ai-tools.jpg`           },
  { id: "business-ai",        label: "AI for Business",         icon: TrendingUp,    colour: "#00FFB3", wide: false, image: `${BASE}/business-ai.jpg`        },
  { id: "ai-agents",          label: "AI Agents & Automation",  icon: Bot,           colour: "#00FFB3", wide: true,  image: `${BASE}/ai-agents.jpg`          },
  { id: "nlp",                label: "NLP & Conversational AI", icon: MessageSquare, colour: "#00FFB3", wide: false, image: `${BASE}/nlp.jpg`                },
  { id: "computer-vision",    label: "Computer Vision",         icon: ImageIcon,     colour: "#FFB347", wide: false, image: `${BASE}/computer-vision.jpg`    },
  { id: "industry-ai",        label: "AI in Industry",          icon: Building2,     colour: "#00FFB3", wide: false, image: `${BASE}/industry-ai.jpg`        },
  { id: "data-ai",            label: "Data & AI Fundamentals",  icon: Database,      colour: "#00FFB3", wide: false, image: `${BASE}/data-ai.jpg`            },
  { id: "ai-ethics",          label: "AI Ethics & Governance",  icon: Shield,        colour: "#FF6B6B", wide: true,  image: `${BASE}/ai-ethics.jpg`          },
  { id: "ai-product",         label: "AI Product Dev",          icon: Layout,        colour: "#FFB347", wide: true,  image: `${BASE}/ai-product.jpg`         },
];

// ── Marquee course names ────────────────────────────────────────────────────
const MARQUEE_ROW_1 = [
  { label: "ChatGPT Mastery",         colour: "#00FFB3" },
  { label: "Neural Networks",         colour: "#00FFB3" },
  { label: "Prompt Engineering",      colour: "#FFB347" },
  { label: "AI for Marketing",        colour: "#00FFB3" },
  { label: "LangChain Fundamentals",  colour: "#00FFB3" },
  { label: "Computer Vision",         colour: "#FF6B6B" },
  { label: "AI Product Strategy",     colour: "#FFB347" },
  { label: "Fine-tuning LLMs",        colour: "#00FFB3" },
  { label: "Generative AI",           colour: "#00FFB3" },
  { label: "AI in Healthcare",        colour: "#FFB347" },
  { label: "Autonomous Agents",       colour: "#00FFB3" },
  { label: "RAG Systems",             colour: "#FF6B6B" },
];

const MARQUEE_ROW_2 = [
  { label: "AI Ethics & Governance",  colour: "#FF6B6B" },
  { label: "Midjourney Mastery",      colour: "#00FFB3" },
  { label: "AI for Finance",          colour: "#FFB347" },
  { label: "Embeddings & Vectors",    colour: "#00FFB3" },
  { label: "Stable Diffusion",        colour: "#00FFB3" },
  { label: "NLP Fundamentals",        colour: "#FFB347" },
  { label: "AI Sales Automation",     colour: "#00FFB3" },
  { label: "Gemini for Business",     colour: "#00FFB3" },
  { label: "AI in Education",         colour: "#FF6B6B" },
  { label: "Multimodal AI",           colour: "#FFB347" },
  { label: "AI Workflow Design",      colour: "#00FFB3" },
  { label: "Data Science Basics",     colour: "#00FFB3" },
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
    description: "Dip in. No card required. Get your first result in 60 seconds.",
    outcome: "Start immediately — no commitment",
    planBadge: "",
    features: [
      "Access to free courses",
      "Progress tracking",
      "Course certificates",
      "Mobile access",
    ],
    cta: "Start Free",
    href: "/auth/signup",
    highlight: false,
    accentColour: "#00FFB3",
  },
  {
    name: "Standard",
    price: "£15",
    period: "/month",
    description: "Build a real AI skill every month. 15 minutes a day is all it takes.",
    outcome: "Most popular · Best value",
    planBadge: "",
    features: [
      "All 50+ courses",
      "Unlimited certificates",
      "Priority support",
      "Offline access",
    ],
    cta: "Get Standard",
    href: "/pricing",
    highlight: true,
    accentColour: "#00FFB3",
  },
  {
    name: "Unlimited",
    price: "£35",
    period: "/month",
    description: "The full stack. Coaching, community, and Sterling in your corner.",
    outcome: "Includes Sterling AI tutor",
    planBadge: "For serious learners",
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

  // Animation preview toggle — remove once 3D is approved
  const [animView, setAnimView] = useState<'2d' | '3d' | 'llm'>('llm');

  return (
    <div className="relative min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] selection:bg-[#00FFB3]/30 selection:text-[#00C896] overflow-x-hidden">
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

        /* Reactive glow on primary CTA hover */
        .cta-primary:hover {
          box-shadow: 0 0 48px rgba(0,255,179,0.30), 0 0 96px rgba(0,255,179,0.10);
        }
      `}</style>

      <Header />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — The 15 Promise
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden pt-20"
      >
        {/* Animated mesh gradient blobs — subtler in light mode */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="blob-a absolute top-[-12%] right-[-8%] w-[680px] h-[680px] rounded-full dark:bg-[#00FFB3]/[0.18] bg-[#00C896]/[0.06] blur-[130px]" />
          <div className="blob-b absolute bottom-[-10%] left-[-6%] w-[520px] h-[520px] rounded-full dark:bg-[#00FFB3]/[0.10] bg-[#00C896]/[0.04] blur-[110px]" />
          <div className="blob-c absolute top-[38%] left-[32%] w-[420px] h-[420px] rounded-full dark:bg-[#FFB347]/[0.05] bg-[#FFB347]/[0.03] blur-[120px]" />
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
            className="font-black text-[#00FFB3] leading-none"
            style={{ fontSize: "clamp(18rem, 45vw, 60rem)", letterSpacing: "-0.06em" }}
          >
            15
          </span>
        </motion.div>

        {/* Hero content grid */}
        <div className="relative z-10 mx-auto w-[90%] max-w-screen-xl px-4 lg:px-10 pt-0 pb-12 lg:pb-20 -mt-16 lg:-mt-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">

            {/* LEFT: Copy */}
            <div className="md:col-span-6 space-y-5">

              {/* Badge row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00FFB3]/[0.10] border border-[#00FFB3]/25 font-mono text-[11px] text-[#00FFB3] uppercase tracking-[0.18em]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-[#00FFB3]" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00FFB3]" />
                  </span>
                  AI Bytes Learning
                </span>
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] font-mono text-[11px] text-white/40 uppercase tracking-[0.15em]">No experience needed</span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1
                  className="font-extrabold leading-[1.08] text-white"
                  style={{ fontSize: "clamp(2.4rem, 5.8vw, 4.6rem)", letterSpacing: "-0.01em" }}
                >
                  Complex AI<br />
                  <span className="text-white/70">Simplified into </span>
                  <WordSwitcher words={HERO_WORDS} duration={7000} className="text-[#00FFB3] whitespace-nowrap" />
                </h1>
              </motion.div>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base md:text-lg text-white/45 leading-relaxed max-w-[500px]"
              >
                Real, job-ready AI skills in focused 15-minute lessons.{" "}
                <span className="text-white/70">No tech background required.</span>
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.32 }}
                className="flex flex-col sm:flex-row gap-3 pt-1"
              >
                <Link href="/auth/signup">
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(0,255,179,0.22)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 h-11 px-7 rounded-full bg-[#00FFB3] text-[#080810] font-bold text-[14px] tracking-wide shadow-[0_0_24px_rgba(0,255,179,0.15)] transition-shadow"
                  >
                    Start Learning Free
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </Link>
                <Link href="/courses">
                  <motion.button
                    whileHover={{ scale: 1.01, borderColor: "rgba(255,255,255,0.20)" }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 h-11 px-7 rounded-full bg-white/[0.05] border border-white/[0.10] text-white/80 font-medium text-[14px] hover:bg-white/[0.08] transition-all"
                  >
                    <Play className="w-3.5 h-3.5 text-[#00FFB3]" />
                    Browse Library
                  </motion.button>
                </Link>
              </motion.div>

              {/* Trust row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.48 }}
                className="flex flex-wrap items-center gap-5 pt-1"
              >
                {[
                  { icon: CheckCircle2, text: "Build AI Tools" },
                  { icon: Award,        text: "Get Certified" },
                  { icon: Brain,        text: "Lead with AI" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-white/35">
                    <Icon className="w-3.5 h-3.5 text-[#00FFB3]/70" />
                    <span className="font-medium text-[13px]">{text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* RIGHT: Avatar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden md:block md:col-span-6"
            >
              <div className="absolute -inset-8 bg-[#00FFB3]/12 rounded-full blur-[80px] -z-10" />
              <div className="relative rounded-[1.5rem] overflow-hidden border border-white/[0.08] shadow-2xl aspect-[4/3] bg-[var(--page-surface)]">
                <VoiceAvatar
                  key="hero-intro-v11"
                  className="w-full h-full"
                  src="/videos/intro.mp4"
                  poster="/sarah_host.png"
                  transparent={false}
                  overlayControls={true}
                />
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--page-bg)]/50 to-transparent pointer-events-none" />
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
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--page-bg)] to-transparent pointer-events-none" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1B — Watch AI Think
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-white/[0.06] py-20 md:py-28 overflow-hidden">
        {/* Matrix DNA ambient layer — AI thinking = falling code */}
        <MatrixRain opacity={0.10} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-[#00FFB3]/[0.04] blur-[120px] rounded-full" />
        </div>
        <div className="relative mx-auto w-[95%] max-w-screen-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#00FFB3] mb-4 block">
              Interactive Simulation
            </span>
            <h2
              className="font-black text-white mb-4"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-0.03em" }}
            >
              Watch AI <span className="text-[#00FFB3]">Think</span>
            </h2>
            <p className="text-white/45 text-base md:text-lg leading-relaxed">
              See how AI actually works — not just what to type. Understand the logic behind every result, so you&apos;re never just guessing again.
            </p>
          </motion.div>

          {/* Preview toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1 gap-1">
              {([
                { v: '2d',  label: 'Original' },
                { v: '3d',  label: '3D Neural' },
                { v: 'llm', label: 'LLM Pipeline ✦' },
              ] as const).map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => setAnimView(v)}
                  className={`px-5 py-1.5 rounded-full font-mono text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                    animView === v
                      ? 'bg-[#00FFB3]/15 text-[#00FFB3] border border-[#00FFB3]/30'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center"
          >
            {animView === '2d'  && <NeuralNetworkAnimation />}
            {animView === '3d'  && <NeuralNetworkAnimation3D />}
            {animView === 'llm' && <LLMVisualization />}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — The Numbers Don't Lie
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-b border-white/[0.06] py-20 md:py-28 overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[#00FFB3]/[0.04] blur-[100px] rounded-full" />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--page-border)]">
            {/* Stat 1 */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0 }}
              className="bg-[var(--page-surface)] px-10 py-16 md:py-20 flex flex-col gap-4"
            >
              <div className="font-black leading-none text-[#FF6B6B]"
                   style={{ fontSize: "clamp(4rem, 10vw, 7rem)" }}>
                <span ref={stat1.ref}>{stat1.count}</span>%
              </div>
              <div className="w-8 h-[2px] bg-[#FF6B6B]/40" />
              <p className="text-white/45 text-base md:text-lg leading-snug max-w-[240px]">
                of traditional learners quit before finishing. You won&apos;t. Here&apos;s why.
              </p>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.12 }}
              className="bg-[var(--page-surface)] px-10 py-16 md:py-20 flex flex-col gap-4"
            >
              <div className="font-black leading-none text-[#FFB347]"
                   style={{ fontSize: "clamp(4rem, 10vw, 7rem)" }}>
                40<span style={{ color: "rgba(255,255,255,0.18)" }}>→</span>15
              </div>
              <div className="w-8 h-[2px] bg-[#FFB347]/40" />
              <p className="text-white/45 text-base md:text-lg leading-snug max-w-[240px]">
                Replace a 40-hour course with 15-minute lessons that actually stick.
              </p>
            </motion.div>

            {/* Stat 3 */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.24 }}
              className="bg-[var(--page-surface)] px-10 py-16 md:py-20 flex flex-col gap-4"
            >
              <div className="font-black leading-none text-[#00FFB3]"
                   style={{ fontSize: "clamp(4rem, 10vw, 7rem)" }}>
                <span ref={stat3.ref}>{stat3.count}</span> min
              </div>
              <div className="w-8 h-[2px] bg-[#00FFB3]/40" />
              <p className="text-white/45 text-base md:text-lg leading-snug max-w-[240px]">
                to your first AI skill. Start a lesson today — right now.
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
      <section className="py-10 bg-[var(--page-bg)] border-b border-white/[0.05] overflow-hidden">
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
            <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#FF6B6B] mb-5 block">The uncomfortable truth</span>
            <h2
              className="font-black text-white leading-[0.92]"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", letterSpacing: "-0.03em" }}
            >
              AI education was broken.<br />
              <span className="text-white/35">We rewrote the rules.</span>
            </h2>
            <div className="mt-10">
              <Link href="/auth/signup">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(75,152,173,0.30)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-3 h-14 px-8 rounded-full bg-[#00FFB3] text-[#080810] font-black text-base uppercase tracking-wider shadow-[0_0_30px_rgba(75,152,173,0.18)] transition-shadow"
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
              <p className="font-mono text-[12px] uppercase tracking-[0.25em] text-white/25 mb-8">❌ &nbsp;The old way</p>
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
              className="rounded-2xl bg-[#00FFB3]/[0.04] border border-[#00FFB3]/[0.18] p-8 md:p-10 relative overflow-hidden"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00FFB3]/60 to-transparent" />
              <p className="font-mono text-[12px] uppercase tracking-[0.25em] text-[#00FFB3] mb-8">✅ &nbsp;The AI Bytes way</p>
              <ul className="space-y-5">
                {[
                  "15-minute, high-impact micro-lessons",
                  "Instant, practical understanding",
                  "Zero fluff — outcome-focused only",
                  "AI-generated, always current content",
                  "Skills you can use tomorrow morning",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3.5 text-white">
                    <CheckCircle2 className="mt-[2px] w-4 h-4 text-[#00FFB3] shrink-0" />
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
            <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#00FFB3] mb-5 block">How it works</span>
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
            <div className="hidden md:block absolute top-[3.5rem] left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-[1px] bg-gradient-to-r from-[#00FFB3]/30 via-[#00FFB3]/30 to-[#FFB347]/30" />

            {[
              {
                step: "01",
                title: "Pick your path",
                desc: "Choose from 12 AI learning categories — foundations, generative AI, business strategy, and more. No prerequisites. No gatekeeping.",
                colour: "#00FFB3",
                icon: BookOpen,
              },
              {
                step: "02",
                title: "Learn in Bytes",
                desc: "Each lesson is a focused 15-minute block. Real examples, interactive exercises, no filler. Finish one on your lunch break.",
                colour: "#00FFB3",
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
                className="inline-flex items-center gap-2.5 h-13 px-8 py-3.5 rounded-full bg-[#00FFB3] text-[#080810] font-black text-[14px] uppercase tracking-wider transition-shadow"
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
          <div className="absolute -left-64 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#00FFB3]/[0.07] blur-[120px]" />
          <div className="absolute -right-40 bottom-0 w-[500px] h-[500px] rounded-full bg-[#00FFB3]/[0.05] blur-[100px]" />
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
            <div className="absolute w-[340px] h-[340px] md:w-[420px] md:h-[420px] rounded-full border border-[#00FFB3]/[0.15] animate-[pulse-ring_3s_ease-in-out_infinite]" />
            <div className="absolute w-[280px] h-[280px] md:w-[350px] md:h-[350px] rounded-full border border-[#00FFB3]/[0.10] animate-[pulse-ring_3s_ease-in-out_infinite_0.5s]" />

            {/* Core orb */}
            <div className="relative w-[220px] h-[220px] md:w-[270px] md:h-[270px] rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(ellipse at 35% 35%, #00FFB333 0%, #00FFB311 50%, #080810 100%)",
                boxShadow: "0 0 80px rgba(155,143,255,0.18), inset 0 0 60px rgba(155,143,255,0.08)",
              }}
            >
              {/* Inner glow ring */}
              <div className="absolute inset-3 rounded-full"
                style={{ border: "1px solid rgba(155,143,255,0.25)", boxShadow: "inset 0 0 40px rgba(155,143,255,0.12)" }} />

              {/* Sterling wordmark */}
              <div className="text-center relative z-10">
                <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-[#00FFB3]/60 mb-2">AI Tutor</p>
                <p className="font-black text-white tracking-tight" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.03em" }}>Sterling</p>
                {/* Live indicator */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB3]" style={{ boxShadow: "0 0 6px #00FFB3" }} />
                  <span className="font-mono text-[12px] text-[#00FFB3]/80 uppercase tracking-widest">Always On</span>
                </div>
              </div>

              {/* Orbiting ring 1 — iris dot */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-3 h-3 rounded-full bg-[#00FFB3]"
                  style={{ boxShadow: "0 0 10px #00FFB3" }} />
              </motion.div>

              {/* Orbiting ring 2 — pulse dot */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-[#00FFB3]/80"
                  style={{ boxShadow: "0 0 8px #00FFB3" }} />
              </motion.div>
            </div>

            {/* Floating capability chips around the orb */}
            {[
              { label: "Explains concepts",    colour: "#00FFB3", x: "-70%", y: "-35%",  delay: 0    },
              { label: "Answers questions",     colour: "#00FFB3", x: "30%",   y: "-70%", delay: 0.1  },
              { label: "Gives examples",        colour: "#FFB347", x: "35%",   y: "40%",   delay: 0.2  },
              { label: "Quizzes you",           colour: "#FF6B6B", x: "-60%",  y: "55%",   delay: 0.3  },
              { label: "Always available",      colour: "#00FFB3", x: "0%",   y: "85%",  delay: 0.4  },
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
              <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#00FFB3] mb-5 block">Your AI tutor</span>
              <h2
                className="font-black leading-tight mb-6"
                style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)", letterSpacing: "-0.03em" }}
              >
                <span className="text-white/35">You&apos;re not learning</span><br />
                <span className="text-white">alone anymore.</span>
              </h2>
              <p className="text-white/50 text-base leading-relaxed max-w-md mb-6">
                Sterling is your always-on British AI tutor — not a chatbot, not a FAQ page.
                An intelligent guide who adapts to exactly where you are, challenges you when
                you&apos;re ready, and never lets you stay stuck. Ask him anything. Right now,
                mid-lesson, at 2am. He doesn&apos;t sleep. He doesn&apos;t judge. He just teaches.
              </p>
              {/* Sterling mock conversation */}
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.09] p-5 max-w-md">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-white/25 uppercase tracking-widest mt-0.5 shrink-0 w-8">You</span>
                    <p className="text-white/55 text-[13.5px] leading-snug">&ldquo;Wait — what&apos;s the difference between a model and an algorithm?&rdquo;</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-[#00FFB3]/70 uppercase tracking-widest mt-0.5 shrink-0 w-8">S</span>
                    <p className="text-white/85 text-[13.5px] leading-snug">A model is the result. An algorithm is how you get there. One is the cake — the other is the recipe. Want me to show you with a live example?</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-white/25 uppercase tracking-widest mt-0.5 shrink-0 w-8">You</span>
                    <p className="text-white/55 text-[13.5px] leading-snug">&ldquo;Yes please&rdquo;</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-[#00FFB3]/70 uppercase tracking-widest mt-0.5 shrink-0 w-8">S</span>
                    <p className="text-white/85 text-[13.5px] leading-snug">Perfect. Let&apos;s use image recognition — it makes this click instantly.</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.07] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB3] shrink-0" style={{ boxShadow: "0 0 6px #00FFB3" }} />
                  <span className="font-mono text-[11px] text-[#00FFB3]/60 uppercase tracking-widest">Sterling · Always on</span>
                </div>
              </div>
            </div>

            {/* Capability list */}
            <ul className="space-y-4">
              {[
                {
                  icon: MessageSquare,
                  label: "Explains any concept",
                  desc: "Ask Sterling to break down anything — from attention mechanisms to boardroom AI strategy.",
                  colour: "#00FFB3",
                },
                {
                  icon: Brain,
                  label: "Knows your progress",
                  desc: "Sterling tracks what you've learned and focuses on what you're still fuzzy on.",
                  colour: "#00FFB3",
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
                className="inline-flex items-center gap-2.5 h-12 px-7 rounded-full bg-[#00FFB3] text-[#080810] font-black text-[13px] uppercase tracking-wider transition-shadow cursor-pointer border-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#080810]/40 animate-pulse" />
                Ask Sterling anything
              </motion.button>
              <span className="font-mono text-[14px] text-white/25 uppercase tracking-wider">Voice mode on Unlimited</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6C — Audio Module Recaps
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-40 border-b border-white/[0.06] overflow-hidden bg-[var(--page-bg)]">
        <div className="relative mx-auto w-[95%] max-w-screen-2xl grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* LEFT — Copy */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-8 order-2 lg:order-1"
          >
            <div>
              <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#00FFB3] mb-5 block flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                Audio Learning
              </span>
              <h2
                className="font-black leading-tight mb-6"
                style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)", letterSpacing: "-0.03em" }}
              >
                <span className="text-white">Learn on screen.</span><br />
                <span className="text-white/35">Reinforce on the go.</span>
              </h2>
              <p className="text-white/50 text-base leading-relaxed max-w-md mb-6">
                Learning doesn&apos;t stop when you lock your screen. At the end of every module, you get a concise, high-impact audio recap that synthesises exactly what you&apos;ve just learned. Perfect for the commute, the gym, or cementing knowledge away from a screen.
              </p>
              
              {/* Prominent Callout */}
              <div className="relative p-[1px] rounded-xl bg-gradient-to-r from-[#FFB347]/50 to-[#00FFB3]/50 max-w-md mb-8 shadow-[0_0_20px_rgba(255,179,71,0.15)]">
                <div className="bg-[var(--page-surface)] px-5 py-4 rounded-xl flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FFB347]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Headphones className="w-4 h-4 text-[#FFB347]" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-[14px] uppercase tracking-wider mb-1">Where to find it</h4>
                    <p className="text-white/70 text-[14px] font-medium leading-snug">
                      Look for the glowing audio player <strong className="text-white">at the bottom of the final lesson</strong> in any module right before the quiz.
                    </p>
                  </div>
                </div>
              </div>
              
              <ul className="space-y-4 max-w-md">
                {[
                  {
                    icon: Brain,
                    label: "High-yield synthesis",
                    desc: "Recaps connect concepts together instead of just repeating facts.",
                    colour: "#00FFB3",
                  },
                  {
                    icon: Sparkles,
                    label: "Improves retention",
                    desc: "Auditory reinforcement anchors your visual learning perfectly.",
                    colour: "#00FFB3",
                  },
                ].map((item, i) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
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
            </div>
          </motion.div>

          {/* RIGHT — Visual UI Player */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center order-1 lg:order-2"
          >
            <div className="relative w-full max-w-md rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Soft background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#00FFB3]/20 blur-[80px] pointer-events-none rounded-full" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-[#00FFB3]" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/30 bg-white/[0.05] px-3 py-1.5 rounded-full backdrop-blur-md">
                    Module Recap
                  </span>
                </div>
                
                <h3 className="font-display font-black text-2xl text-white mb-2 leading-tight">
                  Introduction to LLMs
                </h3>
                <p className="text-white/40 text-[14px] mb-8">
                  Synthesising the 3 core architecture concepts.
                </p>
                
                {/* Visual Waveform */}
                <div className="flex items-center justify-center gap-[3px] h-16 mb-8 group cursor-pointer">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: "4px" }}
                      animate={{ height: ["4px", `${Math.random() * 40 + 8}px`, "4px"] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.05,
                        ease: "easeInOut"
                      }}
                      className="w-1.5 rounded-full bg-[#00FFB3] opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                  ))}
                </div>
                
                {/* Play Controls */}
                <div className="flex items-center justify-between border-t border-white/[0.08] pt-6">
                  <span className="font-mono text-[11px] text-white/30 tracking-widest">00:00</span>
                  
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] cursor-pointer"
                  >
                    <Play className="w-6 h-6 text-[#080810] ml-1" />
                  </motion.div>
                  
                  <span className="font-mono text-[11px] text-white/30 tracking-widest">00:45</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6D — Karpathy Slide Method
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-24 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#00C896]/[0.04] blur-[100px] rounded-full" />
        </div>

        <div className="relative mx-auto w-[95%] max-w-screen-2xl">

          {/* Main two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* LEFT — Slide deck illustration */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center order-2 lg:order-1"
            >
              <div className="relative w-full max-w-[420px] mx-auto">
                {/* Ghost slides */}
                <div className="absolute -bottom-4 -right-4 w-full aspect-video rounded-xl border border-white/[0.05] bg-[var(--page-surface)]"
                     style={{ transform: 'rotate(5deg)' }} />
                <div className="absolute -bottom-2 -right-2 w-full aspect-video rounded-xl border border-white/[0.07] bg-[var(--page-surface)]"
                     style={{ transform: 'rotate(2.5deg)' }} />

                {/* Front slide mockup */}
                <div className="relative w-full aspect-video rounded-2xl border border-[#00C896]/20 bg-[#F8FAFC] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#00C896]" />
                  <div className="absolute inset-0 pl-7 pr-6 pt-5 pb-7 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#00C896] font-bold">MARP Slide</span>
                    </div>
                    <div className="h-4 w-3/4 rounded-sm bg-[#0A1628] mb-1.5" />
                    <div className="h-4 w-1/2 rounded-sm bg-[#0A1628]/50 mb-4" />
                    <div className="h-2 w-full rounded-sm bg-[#334155]/20 mb-1" />
                    <div className="h-2 w-5/6 rounded-sm bg-[#334155]/15 mb-4" />
                    {(['#00C896','#9B8FFF','#FFB347','#FF6B6B'] as const).map((c, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
                        <div className="h-2 w-4 rounded-sm bg-[#0A1628]/70" />
                        <div className="w-px h-2 bg-[#334155]/20" />
                        <div className="h-1.5 rounded-sm bg-[#334155]/18 flex-1" style={{ maxWidth: ['88%','72%','80%','65%'][i] }} />
                      </div>
                    ))}
                    <div className="mt-auto rounded-md border-l-[3px] border-[#00C896] bg-[#F0FDF9] px-2.5 py-2">
                      <div className="h-1.5 w-14 rounded-sm bg-[#00C896]/40 mb-1.5" />
                      <div className="h-1.5 w-full rounded-sm bg-[#334155]/18 mb-1" />
                      <div className="h-1.5 w-4/5 rounded-sm bg-[#334155]/12" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-white border-t border-[#E2E8F0] flex items-center px-5 justify-between">
                    <div className="w-12 h-1.5 rounded-sm bg-[#00C896]/25" />
                    <div className="w-3 h-1.5 rounded-sm bg-[#94A3B8]/30" />
                  </div>
                </div>

                {/* Format badges */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {[
                    { label: '.md', color: '#00C896' },
                    { label: 'PDF', color: '#9B8FFF' },
                    { label: 'PPTX', color: '#FFB347' },
                  ].map(({ label, color }) => (
                    <span key={label}
                      className="inline-flex items-center px-3 py-1 rounded-lg border font-mono text-[11px] font-bold uppercase tracking-wider"
                      style={{ borderColor: `${color}30`, color, background: `${color}10` }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* RIGHT — Copy */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="flex flex-col gap-5 order-1 lg:order-2"
            >
              {/* Label */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#00C896]">Exclusive Student Benefit</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03]">
                  <span className="w-1 h-1 rounded-full bg-[#FF6B6B] animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">Karpathy method</span>
                </span>
              </div>

              <h2 className="font-display font-black text-white leading-tight tracking-tight"
                  style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', letterSpacing: '-0.03em' }}>
                Your course, compressed{' '}
                <span style={{ color: '#00C896' }}>into MARP slides.</span>
              </h2>

              <p className="text-white/45 text-[0.95rem] leading-relaxed">
                Andrej Karpathy (Tesla AI Director, OpenAI co-founder) shared in his{' '}
                <span className="text-white/60">18M-view tweet</span> that he has AI render information
                as <strong className="text-white/65 font-semibold">MARP</strong> slideshows — slides force knowledge
                into bite-sized chunks you actually retain. We built this directly into AI Bytes.
              </p>

              {/* Karpathy quote */}
              <div className="rounded-xl p-4 border border-[#00C896]/12 bg-[#00C896]/[0.03]">
                <p className="text-white/45 text-[0.83rem] leading-relaxed italic mb-2">
                  &ldquo;Instead of getting answers via text, I like to have it render slideshows in the MARP format —
                  slides force information into bite-sized visual chunks.&rdquo;
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#00C896]/20 border border-[#00C896]/30 flex items-center justify-center">
                    <span className="text-[7px] text-[#00C896] font-bold">AK</span>
                  </div>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-[#00C896]/45">
                    Andrej Karpathy · 18M views
                  </p>
                </div>
              </div>

              {/* Compact feature pills */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🗜', label: '1 slide per lesson' },
                  { icon: '👤', label: 'Personal to you' },
                  { icon: '📐', label: 'AI-branded design' },
                  { icon: '📥', label: 'MD · PDF · PPTX' },
                ].map(({ icon, label }) => (
                  <div key={label}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-sm">{icon}</span>
                    <span className="text-white/60 text-[0.8rem] font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {/* How it works — inline */}
              <div className="flex items-center gap-1 flex-wrap pt-1">
                {[
                  { n: '01', t: 'Complete' },
                  { n: '02', t: 'Request' },
                  { n: '03', t: 'AI generates' },
                  { n: '04', t: 'Download' },
                ].map(({ n, t }, i) => (
                  <div key={n} className="flex items-center gap-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      <span className="font-mono text-[9px] text-white/20">{n}</span>
                      <span className="text-white/50 text-[0.75rem] font-medium">{t}</span>
                    </span>
                    {i < 3 && <span className="text-white/15 text-[10px]">›</span>}
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
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
                className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#00FFB3] mb-4 block"
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
                12 paths to skills you&apos;ll actually use.<br />
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
                    className="group relative flex flex-col items-end justify-end text-left rounded-2xl border border-white/[0.07] hover:border-white/[0.22] hover:shadow-[0_0_48px_rgba(0,200,150,0.12)] transition-all duration-500 h-full overflow-hidden"
                  >
                    {/* Background image or fallback */}
                    {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.label}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${cat.colour}15 0%, var(--page-bg) 100%)` }}
                      >
                        <cat.icon className="w-10 h-10 opacity-20" style={{ color: cat.colour }} />
                      </div>
                    )}
                    {/* Dark gradient overlay so label text is always readable */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    {/* Teal accent hover overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: `linear-gradient(to top, ${cat.colour}18 0%, transparent 60%)` }}
                    />

                    {/* Label — always white: sits on dark photo gradient */}
                    <div className="relative p-3 md:p-4 w-full">
                      <p className="font-black text-[13px] md:text-[15px] text-white keep-white leading-tight mb-1 drop-shadow-sm">
                        {cat.label}
                      </p>
                      <div
                        className="flex items-center gap-1 font-mono text-[9px] md:text-[10px] uppercase tracking-widest opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                        style={{ color: cat.colour }}
                      >
                        Explore <ChevronRight className="w-2.5 h-2.5" />
                      </div>
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
      <section className="py-28 md:py-40 border-b border-white/[0.06] bg-[var(--page-surface)]">
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
          SECTION 8B — TrendingNews with label
      ═══════════════════════════════════════════════════════════════════ */}

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
              className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#00FFB3] mb-4 block"
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
                    ? "bg-[#00FFB3]/[0.07] border-[#00FFB3]/35"
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
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#00FFB3] text-[#080810] font-mono font-black text-[12px] uppercase tracking-widest">
                    Most Popular
                  </span>
                )}

                {/* Plan badge (e.g. Unlimited) */}
                {plan.planBadge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#FFB347] text-[#080810] font-mono font-black text-[12px] uppercase tracking-widest whitespace-nowrap">
                    {plan.planBadge}
                  </span>
                )}

                <div>
                  <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-white/35 mb-3">{plan.name}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-5xl text-white">{plan.price}</span>
                    <span className="font-mono text-[14px] text-white/32">{plan.period}</span>
                  </div>
                  <p className="text-white/40 text-sm mt-2.5">{plan.description}</p>
                  <p className="font-mono text-[11px] uppercase tracking-wider mt-1.5" style={{ color: plan.accentColour + "88" }}>{plan.outcome}</p>
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
                        ? "bg-[#00FFB3] text-[#080810] hover:bg-[#8b7fff]"
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
      <section className="relative py-28 overflow-hidden keep-dark">
        {/* Thin horizontal rule motif */}
        <div className="absolute top-0 left-[5%] right-[5%] h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="mx-auto w-[88%] max-w-6xl px-6 lg:px-12">
          {/* Video card — same width as other large blocks, rounded corners */}
          <div className="relative rounded-3xl overflow-hidden">
            {/* Video */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            >
              <source src="/videos/hero-neural-network.mp4" type="video/mp4" />
            </video>

            {/* Dark overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, rgba(8,8,16,0.80) 0%, rgba(8,8,16,0.65) 50%, rgba(8,8,16,0.84) 100%)",
              }}
            />

            {/* Brand tint */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(75,152,173,0.10) 0%, transparent 70%)",
              }}
            />

            {/* Content */}
            <div className="relative z-10 py-24 px-8 md:px-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <span className="font-mono text-[12px] uppercase tracking-[0.3em] text-white/40 block">
                  Your move
                </span>

                <div>
                  <h2
                    className="font-black text-white block leading-[0.9]"
                    style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", letterSpacing: "-0.04em" }}
                  >
                    Start your first
                  </h2>
                  <h2
                    className="font-black text-[#00FFB3] block leading-[0.9]"
                    style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", letterSpacing: "-0.04em" }}
                  >
                    AI skill today.
                  </h2>
                </div>

                <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-lg mx-auto pt-2">
                  Pick a topic. Start a lesson. Get your first result in 15 minutes.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/auth/signup">
                    <motion.button
                      whileHover={{ scale: 1.04, boxShadow: "0 0 70px rgba(75,152,173,0.30)" }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-3 h-16 px-10 rounded-full bg-[#00FFB3] text-[#080810] font-black text-lg uppercase tracking-wider shadow-[0_0_40px_rgba(75,152,173,0.18)] transition-shadow"
                    >
                      <Sparkles className="w-5 h-5" />
                      Start free — first result in 15 min
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                </div>

                <p className="font-mono text-[12px] text-white/35 uppercase tracking-[0.22em] pt-1">
                  Free to start · No credit card required · Cancel anytime
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
