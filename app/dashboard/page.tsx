"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  CheckCircle2,
  Award,
  Clock,
  GraduationCap,
  TrendingUp,
  Zap,
  Target,
  Brain,
  ArrowRight,
  Flame,
  Trophy,
  Star,
  Sparkles,
  PlayCircle,
  Calendar,
  BarChart3,
  Crown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("Learner");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setMounted(true);
    // Get time of day greeting
    const hour = new Date().getHours();
    if (hour < 12) setCurrentTime("Good morning");
    else if (hour < 18) setCurrentTime("Good afternoon");
    else setCurrentTime("Good evening");

    // Get user name from Supabase
    const fetchUser = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.user_metadata?.full_name) {
            setUserName(user.user_metadata.full_name.split(" ")[0]);
          } else if (user?.email) {
            setUserName(user.email.split("@")[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const stats = [
    {
      icon: BookOpen,
      label: "Enrolled Bytes",
      value: "3",
      subtext: "Active courses",
      color: "from-cyan-500 to-blue-500",
      bgColor: "bg-cyan-500/10",
      iconColor: "text-cyan-500",
    },
    {
      icon: CheckCircle2,
      label: "Completed",
      value: "1",
      subtext: "Bytes finished",
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    {
      icon: Flame,
      label: "Day Streak",
      value: "7",
      subtext: "Keep it up! 🔥",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    {
      icon: Clock,
      label: "Time Learned",
      value: "4.5h",
      subtext: "This month",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
  ];

  const currentCourses = [
    {
      id: 1,
      title: "Mastering ChatGPT & Prompt Engineering",
      image: "/course_title_images/Mastering ChatGPT & Prompt Engineering.png",
      progress: 65,
      nextLesson: "Advanced Prompt Techniques",
      duration: "15 min left",
      category: "Prompt Engineering",
    },
    {
      id: 2,
      title: "Generative AI for Business Leaders",
      image: "/course_title_images/Generative AI for Business Leaders.png",
      progress: 30,
      nextLesson: "AI Strategy Framework",
      duration: "45 min left",
      category: "Business",
    },
    {
      id: 3,
      title: "Building AI Agents & Automation",
      image: "/course_title_images/Building AI Agents & Automation.png",
      progress: 10,
      nextLesson: "Introduction to AI Agents",
      duration: "80 min left",
      category: "Advanced",
    },
  ];

  const achievements = [
    { icon: Trophy, label: "First Byte", earned: true, color: "text-yellow-500" },
    { icon: Flame, label: "Week Streak", earned: true, color: "text-orange-500" },
    { icon: Brain, label: "AI Explorer", earned: true, color: "text-purple-500" },
    { icon: Star, label: "Top Learner", earned: false, color: "text-slate-400" },
    { icon: Crown, label: "Champion", earned: false, color: "text-slate-400" },
  ];

  const recommendedCourses = [
    {
      title: "AI Ethics & Responsible AI",
      image: "/categories/AI Ethics, Governance & Responsible AI.png",
      duration: "60 min",
      level: "Intermediate",
    },
    {
      title: "Computer Vision Fundamentals",
      image: "/categories/Computer Vision & Image AI.png",
      duration: "75 min",
      level: "Advanced",
    },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
      <Header />

      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-900">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative container mx-auto px-4 py-12 lg:py-16 max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Welcome Message */}
            <div className="space-y-4">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium Member
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-white">
                {currentTime}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{userName}</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-lg">
                You're on a <span className="text-orange-400 font-semibold">7-day streak</span>! Keep learning to unlock your next achievement.
              </p>
            </div>

            {/* Quick Stats Row */}
            <div className="flex gap-4 lg:gap-6">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white">65%</div>
                <div className="text-sm text-slate-400">Weekly Goal</div>
              </div>
              <div className="w-px bg-slate-700"></div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-cyan-400">3</div>
                <div className="text-sm text-slate-400">Active Bytes</div>
              </div>
              <div className="w-px bg-slate-700"></div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-emerald-400">1</div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl -mt-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-500 hover:-translate-y-1"
            >
              {/* Gradient accent line */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-80`}></div>

              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {stat.subtext}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content - Current Courses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Continue Learning</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Pick up where you left off</p>
                  </div>
                </div>
                <Link href="/courses">
                  <Button variant="ghost" size="sm" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              {/* Course Cards */}
              <div className="space-y-6">
                {currentCourses.map((course) => (
                  <Link href={`/courses/${course.id}`} key={course.id}>
                    <Card className="group overflow-hidden bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500 hover:-translate-y-1 cursor-pointer">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Course Image */}
                          <div className="relative w-full sm:w-36 h-24 shrink-0 overflow-hidden rounded-lg sm:m-4">
                            <Image
                              src={course.image}
                              alt={course.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 dark:to-black/30"></div>
                          </div>

                          {/* Course Details */}
                          <div className="flex-1 p-5 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {course.category}
                                </Badge>
                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                  {course.title}
                                </h3>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{course.progress}%</div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000"
                                  style={{ width: `${course.progress}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">
                                  Next: <span className="text-slate-700 dark:text-slate-300 font-medium">{course.nextLesson}</span>
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {course.duration}
                                </span>
                              </div>
                            </div>

                            {/* Continue Button */}
                            <Button className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all">
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Continue Learning
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recommended for You */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recommended for You</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Based on your interests</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {recommendedCourses.map((course, idx) => (
                  <Card key={idx} className="group overflow-hidden bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div className="relative h-32 overflow-hidden">
                      <Image
                        src={course.image}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <Badge className="absolute top-3 left-3 bg-white/90 text-slate-900">{course.level}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Achievements Card */}
            <Card className="overflow-hidden bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Achievements</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">3 of 5 earned</p>
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  {achievements.map((ach, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${ach.earned ? 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 shadow-lg' : 'bg-slate-100 dark:bg-slate-800 opacity-50'}`}>
                        <ach.icon className={`w-5 h-5 ${ach.color}`} />
                      </div>
                      <span className={`text-[10px] font-medium ${ach.earned ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                        {ach.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Goal Card */}
            <Card className="overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 border-none text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6" />
                  <h3 className="font-bold">Weekly Goal</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-4xl font-bold">65%</p>
                      <p className="text-cyan-100 text-sm">39 min / 60 min</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-cyan-100">21 min left</p>
                    </div>
                  </div>

                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full w-[65%] transition-all duration-1000" />
                  </div>

                  <p className="text-sm text-cyan-100">
                    🎯 Complete 21 more minutes to hit your goal!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Learning Streak */}
            <Card className="overflow-hidden bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">7 Day Streak</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Your best: 14 days</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${idx <= 6 ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        {idx <= 6 && <Flame className="w-4 h-4 text-white" />}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="overflow-hidden bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>

                <Link href="/courses">
                  <Button variant="outline" className="w-full justify-start text-left h-12 border-slate-200 dark:border-slate-700 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400">
                    <BookOpen className="w-4 h-4 mr-3" />
                    Browse All Courses
                  </Button>
                </Link>

                <Link href="/account/subscription">
                  <Button variant="outline" className="w-full justify-start text-left h-12 border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400">
                    <Crown className="w-4 h-4 mr-3" />
                    Manage Subscription
                  </Button>
                </Link>

                <Link href="/certificate">
                  <Button variant="outline" className="w-full justify-start text-left h-12 border-slate-200 dark:border-slate-700 hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400">
                    <Award className="w-4 h-4 mr-3" />
                    View Certificates
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
