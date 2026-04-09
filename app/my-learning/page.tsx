"use client";

import Link from "next/link";
import { Header } from "@/components/header";
import { BookOpen, CheckCircle2, Award, Clock, GraduationCap } from "lucide-react";

export default function MyLearningPage() {
  const stats = {
    enrolledCourses: 0,
    completed: 0,
    certificates: 0,
    hoursLearned: 0,
  };

  const hasEnrolledCourses = stats.enrolledCourses > 0;

  const statCards = [
    { icon: BookOpen,      value: stats.enrolledCourses,      label: "Enrolled Courses" },
    { icon: CheckCircle2,  value: stats.completed,            label: "Completed"        },
    { icon: Award,         value: stats.certificates,         label: "Certificates"     },
    { icon: Clock,         value: `${stats.hoursLearned}h`,   label: "Hours Learned"    },
  ];

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)]">
      <Header />

      {/* Hero */}
      <section className="border-b border-white/[0.06] pt-28 pb-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#00FFB3] mb-3">
            Student Portal
          </p>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            My Learning
          </h1>
          <p className="text-white/45 mt-2 text-base">
            Track your progress and continue learning
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-white/[0.06] py-8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ icon: Icon, value, label }) => (
              <div key={label}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 text-center">
                <div className="w-11 h-11 rounded-full bg-[#00FFB3]/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-[#00FFB3]" />
                </div>
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="text-sm text-white/45 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasEnrolledCourses ? (
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-8 h-8 text-white/30" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3">
                Start Your Learning Journey
              </h2>
              <p className="text-white/45 mb-8">
                Browse our course catalogue and enroll in your first course
              </p>
              <Link href="/courses">
                <button className="inline-flex items-center gap-2 bg-[#00FFB3] text-black font-mono text-[0.7rem] uppercase tracking-[0.15em] font-bold px-8 py-3.5 rounded-xl hover:bg-[#00FFB3]/90 transition-colors">
                  Browse Courses
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-white">Continue Learning</h2>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
