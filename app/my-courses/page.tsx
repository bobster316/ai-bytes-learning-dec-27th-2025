"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Download, Trash2, Plus } from "lucide-react";

// Mock data - replace with real data
const mockCourses = [
  {
    id: 1,
    title: "The Future of AI: What Could Happen in 10 Years",
    category: "foundational_ai_theory",
    difficulty: "Beginner",
    topics: 5,
    status: "Published",
    createdAt: "Nov 1, 2024",
  },
  {
    id: 2,
    title: "Voice Assistants 101: How Siri, Alexa and Google Understand You",
    category: "ai_applications",
    difficulty: "Beginner",
    topics: 4,
    status: "Published",
    createdAt: "Nov 2, 2024",
  },
  {
    id: 3,
    title: "Your Smartphone's Secret: How AI Lives in Your Pocket",
    category: "foundational_ai_theory",
    difficulty: "Beginner",
    topics: 4,
    status: "Published",
    createdAt: "Nov 3, 2024",
  },
  {
    id: 4,
    title: "Data and AI: How Information Powers Smart Technology",
    category: "data_science",
    difficulty: "Intermediate",
    topics: 5,
    status: "Draft",
    createdAt: "Nov 4, 2024",
  },
];

export default function MyCoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = mockCourses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-background-inverse border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-wider text-foreground-inverse/60">
                COURSE MANAGEMENT
              </p>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground-inverse">
                My Courses
              </h1>
              <p className="text-base text-foreground-inverse/70">
                {mockCourses.length} courses generated
              </p>
            </div>
            <Link href="/admin/generator">
              <Button size="lg" className="bg-card text-[#0A1628] hover:bg-background">
                <Plus className="w-4 h-4 mr-2" />
                Schedule New Course
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-6 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
            <Input
              placeholder="Search courses by title, description, or category..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground/70">No courses found matching your search.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="bg-card border-border shadow-sm hover:border-border transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge
                        variant={course.status === "Published" ? "beginner" : "secondary"}
                      >
                        {course.status}
                      </Badge>
                      <Badge variant="secondary">
                        {course.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 text-foreground">
                      {course.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-foreground/70 mt-2">
                      <span>{course.category.replace(/_/g, " ")}</span>
                      <span>•</span>
                      <span>{course.topics} topics</span>
                    </div>
                    <p className="text-xs text-foreground/60 mt-2">
                      Created: {course.createdAt}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <Link href={`/courses/${course.id}`}>
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Course
                      </Button>
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Course
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
