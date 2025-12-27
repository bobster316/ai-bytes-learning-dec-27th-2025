"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { Header } from "@/components/header";

// Blog post interface
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  author: {
    name: string;
    avatar: string;
  };
}

// Sample blog posts
const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Getting Started with AI: A Beginner's Guide",
    excerpt: "Learn the fundamentals of artificial intelligence and how to start your journey into this exciting field.",
    date: "2025-11-05",
    readTime: "5 min read",
    category: "Beginner",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    }
  },
  {
    id: "2",
    title: "Understanding Machine Learning Algorithms",
    excerpt: "Deep dive into the most popular machine learning algorithms and when to use each one.",
    date: "2025-11-03",
    readTime: "8 min read",
    category: "Intermediate",
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    }
  },
  {
    id: "3",
    title: "Prompt Engineering Best Practices",
    excerpt: "Master the art of crafting effective prompts for AI models like ChatGPT and other LLMs.",
    date: "2025-11-01",
    readTime: "6 min read",
    category: "Advanced",
    image: "https://images.unsplash.com/photo-1676573409381-c0d74a44f7ad?w=800&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    }
  },
  {
    id: "4",
    title: "AI Ethics: Building Responsible AI Systems",
    excerpt: "Explore the ethical considerations and best practices for developing responsible AI applications.",
    date: "2025-10-28",
    readTime: "7 min read",
    category: "Ethics",
    image: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    }
  },
  {
    id: "5",
    title: "Python for AI: Essential Libraries You Need",
    excerpt: "Discover the must-know Python libraries for AI development including TensorFlow, PyTorch, and more.",
    date: "2025-10-25",
    readTime: "10 min read",
    category: "Programming",
    image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    }
  },
  {
    id: "6",
    title: "Natural Language Processing in 2025",
    excerpt: "The latest trends and breakthroughs in NLP, from transformers to multimodal models.",
    date: "2025-10-20",
    readTime: "9 min read",
    category: "NLP",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    }
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden py-20 bg-slate-900 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>
        <div className="container relative z-10 mx-auto px-4 max-w-7xl">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-primary/20 text-cyan-300 font-medium text-lg tracking-wide uppercase">
              LATEST UPDATES
            </span>
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight leading-tight">
              AI Bytes <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">Blog</span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Insights, tutorials, and the latest updates on artificial intelligence and machine learning.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {blogPosts.map((post) => (
              <Link href={`/blog/${post.id}`} key={post.id} className="group">
                <Card className="h-full flex flex-col bg-card border-2 border-transparent hover:border-primary/50 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden rounded-2xl">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary text-white border-none text-sm font-semibold px-3 py-1">
                        {post.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <CardHeader className="flex-grow">
                    <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3">
                      {post.title}
                    </h2>
                    <p className="text-foreground/80 text-lg line-clamp-3">
                      {post.excerpt}
                    </p>
                  </CardHeader>

                  {/* Footer */}
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-foreground/60 pt-4 border-t border-border">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.readTime}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Want to Learn More?
          </h2>
          <p className="text-foreground/80 mb-8 max-w-2xl mx-auto">
            Join our AI Bytes community and get access to exclusive courses, tutorials, and resources
          </p>
          <Link href="/courses">
            <Button className="h-12 px-8 bg-[#086c7f] hover:bg-[#065b6b] text-white text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-[#086c7f]/25 hover:-translate-y-1">
              Explore Courses <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div >
  );
}
