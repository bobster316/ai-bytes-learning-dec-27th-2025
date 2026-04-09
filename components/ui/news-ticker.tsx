"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Newspaper } from "lucide-react";

export function NewsTicker() {
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data } = await supabase
        .from("seo_news_articles")
        .select("title, slug, published_at, featured_image_url")
        .order("published_at", { ascending: false })
        .limit(6);

      if (data) {
        setArticles(data);
      }
    };
    fetchNews();
  }, []);

  if (articles.length === 0) return null;

  return (
    <section className="py-20 border-b border-[var(--page-border)] bg-[var(--page-bg)] relative overflow-hidden">
      {/* Subtle top gradient */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00FFB3]/20 to-transparent" />
      
      <div className="mx-auto w-[88%] max-w-6xl px-6 lg:px-12">
        
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00FFB3]/10 rounded-full border border-[#00FFB3]/20 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFB3] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FFB3]"></span>
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#00FFB3]">Live Autoblog</span>
            </div>
            <h2
              className="font-black text-white leading-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}
            >
              The Pulse.<br />
              <span className="text-white/30">AI Industry News.</span>
            </h2>
          </div>
          
          <Link
            href="/news"
            className="inline-flex items-center gap-2 font-mono text-[13px] text-white/40 uppercase tracking-widest hover:text-[#00FFB3] hover:gap-3 transition-all group"
          >
            Read all news
            <ArrowRight className="w-3.5 h-3.5 transition-transform" />
          </Link>
        </div>

        <div className={`grid gap-6 ${
          articles.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
          articles.length === 2 ? 'md:grid-cols-2' :
          articles.length <= 3 ? 'md:grid-cols-3' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/news/${article.slug}`}
              className="group flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-[#00FFB3]/30 transition-all duration-300 overflow-hidden"
            >
              {/* Featured image */}
              <div className="relative h-48 w-full overflow-hidden">
                {article.featured_image_url ? (
                  <Image
                    src={article.featured_image_url}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-[#111116] flex items-center justify-center">
                    <Newspaper className="w-10 h-10 text-[#00FFB3]/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-transparent to-transparent opacity-70" />
              </div>

              {/* Text content */}
              <div className="flex flex-col justify-between p-6 flex-1">
                <div>
                  <div className="flex items-center gap-2 text-white/30 font-mono text-[10px] md:text-xs uppercase tracking-widest mb-3">
                    <Newspaper className="w-3.5 h-3.5 text-[#00FFB3]/70" />
                    {new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white/80 group-hover:text-white leading-snug">
                    {article.title}
                  </h3>
                </div>
                
                <div className="mt-6 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-[#00FFB3] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  Explore Story <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
