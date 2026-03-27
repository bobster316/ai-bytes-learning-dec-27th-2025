"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Clock, ArrowRight, ExternalLink, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// News article interface (matches /api/news response)
interface NewsArticle {
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

// Format date to human-readable format
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Estimate read time based on content length
function estimateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${minutes} min read`;
}

const ARTICLES_PER_PAGE = 12;

export default function BlogPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log("[Blog] Fetching news from API...");
        const response = await fetch("/api/news");

        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }

        const data = await response.json();
        console.log("[Blog] Received", data.length, "articles");
        setArticles(data);
      } catch (err) {
        console.error("[Blog] Error fetching news:", err);
        setError("Failed to load articles. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleLoadMore = () => {
    setLoadingMore(true);
    // Simulate a small delay for smooth UX
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + ARTICLES_PER_PAGE, articles.length));
      setLoadingMore(false);
    }, 300);
  };

  const visibleArticles = articles.slice(0, visibleCount);
  const hasMoreArticles = visibleCount < articles.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <Header />

      {/* Hero Section - Homepage Style */}
      <section className="relative mx-auto w-[95%] max-w-screen-2xl my-4 rounded-3xl border border-white/5 shadow-2xl py-16 flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-900 pointer-events-none rounded-3xl"></div>
        <div className="container relative z-10 mx-auto px-4 max-w-screen-2xl">
          <div className="text-center space-y-6">
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-primary/20 text-cyan-300 font-medium text-lg tracking-wide uppercase">
              LATEST UPDATES
            </span>
            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              AI Bytes Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">Blog</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Insights, tutorials, and the latest updates on artificial intelligence and machine learning.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-foreground/60">Loading latest AI news...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-screen-2xl mx-auto">
                {visibleArticles.map((article, index) => (
                  <a
                    href={article.url}
                    key={article.url || index}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Card className="h-full flex flex-col bg-card border-2 border-transparent hover:border-primary/50 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden rounded-2xl">
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        {article.urlToImage ? (
                          <img
                            src={`/api/news/image?url=${encodeURIComponent(article.urlToImage)}`}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = parent.querySelector('.fallback-bg');
                                if (fallback) {
                                  (fallback as HTMLElement).style.display = 'flex';
                                }
                              }
                            }}
                          />
                        ) : null}
                        {/* Fallback gradient background */}
                        <div
                          className={`fallback-bg absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-900 ${article.urlToImage ? 'hidden' : 'flex'} items-center justify-center`}
                        >
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-cyan-500/20 flex items-center justify-center">
                              <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-xs text-cyan-300/60 font-medium">{article.source.name}</span>
                          </div>
                        </div>
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-primary text-white border-none text-xs font-semibold px-3 py-1">
                            {article.source.name}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <CardHeader className="flex-grow">
                        <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                          {article.title}
                        </h2>
                        <p className="text-foreground/80 text-sm line-clamp-3">
                          {article.description}
                        </p>
                      </CardHeader>

                      {/* Footer */}
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-xs text-foreground/60 pt-4 border-t border-border">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(article.publishedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {estimateReadTime(article.content || article.description)}
                            </span>
                          </div>
                          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>

              {/* Load More Button */}
              {hasMoreArticles && (
                <div className="flex justify-center mt-12">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    size="lg"
                    className="h-14 px-10 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-full shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-105 font-semibold text-lg"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-5 h-5 mr-2" />
                        Load More Articles
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Articles count */}
              <p className="text-center mt-6 text-sm text-foreground/50">
                Showing {visibleArticles.length} of {articles.length} articles
              </p>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Want to Learn More?
          </h2>
          <p className="text-base text-foreground/80 mb-6 max-w-2xl mx-auto">
            Join our AI Bytes community and get access to exclusive courses, tutorials, and resources
          </p>
          <Link href="/courses">
            <Button className="h-12 px-8 bg-[#086c7f] hover:bg-[#065b6b] text-white text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-[#086c7f]/25 hover:-translate-y-1">
              Explore Courses <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

