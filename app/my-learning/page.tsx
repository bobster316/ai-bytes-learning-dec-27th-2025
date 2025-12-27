"use client";

import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Award, Clock, GraduationCap } from "lucide-react";

export default function MyLearningPage() {
  // Mock data - replace with real user data
  const stats = {
    enrolledCourses: 0,
    completed: 0,
    certificates: 0,
    hoursLearned: 0,
  };

  const hasEnrolledCourses = stats.enrolledCourses > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-background-inverse border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wider text-foreground-inverse/60">
              STUDENT PORTAL
            </p>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground-inverse">
              My Learning
            </h1>
            <p className="text-base text-foreground-inverse/70">
              Track your progress and continue learning
            </p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#00BFA5]/10 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-[#00BFA5]" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.enrolledCourses}</p>
                <p className="text-sm text-foreground/70">Enrolled Courses</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#00BFA5]/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-[#00BFA5]" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-sm text-foreground/70">Completed</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#00BFA5]/10 flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-[#00BFA5]" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.certificates}</p>
                <p className="text-sm text-foreground/70">Certificates</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#00BFA5]/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-[#00BFA5]" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.hoursLearned}h</p>
                <p className="text-sm text-foreground/70">Hours Learned</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {!hasEnrolledCourses ? (
            // Empty State
            <div className="max-w-md mx-auto text-center py-12">
              <div className="w-20 h-20 rounded-full bg-background/20 flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-foreground/50" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Start Your Learning Journey
              </h2>
              <p className="text-foreground/70 mb-6">
                Browse our course catalogue and enroll in your first course
              </p>
              <Link href="/courses">
                <Button size="lg" className="bg-background-inverse hover:bg-[#1E293B] text-foreground-inverse">
                  Browse Courses
                </Button>
              </Link>
            </div>
          ) : (
            // Course List (when user has enrolled courses)
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Continue Learning</h2>
              {/* Course cards would go here */}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
