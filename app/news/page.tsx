import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { Header } from "@/components/header";

export const revalidate = 3600; // ISR regenerating the page max once per hour

export default async function NewsHub() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: articles, error } = await supabase
    .from("seo_news_articles")
    .select("title, slug, featured_image_url, published_at")
    .order("published_at", { ascending: false })
    .limit(50);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#080810] selection:bg-[#4b98ad]/30 pt-32 pb-32">
        <div className="mx-auto w-[88%] max-w-6xl px-6 lg:px-12">
          
          {/* Header */}
          <div className="mb-16">
          <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#4b98ad] mb-5 block">AI Bytes Learning</span>
          <h1 className="font-black text-white leading-tight mb-6" style={{ fontSize: "clamp(3rem, 6vw, 5rem)", letterSpacing: "-0.03em" }}>
            The Pulse.<br />
            <span className="text-white/30">Live Tech News.</span>
          </h1>
        </div>

        {/* Grid */}
        {(!articles || articles.length === 0) ? (
          <div className="py-20 text-center border border-white/10 rounded-3xl bg-white/[0.02]">
            <p className="text-white/40 font-mono tracking-widest uppercase">The news engine is warming up. Check back soon.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link 
                key={article.slug} 
                href={`/news/${article.slug}`}
                className="group flex flex-col bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] rounded-3xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#4b98ad]/10"
              >
                {article.featured_image_url ? (
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image 
                      src={article.featured_image_url} 
                      alt={article.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-transparent to-transparent opacity-80" />
                  </div>
                ) : (
                  <div className="relative h-56 w-full bg-[#111116] flex items-center justify-center">
                    <span className="text-[#4b98ad]/20 font-black text-6xl tracking-tighter">AI</span>
                  </div>
                )}
                
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-white/30 font-mono text-xs uppercase tracking-widest mb-4">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white/90 group-hover:text-white leading-snug mb-4">
                      {article.title}
                    </h2>
                  </div>
                  
                  <div className="mt-6 text-[#4b98ad] font-mono text-xs uppercase tracking-widest opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Read Story &rarr;
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
