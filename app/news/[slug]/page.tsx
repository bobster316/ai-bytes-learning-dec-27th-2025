import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, ExternalLink } from "lucide-react";
import { Header } from "@/components/header";
import { Metadata } from 'next';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: article } = await supabase.from('seo_news_articles').select('title, content_html, featured_image_url').eq('slug', resolvedParams.slug).single();
  
  if (!article) return { title: 'Not Found' };
  
  return {
    title: `${article.title} | AI Bytes Learning`,
    openGraph: {
      images: article.featured_image_url ? [article.featured_image_url] : []
    }
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: article, error } = await supabase
    .from("seo_news_articles")
    .select("*")
    .eq("slug", resolvedParams.slug)
    .single();

  if (error || !article) {
    notFound();
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[var(--page-bg)] selection:bg-[#00FFB3]/30 pt-32 pb-32">
        <div className="mx-auto w-[88%] max-w-3xl px-6">
          
          {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 text-[#00FFB3] font-mono text-xs uppercase tracking-widest mb-6 border-b border-white/5 pb-6">
            <span className="px-3 py-1 bg-[#00FFB3]/10 rounded-full border border-[#00FFB3]/20">AI Update</span>
            <div className="flex items-center gap-2 text-white/30">
              <Clock className="w-3.5 h-3.5" />
              {new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          
          <h1 className="font-black text-white leading-tight mb-8" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em" }}>
            {article.title}
          </h1>

          {article.featured_image_url && (
            <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 mb-12">
              <Image 
                src={article.featured_image_url} 
                alt={article.title} 
                fill 
                className="object-cover"
                priority
              />
            </div>
          )}
        </header>

        {/* Content Body */}
        <article className="prose prose-invert prose-lg md:prose-xl max-w-none 
          prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white/90
          prose-p:text-white/70 prose-p:leading-relaxed
          prose-a:text-[#00FFB3] prose-a:no-underline hover:prose-a:underline
          prose-li:text-white/70 prose-ul:border-l-2 prose-ul:border-white/10 prose-ul:pl-6
          prose-strong:text-white/90 prose-strong:font-bold"
          dangerouslySetInnerHTML={{ __html: article.content_html }}
        />

        {/* Sources Footer */}
        {article.sources && article.sources.length > 0 && (
          <div className="mt-20 pt-10 border-t border-white/10">
            <h3 className="text-white/50 font-mono text-sm uppercase tracking-widest mb-6">Sources Investigated</h3>
            <ul className="space-y-3">
              {article.sources.map((source: string, idx: number) => (
                <li key={idx}>
                  <a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/40 hover:text-[#00FFB3] transition-colors break-all text-sm">
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    {source}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
    </>
  );
}
