"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Award, Clock, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#1E3A5F] to-[#0F172A]">
      <Header />

      {/* Header Section */}
      <section className="bg-[#0F172A] border-b border-white/10">
        <div className="container mx-auto px-4 py-12">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wider text-foreground-inverse/60">
              STUDENT PORTAL
            </p>
            <h1 className="text-4xl font-bold">My Learning</h1>
            <p className="text-foreground-inverse/70">
              Track your progress and continue learning
            </p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BookOpen,
                label: "Enrolled Courses",
                value: "0",
                color: "text-[#00BFA5]",
                bgColor: "bg-[#00BFA5]/20",
              },
              {
                icon: CheckCircle2,
                label: "Completed",
                value: "0",
                color: "text-[#10B981]",
                bgColor: "bg-[#10B981]/20",
              },
              {
                icon: Award,
                label: "Certificates",
                value: "0",
                color: "text-[#F59E0B]",
                bgColor: "bg-[#F59E0B]/20",
              },
              {
                icon: Clock,
                label: "Hours Learned",
                value: "0h",
                color: "text-[#2563EB]",
                bgColor: "bg-[#2563EB]/20",
              },
            ].map((stat, index) => (
              <Card key={index} className="border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground-inverse/60 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Empty State */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card className="border-white/10">
            <CardContent className="p-12">
              <div className="text-center space-y-6 max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-card/5 flex items-center justify-center mx-auto">
                  <GraduationCap className="w-10 h-10 text-foreground-inverse/40" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">
                    Start Your Learning Journey
                  </h2>
                  <p className="text-foreground-inverse/60">
                    Browse our course catalogue and enroll in your first course
                  </p>
                </div>
                <Link href="/courses">
                  <Button size="lg" className="gap-2">
                    <BookOpen className="w-5 h-5" />
                    Browse Courses
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
