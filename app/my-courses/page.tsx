"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search, Eye, Trash2, Sparkles, BookOpen, Clock,
  Activity, Loader2, ArrowRight
} from "lucide-react";

export default function MyCoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();

        // Fetch courses with module count
        const { data: coursesData, error } = await supabase
          .from('courses')
          .select('*, course_topics(count)')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching courses:", error);
          return;
        }

        let progressMap = new Map();
        if (user) {
          const { data: progressData } = await supabase
            .from('user_course_progress')
            .select('course_id, overall_progress_percentage')
            .eq('user_id', user.id);

          if (progressData) {
            progressData.forEach((p: any) => progressMap.set(p.course_id, p));
          }
        }

        if (coursesData) {
          const mapped = coursesData.map((c: any) => {
            const progress = progressMap.get(c.id);
            return {
              id: c.id,
              title: c.title,
              category: c.category || "General",
              difficulty: c.difficulty_level || "Beginner",
              topics: c.course_topics?.[0]?.count || 0,
              status: c.published ? "Published" : "Draft",
              createdAt: new Date(c.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric'
              }),
              progress: progress?.overall_progress_percentage || 0
            };
          });
          setCourses(mapped);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (courseId: number) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;

    setLoadingId(courseId);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.filter(c => c.id !== courseId));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete course. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] font-sans relative overflow-x-hidden">

      {/* ── Background blobs ──────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute rounded-full w-[900px] h-[900px] bg-[#9B8FFF]/5 -top-[20%] left-[10%] blur-[130px]" />
        <div className="absolute rounded-full w-[600px] h-[600px] bg-[#00FFB3]/5 bottom-[10%] right-[5%] blur-[120px]" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-[1140px] mx-auto">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="inline-block font-mono text-[0.58rem] uppercase tracking-[0.22em] text-[#9B8FFF] bg-[#9B8FFF]/10 border border-[#9B8FFF]/20 px-3 py-1.5 rounded-full mb-5">
                Learning Dashboard
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                My Courses
              </h1>
              <p className="text-white/65 text-lg max-w-2xl">
                Track your progress, continue learning, and manage your AI curriculum.
              </p>
            </div>

            <Link href="/admin/courses/new">
              <button className="inline-flex items-center gap-2 bg-[#00FFB3] text-black font-mono text-[0.7rem] uppercase tracking-[0.15em] px-6 py-3.5 rounded-xl hover:bg-[#00FFB3]/90 transition-colors font-bold whitespace-nowrap">
                <Sparkles className="w-4 h-4" />
                Generate New Course
              </button>
            </Link>
          </div>

          {/* ── Search bar ──────────────────────────────────────────────── */}
          <div className="relative max-w-2xl mb-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
            <Input
              placeholder="Search your library..."
              className="pl-12 h-14 bg-white/[0.06] border border-white/[0.10] text-white placeholder:text-white/20 text-lg rounded-xl focus:bg-white/[0.08] focus:border-white/20 focus-visible:ring-0 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* ── Course grid ─────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#00FFB3] mb-4" />
              <p className="text-white/50 font-mono text-sm">Loading your courses…</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.04] border border-dashed border-white/[0.08] rounded-3xl">
              <div className="w-16 h-16 bg-white/[0.06] rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search terms."
                  : "You haven't generated any courses yet. Start your AI journey today!"}
              </p>
              {!searchQuery && (
                <Link href="/admin/courses/new">
                  <button className="font-mono text-[0.65rem] uppercase tracking-[0.15em] px-6 py-2.5 rounded-full border border-white/[0.12] text-white/65 hover:bg-white/[0.06] hover:text-white transition-colors">
                    Create Your First Course
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="group bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] backdrop-blur-sm rounded-2xl flex flex-col h-full overflow-hidden transition-all duration-300"
                >
                  {/* Accent top strip — fills on hover */}
                  <div className="h-[2px] bg-[#00FFB3]/0 group-hover:bg-[#00FFB3] transition-all duration-500 w-0 group-hover:w-full" />

                  {/* Card header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start gap-2 mb-4">
                      {/* Status badge */}
                      <span className={cn(
                        "font-mono text-[0.55rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border",
                        course.status === "Published"
                          ? "bg-[#00FFB3]/10 border-[#00FFB3]/20 text-[#00FFB3]"
                          : "bg-white/[0.06] border-white/[0.10] text-white/50"
                      )}>
                        {course.status}
                      </span>
                      {/* Difficulty badge */}
                      <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border bg-white/[0.04] border-white/[0.08] text-white/50">
                        {course.difficulty}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white line-clamp-2 leading-tight group-hover:text-[#00FFB3] transition-colors mb-3">
                      {course.title}
                    </h3>

                    <div className="flex items-center gap-4 font-mono text-[0.6rem] text-white/50">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#00FFB3]" />
                        {course.category.replace(/_/g, " ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.createdAt}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-6 pb-4 flex-grow">
                    {course.progress > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between font-mono text-[0.6rem] text-white/50">
                          <span>Progress</span>
                          <span>{Math.round(course.progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00FFB3] rounded-full transition-all duration-1000"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#9B8FFF]/10 border border-[#9B8FFF]/20 font-mono text-[0.6rem] text-[#9B8FFF]">
                        <Activity className="w-4 h-4 shrink-0" />
                        {course.topics} modules ready to learn
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-3">
                    <Link href={`/courses/${course.id}`} className="col-span-2">
                      <button className="w-full inline-flex items-center justify-center gap-2 bg-[#00FFB3] text-black font-mono text-[0.65rem] uppercase tracking-[0.12em] font-bold py-2.5 rounded-lg hover:bg-[#00FFB3]/90 transition-colors">
                        {course.progress > 0 ? (
                          <>Continue Learning <ArrowRight className="w-4 h-4" /></>
                        ) : (
                          <>Start Course <Eye className="w-4 h-4" /></>
                        )}
                      </button>
                    </Link>

                    <button
                      className={cn(
                        "col-span-2 inline-flex items-center justify-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.1em] py-2 rounded-lg border transition-colors",
                        loadingId === course.id
                          ? "bg-white/[0.04] text-white/20 border-white/[0.08] cursor-not-allowed"
                          : "border-[#FF6B6B]/20 text-[#FF6B6B]/70 hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B] hover:border-[#FF6B6B]/30"
                      )}
                      onClick={() => handleDelete(course.id)}
                      disabled={loadingId === course.id}
                    >
                      {loadingId === course.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                      {loadingId === course.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
