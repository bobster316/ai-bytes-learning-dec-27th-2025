"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Download, Trash2, Plus, Sparkles, BookOpen, Clock, Activity, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

        // Fetch courses with topic count
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
              createdAt: new Date(c.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-cyan-500/20">
      <Header />

      <main className="pt-32 pb-20 relative px-4 sm:px-6">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[600px] bg-cyan-500/10 dark:bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <Badge variant="outline" className="mb-4 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                Learning Dashboard
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                My Courses
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">
                Track your progress, continue learning, and manage your AI curriculum.
              </p>
            </div>

            <Link href="/admin/generator">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/20 rounded-xl">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate New Course
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mb-12 group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-xl flex items-center shadow-sm">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search your library..."
                className="pl-12 h-14 border-0 bg-transparent text-lg focus-visible:ring-0 placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Course Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-4" />
              <p className="text-slate-500">Loading your courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No courses found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                {searchQuery ? "Try adjusting your search terms." : "You haven't generated any courses yet. Start your AI journey today!"}
              </p>
              {!searchQuery && (
                <Link href="/admin/generator">
                  <Button variant="outline">Create Your First Course</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="group border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 flex flex-col h-full overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-600 w-0 group-hover:w-full transition-all duration-500" />

                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex gap-2">
                        <Badge variant={course.status === "Published" ? "default" : "secondary"} className={cn(
                          course.status === "Published" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20" : "bg-slate-100 text-slate-600"
                        )}>
                          {course.status}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 dark:border-slate-700">
                          {course.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2 text-xs font-medium">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-500" /> {course.category.replace(/_/g, " ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {course.createdAt}
                      </span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-grow">
                    {course.progress > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-slate-500">
                          <span>Progress</span>
                          <span>{Math.round(course.progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-1000"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-500" />
                        {course.topics} Topics ready to learn
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-0 grid grid-cols-2 gap-3">
                    <Link href={`/courses/${course.id}`} className="col-span-2">
                      <Button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold shadow-sm">
                        {course.progress > 0 ? (
                          <>Continue Learning <ArrowRight className="w-4 h-4 ml-2" /></>
                        ) : (
                          <>Start Course <Eye className="w-4 h-4 ml-2" /></>
                        )}
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDelete(course.id)}
                      disabled={loadingId === course.id}
                    >
                      {loadingId === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

