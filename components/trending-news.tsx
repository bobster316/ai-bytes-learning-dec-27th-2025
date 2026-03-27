"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Newspaper, Sparkles, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface NewsArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

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
      description: "Experts weigh in on the transformative potential of artificial intelligence and how it will reshape industries worldwide.",
      url: "https://example.com/future-of-ai",
      urlToImage: null,
      publishedAt: hoursAgo(2),
      content: "...",
    },
    {
      source: { id: null, name: "HealthAI News" },
      author: "Jane Doe",
      title: "How AI is Revolutionising the Healthcare Industry",
      description: "AI-powered diagnostics and treatment plans are improving patient outcomes and accelerating medical research across the globe.",
      url: "https://example.com/ai-in-healthcare",
      urlToImage: null,
      publishedAt: hoursAgo(5),
      content: "...",
    },
    {
      source: { id: null, name: "AI Ethics Weekly" },
      author: "John Smith",
      title: "Ethical Considerations of Advanced AI Systems",
      description: "As AI becomes more powerful, addressing ethical challenges and ensuring responsible development has never been more critical.",
      url: "https://example.com/ai-ethics",
      urlToImage: null,
      publishedAt: hoursAgo(8),
      content: "...",
    },
    {
      source: { id: null, name: "Creative AI Hub" },
      author: "AI Insights",
      title: "The Rise of Generative AI in Creative Industries",
      description: "From art and music to writing and design, generative AI is unlocking new creative possibilities for artists and creators.",
      url: "https://example.com/generative-ai",
      urlToImage: null,
      publishedAt: hoursAgo(12),
      content: "...",
    },
    {
      source: { id: null, name: "MIT Technology Review" },
      author: "Staff Writer",
      title: "Large Language Models Are Changing How We Work",
      description: "New research shows that AI assistants are boosting productivity across knowledge-work sectors by up to 40% — but the skills gap is widening.",
      url: "https://example.com/llm-work",
      urlToImage: null,
      publishedAt: hoursAgo(18),
      content: "...",
    },
  ];
};

const mockNewsArticles: NewsArticle[] = getTodayMockNews();

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

function ArticleCard({ article, index, featured = false }: { article: NewsArticle; index: number; featured?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="h-full"
    >
      <Link
        href={`/news/${encodeURIComponent(article.title)}?url=${encodeURIComponent(article.url)}&imageUrl=${encodeURIComponent(article.urlToImage || '')}&description=${encodeURIComponent(article.description || '')}&source=${encodeURIComponent(article.source?.name || 'AI News')}&date=${encodeURIComponent(article.publishedAt)}`}
        className="group flex flex-col h-full rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden hover:bg-white/[0.07] hover:border-white/[0.14] transition-all duration-300"
      >
        {/* Image */}
        <div className={`relative overflow-hidden shrink-0 ${featured ? "aspect-[16/7]" : "aspect-[16/9]"}`}>
          {article.urlToImage ? (
            <img
              src={`/api/news/image?url=${encodeURIComponent(article.urlToImage)}`}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              onError={(e) => {
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) parent.innerHTML = `<div class="h-full flex items-center justify-center bg-white/[0.06]"><svg class="w-10 h-10 opacity-20" fill="none" stroke="white" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg></div>`;
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-white/[0.06]">
              <Newspaper className="w-10 h-10 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#4b98ad]">
              {article.source?.name || "AI News"}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="font-mono text-[11px] text-white/35">
              {formatDate(article.publishedAt)}
            </span>
          </div>

          <h3 className={`font-bold text-white leading-snug group-hover:text-[#4b98ad] transition-colors line-clamp-2 mb-3 ${featured ? "text-xl md:text-2xl" : "text-base md:text-lg"}`}>
            {article.title}
          </h3>

          <p className="text-sm text-white/45 leading-relaxed line-clamp-2 flex-1 mb-4">
            {article.description}
          </p>

          <div className="flex items-center gap-2 text-[12px] font-bold text-[#4b98ad] group-hover:gap-3 transition-all duration-300 mt-auto">
            Read story
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function TrendingNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  const TOP_STORIES = 5;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news");
        if (!response.ok) throw new Error("API request failed");
        const data = await response.json();
        setArticles(data && data.length > 0 ? data : mockNewsArticles);
      } catch {
        setArticles(mockNewsArticles);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <section className="w-full py-20 border-t border-white/[0.06]" style={{ background: "#080810" }}>
        <div className="mx-auto w-[88%] max-w-6xl px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`animate-pulse rounded-2xl bg-white/[0.04] overflow-hidden ${i === 0 ? "lg:col-span-2" : ""}`}>
                <div className="aspect-video bg-white/[0.06]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-white/[0.08] rounded w-1/3" />
                  <div className="h-5 bg-white/[0.08] rounded w-3/4" />
                  <div className="h-4 bg-white/[0.06] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const topStories = articles.slice(0, TOP_STORIES);
  const moreStories = articles.slice(TOP_STORIES);

  return (
    <section id="trending" className="w-full py-20 md:py-28 border-t border-white/[0.06]" style={{ background: "#080810" }}>
      <div className="mx-auto w-[88%] max-w-6xl px-6 lg:px-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#4b98ad] mb-4 block">
              Live Intelligence
            </span>
            <h2 className="font-black text-white tracking-tight leading-[0.92]"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", letterSpacing: "-0.03em" }}>
              Trending in <span className="text-[#4b98ad]">AI</span>
            </h2>
          </div>
          <Link href="/news" className="inline-flex items-center gap-2 font-mono text-[13px] text-white/35 uppercase tracking-widest hover:text-white/65 transition-colors group shrink-0">
            All news
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Always 5 top stories — featured layout */}
        {/* Row 1: featured (span-2) + 2 regular */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          {topStories[0] && (
            <div className="lg:col-span-2">
              <ArticleCard article={topStories[0]} index={0} featured />
            </div>
          )}
          {topStories[1] && <ArticleCard article={topStories[1]} index={1} />}
        </div>
        {/* Row 2: 3 regular */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topStories.slice(2, 5).map((article, i) => (
            <ArticleCard key={article.url || i} article={article} index={i + 2} />
          ))}
        </div>

        {/* More News — collapsible */}
        {moreStories.length > 0 && (
          <div className="mt-10">
            <button
              onClick={() => setShowMore(v => !v)}
              className="flex items-center gap-3 mx-auto px-7 py-3 rounded-full border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white font-mono text-[13px] uppercase tracking-widest transition-all duration-200"
            >
              {showMore ? "Hide" : `More News (${moreStories.length})`}
              {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                    {moreStories.map((article, i) => (
                      <ArticleCard key={article.url || i} article={article} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </section>
  );
}
