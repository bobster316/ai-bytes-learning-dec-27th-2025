"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  BookOpen, CheckCircle2, Clock, ArrowRight, Flame,
  Zap, ChevronRight, Play, Layers, BarChart2, Trophy
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

// ── Dark panel — matches lesson/home card language ──────────────────────────
const DarkPanel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "relative overflow-hidden bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm rounded-3xl",
    className
  )}>
    {children}
  </div>
);

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("Learner");
  const [greeting, setGreeting] = useState("Good morning");
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const fetchData = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { ensureUserProfile } = await import("@/app/actions/progress");
        await ensureUserProfile();

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (user.user_metadata?.full_name) {
            setUserName(user.user_metadata.full_name.split(" ")[0]);
          } else if (user.email) {
            setUserName(user.email.split("@")[0]);
          }
        }

        let enrolledCourseIds: string[] = [];
        if (user) {
          const { data: progressData } = await supabase
            .from("user_course_progress")
            .select("overall_progress_percentage, last_accessed_at, course_id, status, courses(*)")
            .eq("user_id", user.id)
            .order("last_accessed_at", { ascending: false })
            .limit(3);

          if (progressData && progressData.length > 0) {
            enrolledCourseIds = progressData.map((p: any) => p.course_id);
            setCourses(progressData.map((p: any) => ({
              id: p.course_id,
              title: (p.courses as any)?.title || "Untitled Course",
              image: (p.courses as any)?.image_url || "/course_title_images/Mastering ChatGPT & Prompt Engineering.png",
              progress: p.overall_progress_percentage || 0,
              duration: (p.courses as any)?.estimated_duration_hours ? `${(p.courses as any).estimated_duration_hours}h` : "2h",
              category: (p.courses as any)?.category || "AI Foundations",
            })));
          } else {
            setCourses([]);
          }
        }

        let query = supabase.from("courses").select("*").eq("published", true);
        if (enrolledCourseIds.length > 0) {
          query = query.not("id", "in", `(${enrolledCourseIds.join(",")})`);
        }
        const { data: recData } = await query.limit(3);

        if (recData && recData.length > 0) {
          setRecommendedCourses(recData.map((c: any) => ({
            id: c.id,
            title: c.title,
            image: c.image_url || "/course_title_images/mastering_chatgpt_v2.png",
            duration: c.estimated_duration_hours ? `${c.estimated_duration_hours * 60} min` : "45 min",
            level: c.difficulty_level || "Beginner",
          })));
        } else {
          setRecommendedCourses([
            { id: 672, title: "AI Foundations: The Basics", image: "/course_title_images/mastering_chatgpt_v2.png", duration: "45 min", level: "Beginner" },
            { id: 670, title: "Prompt Engineering 101", image: "/course_title_images/mastering_chatgpt_v2.png", duration: "60 min", level: "Beginner" },
          ]);
        }

        if (user) {
          const { data: profileData } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();
          if (profileData) setProfile(profileData);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const milestones = [
    { image: "/mastery/Phase 1.png", label: "First Step",  earned: (profile?.total_xp > 0)             },
    { image: "/mastery/Phase 2.png", label: "Momentum",    earned: (profile?.current_streak > 0)       },
    { image: "/mastery/Phase 3.png", label: "Creator",     earned: (profile?.total_xp > 500)           },
    { image: "/mastery/mastery.png", label: "Expertise",   earned: (profile?.current_level > 5)        },
  ];

  if (!mounted) return null;

  const currentCourse = courses[0];
  const weeklyXp      = Math.min((profile?.total_xp ?? 0) % 100, 100);

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] font-body relative overflow-x-hidden">

      {/* ── Persistent mesh gradient blobs ───────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute rounded-full w-[900px] h-[900px] bg-[#9B8FFF]/5 top-[5%] -left-[20%] blur-[110px] animate-[dbMesh_35s_linear_infinite]" />
        <div className="absolute rounded-full w-[700px] h-[700px] bg-[#00FFB3]/5 top-[50%] -right-[10%] blur-[110px] animate-[dbMesh_28s_linear_infinite_reverse]" />
        <div className="absolute rounded-full w-[600px] h-[600px] bg-[#FFB347]/5 bottom-[5%] left-[25%] blur-[110px] animate-[dbMesh_22s_linear_infinite_-11s]" />
      </div>

      {/* ── Grain texture ─────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-soft-light" aria-hidden="true">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="db-grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
          <rect width="100%" height="100%" filter="url(#db-grain)" />
        </svg>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dbMesh {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(40px,-50px) scale(1.07); }
          66%  { transform: translate(-30px,30px) scale(0.95); }
          100% { transform: translate(0,0) scale(1); }
        }
      ` }} />

      <Header />

      <main className="relative z-10 max-w-[1140px] mx-auto px-[4vw] pt-12 pb-32 md:pb-20">

        {/* ── HERO GREETING ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-white/40 mb-4">
            {greeting}
          </p>
          <h1 className="font-display font-black leading-[0.92] tracking-[-0.03em] mb-8 text-[clamp(2.6rem,6vw,4.8rem)]">
            <span className="text-white/90">Welcome back,{" "}</span>
            <span className="text-[#00FFB3]">{userName}.</span>
          </h1>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Day Streak",  value: profile?.current_streak ?? 0, icon: Flame,        colorClass: "text-[#FFB347]", bgClass: "bg-[#FFB347]/[0.05]", borderClass: "border-[#FFB347]/[0.16]" },
              { label: "Total XP",   value: profile?.total_xp ?? 0,        icon: Zap,          colorClass: "text-[#00FFB3]", bgClass: "bg-[#00FFB3]/[0.05]", borderClass: "border-[#00FFB3]/[0.16]" },
              { label: "Completed",  value: courses.filter(c => c.progress === 100).length, icon: CheckCircle2, colorClass: "text-[#00FFB3]", bgClass: "bg-[#00FFB3]/[0.05]", borderClass: "border-[#00FFB3]/[0.16]" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-full border",
                  stat.bgClass, stat.borderClass
                )}
              >
                <stat.icon className={cn("w-3.5 h-3.5 shrink-0", stat.colorClass)} />
                <span className={cn("font-mono text-sm font-bold", stat.colorClass)}>{stat.value}</span>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-white/60">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-6">

          {/* LEFT — 8 cols */}
          <div className="lg:col-span-8 space-y-6">

            {/* ── Continue Learning ──────────────────────────────────────── */}
            <section>
              <p className="font-mono text-[0.59rem] uppercase tracking-[0.22em] text-white/40 mb-4">
                — Continue Learning
              </p>

              {loading ? (
                <div className="w-full h-64 bg-white/[0.04] animate-pulse rounded-3xl border border-white/[0.08]" />
              ) : currentCourse ? (
                <Link href={`/courses/${currentCourse.id}`} className="block group">
                  <DarkPanel className="hover:border-white/[0.12] transition-colors duration-300">
                    <div className="flex flex-col md:flex-row">

                      {/* Course image */}
                      <div className="w-full md:w-[42%] aspect-video md:aspect-auto relative overflow-hidden rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none min-h-[200px]">
                        <Image
                          src={currentCourse.image} alt={currentCourse.title} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width:768px)100vw,42vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0f]/70 hidden md:block" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/70 to-transparent md:hidden" />
                        <div className="absolute bottom-4 left-4 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-[#00FFB3] bg-[#00FFB3]/10 border border-[#00FFB3]/20 px-3 py-1 rounded-full">
                          {currentCourse.category}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-7 flex flex-col justify-between gap-6">
                        <div>
                          <h3 className="font-display font-black text-[1.45rem] text-white leading-tight tracking-[-0.02em] group-hover:text-[#00FFB3] transition-colors duration-300 mb-3">
                            {currentCourse.title}
                          </h3>
                          <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/50 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> {currentCourse.duration}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/50">Progress</span>
                            <span className="font-mono text-2xl font-bold text-white">{currentCourse.progress}%</span>
                          </div>
                          <div className="h-[3px] w-full bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${currentCourse.progress}%` }}
                              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
                              className="h-full rounded-full bg-[#00FFB3]"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-mono text-[0.58rem] text-white/50">Continue your journey</span>
                            <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-[#00FFB3] flex items-center gap-1.5 group-hover:translate-x-1 transition-transform duration-300">
                              Resume <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DarkPanel>
                </Link>
              ) : (
                <DarkPanel className="p-10 text-center border-dashed">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-[#00FFB3]/[0.08] border border-[#00FFB3]/20">
                    <Play className="w-5 h-5 text-[#00FFB3]" />
                  </div>
                  <h3 className="font-display font-black text-xl text-white mb-2 tracking-tight">Start Your First Byte</h3>
                  <p className="font-body text-white/40 text-sm max-w-xs mx-auto mb-6 leading-relaxed">
                    Pick a topic and jumpstart your AI understanding in just 15 minutes.
                  </p>
                  <Link href="/courses">
                    <button className="font-mono text-[0.65rem] uppercase tracking-[0.15em] px-6 py-2.5 rounded-full border border-[#00FFB3]/35 text-[#00FFB3] hover:bg-[#00FFB3]/10 transition-colors cursor-pointer">
                      Browse Curriculum
                    </button>
                  </Link>
                </DarkPanel>
              )}
            </section>

            {/* ── Also in Progress ───────────────────────────────────────── */}
            {courses.length > 1 && (
              <section>
                <p className="font-mono text-[0.59rem] uppercase tracking-[0.22em] text-white/40 mb-4">— Also in Progress</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {courses.slice(1).map(c => (
                    <Link key={c.id} href={`/courses/${c.id}`} className="group">
                      <DarkPanel className="p-4 flex gap-4 items-center hover:border-white/[0.12] transition-colors duration-300">
                        <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden relative">
                          <Image src={c.image} alt={c.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="64px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-[#00FFB3] transition-colors">{c.title}</h4>
                          <div className="mt-2.5 h-[2px] w-full bg-white/[0.06] rounded-full">
                            <div className="h-full rounded-full bg-[#00FFB3]/70" style={{ width: `${c.progress}%` }} />
                          </div>
                          <p className="font-mono text-[0.58rem] text-white/50 mt-1">{c.progress}% complete</p>
                        </div>
                      </DarkPanel>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Recommended ────────────────────────────────────────────── */}
            <section>
              <p className="font-mono text-[0.59rem] uppercase tracking-[0.22em] text-white/40 mb-4">— Recommended for You</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {recommendedCourses.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link href={`/courses/${c.id}`} className="block group h-full">
                      <DarkPanel className="p-3 h-full flex flex-col hover:border-white/[0.12] transition-colors duration-300">
                        <div className="w-full aspect-video rounded-2xl overflow-hidden relative mb-4">
                          <Image src={c.image} alt={c.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:768px)100vw,33vw" />
                          <div className="absolute top-2 left-2 font-mono text-[0.55rem] uppercase tracking-[0.1em] px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/65 border border-white/[0.08]">
                            {c.level}
                          </div>
                        </div>
                        <h4 className="font-display font-bold text-white/90 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-[#00FFB3] transition-colors px-1">{c.title}</h4>
                        <div className="mt-auto flex items-center gap-1.5 font-mono text-[0.58rem] text-white/50 px-1">
                          <Clock className="w-3 h-3 shrink-0" /> {c.duration}
                        </div>
                      </DarkPanel>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>

          </div>

          {/* RIGHT — 4 cols ─────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-5">

            {/* ── Momentum ───────────────────────────────────────────────── */}
            <DarkPanel className="p-6">
              <p className="font-mono text-[0.59rem] uppercase tracking-[0.22em] text-white/40 mb-6">— Your Momentum</p>

              {/* Streak */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/[0.08]">
                <div>
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-white/50 mb-1.5">Day Streak</p>
                  <p className="font-mono font-bold text-[#FFB347] text-[2.4rem] leading-none">{profile?.current_streak ?? 0}</p>
                  <p className="font-mono text-[0.58rem] text-white/40 mt-1">consecutive days</p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#FFB347]/[0.07] border border-[#FFB347]/[0.16]">
                  <Flame className="w-6 h-6 text-[#FFB347]" />
                </div>
              </div>

              {/* Weekly XP */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-white/50">Weekly XP Goal</p>
                  <p className="font-mono text-[0.68rem] text-white/50">{weeklyXp} / 100</p>
                </div>
                <div className="h-[3px] w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyXp}%` }}
                    transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#FFB347] to-[#FF6B6B]"
                  />
                </div>
                <p className="font-mono text-[0.58rem] text-[#FFB347]">{weeklyXp}% of weekly goal</p>
              </div>

              {/* Total XP */}
              <div className="mt-5 pt-5 border-t border-white/[0.08] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#00FFB3]/[0.07] border border-[#00FFB3]/[0.16]">
                  <Zap className="w-4 h-4 text-[#00FFB3]" />
                </div>
                <div>
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-white/50">Total XP Earned</p>
                  <p className="font-mono text-xl font-bold text-[#00FFB3]">{profile?.total_xp ?? 0}</p>
                </div>
              </div>
            </DarkPanel>

            {/* ── Milestones ─────────────────────────────────────────────── */}
            <DarkPanel className="p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="font-mono text-[0.59rem] uppercase tracking-[0.22em] text-white/40">— Milestones</p>
                <Link href="/achievements" className="font-mono text-[0.59rem] uppercase tracking-[0.1em] text-[#00FFB3]/50 hover:text-[#00FFB3] transition-colors">
                  All →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {milestones.map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.22 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300",
                      m.earned
                        ? "bg-[#00FFB3]/[0.03] border-[#00FFB3]/[0.11]"
                        : "bg-white/[0.015] border-white/[0.04] opacity-45"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3 relative overflow-hidden",
                      m.earned ? "bg-[#00FFB3]/[0.06] border border-[#00FFB3]/[0.13]" : "bg-white/[0.04]",
                      !m.earned && "opacity-50"
                    )}>
                      <Image src={m.image} alt={m.label} fill className="object-cover p-2" sizes="48px" />
                    </div>
                    <p className="font-display font-bold text-xs text-white/80 leading-tight">{m.label}</p>
                    <p className={cn("font-mono text-[0.52rem] uppercase tracking-[0.1em] mt-1.5",
                      m.earned ? "text-[#00FFB3]" : "text-white/35")}>
                      {m.earned ? "Unlocked" : "Locked"}
                    </p>
                  </motion.div>
                ))}
              </div>
            </DarkPanel>

            {/* ── Quick Links ────────────────────────────────────────────── */}
            <DarkPanel className="p-5">
              <p className="font-mono text-[0.59rem] uppercase tracking-[0.22em] text-white/40 mb-4">— Quick Links</p>
              <div className="space-y-1">
                {[
                  { href: "/courses",     label: "Browse Courses",  icon: BookOpen, colorClass: "text-[#00FFB3]", bgClass: "bg-[#00FFB3]/[0.07] border border-[#00FFB3]/[0.13]" },
                  { href: "/my-learning", label: "My Learning",     icon: Layers,   colorClass: "text-[#00FFB3]", bgClass: "bg-[#00FFB3]/[0.07] border border-[#00FFB3]/[0.13]" },
                  { href: "/pricing",     label: "Upgrade Plan",    icon: Zap,      colorClass: "text-[#FFB347]", bgClass: "bg-[#FFB347]/[0.07] border border-[#FFB347]/[0.13]" },
                ].map((link) => (
                  <Link key={link.href} href={link.href}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", link.bgClass)}>
                      <link.icon className={cn("w-3.5 h-3.5", link.colorClass)} />
                    </div>
                    <span className="font-body text-sm text-white/65 group-hover:text-white/90 transition-colors">{link.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 ml-auto group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </DarkPanel>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
