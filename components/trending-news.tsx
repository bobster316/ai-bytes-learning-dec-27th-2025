"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";

// Final interface for the News API (newsapi.org) structure
export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

// Final mock data - dynamically generated with today's date
const getTodayMockNews = (): NewsArticle[] => {
  const now = new Date();
  const hoursAgo = (hours: number) => {
    const date = new Date(now);
    date.setHours(date.getHours() - hours);
    return date.toISOString();
  };

  return [
    {
      source: { id: "techcrunch", name: "TechCrunch" },
      author: "Tech Reporter",
      title: "The Future of AI: What to Expect in the Next Decade",
      description: "Experts weigh in on the transformative potential of artificial intelligence and how it will reshape industries worldwide...",
      url: "https://example.com/future-of-ai",
      urlToImage: null,
      publishedAt: hoursAgo(2),
      content: "...",
    },
    {
      source: { id: null, name: "HealthAI News" },
      author: "Jane Doe",
      title: "How AI is Revolutionizing the Healthcare Industry",
      description: "AI-powered diagnostics and treatment plans are improving patient outcomes and accelerating medical research...",
      url: "https://example.com/ai-in-healthcare",
      urlToImage: null,
      publishedAt: hoursAgo(5),
      content: "...",
    },
    {
      source: { id: null, name: "AI Ethics Weekly" },
      author: "John Smith",
      title: "Ethical Considerations of Advanced AI Systems",
      description: "As AI becomes more powerful, it's crucial to address the ethical challenges and ensure responsible development...",
      url: "https://example.com/ai-ethics",
      urlToImage: null,
      publishedAt: hoursAgo(8),
      content: "...",
    },
    {
      source: { id: null, name: "Creative AI Hub" },
      author: "AI Insights",
      title: "The Rise of Generative AI in Creative Industries",
      description: "From art and music to writing and design, generative AI is unlocking new creative possibilities for artists and creators...",
      url: "https://example.com/generative-ai",
      urlToImage: null,
      publishedAt: hoursAgo(12),
      content: "...",
    },
  ];
};

const mockNewsArticles: NewsArticle[] = getTodayMockNews();

// Format date to human-readable format
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TrendingNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log("[TrendingNews] Fetching news from API...");
        const response = await fetch("/api/news");
        console.log("[TrendingNews] Response status:", response.status);
        if (!response.ok) throw new Error("API request failed");
        const data = await response.json();
        console.log("[TrendingNews] Received data:", data.length, "articles");
        if (data && data.length > 0) {
          setArticles(data);
          console.log("[TrendingNews] Set articles state with", data.length, "articles");
        } else {
          console.log("[TrendingNews] No data received, using mock articles");
          setArticles(mockNewsArticles);
        }
      } catch (err) {
        console.error("[TrendingNews] Failed to fetch news, using mock data:", err);
        setArticles(mockNewsArticles);
      } finally {
        setLoading(false);
        console.log("[TrendingNews] Loading complete");
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <section className="py-20 lg:py-32 bg-background w-full">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              Trending in <span className="text-[#2563EB]">AI</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-border rounded-t-xl"></div>
                <div className="p-4 border border-t-0 rounded-b-xl border-border">
                  <div className="h-4 bg-border rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-border rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-border rounded w-full"></div>
                  <div className="h-4 bg-border rounded w-5/6 mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  console.log("[TrendingNews] Rendering with", articles.length, "total articles, showing first 4");

  return (
    <section id="trending" className="mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl py-16 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-10 space-y-4">
          <Badge variant="secondary" className="mb-2">
            <Newspaper className="w-3 h-3 mr-1" />
            LATEST NEWS
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Trending in <span className="text-[#2563EB]">AI</span>
          </h2>
          <p className="text-base text-foreground/80 max-w-2xl mx-auto">
            Stay updated with the latest developments and breakthroughs in
            artificial intelligence
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {articles.slice(0, 4).map((article, index) => {
            console.log(`[TrendingNews] Rendering article ${index + 1}:`, article.title);

            // Different gradient styles for variety
            const gradients = [
              'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
              'bg-gradient-to-br from-[#16213e] via-[#0f3460] to-[#1a1a2e]',
              'bg-gradient-to-br from-[#0f3460] via-[#1a1a2e] to-[#16213e]',
              'bg-gradient-to-br from-[#1a1a2e] to-[#0f3460]',
            ];

            return (
              <Link
                key={article.url || index}
                href={`/news/${encodeURIComponent(
                  article.title
                )}?url=${encodeURIComponent(article.url)}&imageUrl=${encodeURIComponent(
                  article.urlToImage || ''
                )}&description=${encodeURIComponent(article.description || '')}&source=${encodeURIComponent(article.source?.name || 'AI News')}&date=${encodeURIComponent(article.publishedAt)}`}
                className="group block h-full"
              >
                <Card className="h-full flex flex-col bg-card border-border shadow-sm hover:shadow-lg hover:border-[#2563EB]/50 transition-all duration-300">
                  <div className="h-36 relative overflow-hidden rounded-t-xl bg-background-subtle">
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
                            parent.innerHTML = `<div class="h-full flex items-center justify-center ${gradients[index % gradients.length]}"><svg class="w-16 h-16 text-[#2563EB] opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg></div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className={`h-full flex items-center justify-center ${gradients[index % gradients.length]}`}>
                        <Newspaper className="w-12 h-12 text-[#2563EB]/40" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="flex-grow p-4 pb-2">
                    <div className="flex items-center gap-2 text-xs text-foreground/80 mb-2">
                      <span className="font-medium text-[#2563EB]">
                        {article.source?.name || "AI News"}
                      </span>
                      <span className="text-border">•</span>
                      <time
                        dateTime={article.publishedAt}
                        className="flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.publishedAt)}
                      </time>
                    </div>

                    <h3 className="text-sm font-semibold text-foreground leading-tight group-hover:text-[#2563EB] transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 flex flex-col justify-between flex-grow">
                    <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3 mb-3">
                      {article.description}
                    </p>

                    <div
                      className="inline-flex items-center gap-1 text-[#2563EB] hover:text-[#1D4ED8] font-medium text-xs transition-colors"
                    >
                      Read More
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/news">
            <Button variant="outline" size="lg">
              More News
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}