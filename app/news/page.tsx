"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Calendar, Newspaper, Home, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface NewsArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news");
        if (!response.ok) throw new Error("Failed to fetch news");
        const data = await response.json();
        setArticles(data);
      } catch (err) {
        setError("Unable to load news articles");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <Header />

      {/* Navigation Breadcrumb */}
      <nav className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Link href="/" className="flex items-center gap-1 hover:text-[#00BFA5] transition-colors">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">AI News</span>
            </div>

            {/* Quick Navigation Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-foreground/70 hover:text-[#00BFA5] transition-colors">
                Home
              </Link>
              <Link href="/courses" className="text-foreground/70 hover:text-[#00BFA5] transition-colors">
                Courses
              </Link>
              <Link href="/blog" className="text-foreground/70 hover:text-[#00BFA5] transition-colors">
                Blog
              </Link>
              <Link href="/about" className="text-foreground/70 hover:text-[#00BFA5] transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-background-inverse border-b border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Newspaper className="w-4 h-4 mr-1" />
              AI NEWS
            </Badge>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground-inverse mb-4">
              Latest <span className="text-[#00BFA5]">AI News</span>
            </h1>
            <p className="text-base text-foreground-inverse/70 leading-relaxed">
              Stay updated with the latest developments in artificial intelligence, machine learning, and emerging technologies
            </p>
          </div>
        </div>
      </section>

      {/* News Articles */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-[#00BFA5] animate-spin mb-4" />
              <p className="text-foreground/70">Loading latest AI news...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-foreground/70">{error}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {articles.map((article, index) => {
                // Different gradient styles for variety
                const gradients = [
                  'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
                  'bg-gradient-to-br from-[#16213e] via-[#0f3460] to-[#1a1a2e]',
                  'bg-gradient-to-br from-[#0f3460] via-[#1a1a2e] to-[#16213e]',
                  'bg-gradient-to-br from-[#1a1a2e] to-[#0f3460]',
                  'bg-gradient-to-br from-[#0f3460] to-[#16213e]',
                  'bg-gradient-to-br from-[#16213e] to-[#1a1a2e]',
                ];

                return (
                  <Link
                    key={index}
                    href={`/news/${encodeURIComponent(
                      article.title
                    )}?url=${encodeURIComponent(
                      article.url
                    )}&imageUrl=${encodeURIComponent(
                      article.urlToImage || ""
                    )}&content=${encodeURIComponent(
                      article.content || ""
                    )}&description=${encodeURIComponent(
                      article.description || ""
                    )}&source=${encodeURIComponent(
                      article.source?.name || "AI News"
                    )}&date=${encodeURIComponent(article.publishedAt)}`}
                    className="group block h-full"
                  >
                    <Card className="h-full flex flex-col bg-card border-border shadow-sm hover:shadow-lg hover:border-[#00BFA5]/50 transition-all duration-300">
                      <div className="h-48 relative overflow-hidden rounded-t-xl bg-background-subtle">
                        {article.urlToImage ? (
                          <img
                            src={`/api/news/image?url=${encodeURIComponent(article.urlToImage)}`}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              // Fallback to gradient if image fails to load
                              const target = e.target as HTMLImageElement;
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="h-full flex items-center justify-center ${gradients[index % gradients.length]}"><svg class="w-16 h-16 text-[#00BFA5] opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg></div>`;
                              }
                            }}
                          />
                        ) : (
                          <div className={`h-full flex items-center justify-center ${gradients[index % gradients.length]}`}>
                            <Newspaper className="w-16 h-16 text-[#00BFA5]/40" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="flex-grow pb-3">
                        <div className="flex items-center gap-3 text-sm text-foreground/80 mb-3">
                          <span className="font-medium text-[#00BFA5]">
                            {article.source?.name || "AI News"}
                          </span>
                          <span className="text-border">•</span>
                          <time
                            dateTime={article.publishedAt}
                            className="flex items-center gap-1"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(article.publishedAt)}
                          </time>
                        </div>

                        <h3 className="text-lg font-semibold text-foreground leading-tight group-hover:text-[#00BFA5] transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                      </CardHeader>

                      <CardContent className="pt-0 flex flex-col justify-between flex-grow">
                        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                          {article.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Want to Learn More About AI?
          </h2>
          <p className="text-foreground/80 mb-8 max-w-2xl mx-auto">
            Explore our comprehensive AI courses and start your journey into artificial intelligence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses">
              <button className="bg-[#00BFA5] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#00A896] transition-colors shadow-lg">
                Browse Courses
              </button>
            </Link>
            <Link href="/blog">
              <button className="bg-card text-foreground border-2 border-border px-8 py-3 rounded-lg font-semibold hover:bg-background-inverse/10 transition-colors">
                Read Our Blog
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
