"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Calendar, Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";

function NewsArticleContent() {
  const [article, setArticle] = useState<{
    title: string;
    articleBody: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const url = searchParams.get("url");
  const imageUrl = searchParams.get("imageUrl");
  const rssDescription = searchParams.get("description");
  const rssSource = searchParams.get("source");
  const rssDate = searchParams.get("date");

  // Extract source domain from URL - safely handle invalid URLs
  let sourceDomain: string | null = null;
  if (url) {
    try {
      sourceDomain = new URL(url).hostname.replace('www.', '');
    } catch (error) {
      console.error('Invalid URL:', url);
    }
  }

  useEffect(() => {
    if (url) {
      const fetchArticle = async () => {
        setLoading(true);
        try {
          const response = await fetch("/api/scrape", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, imageUrl }),
          });
          if (!response.ok) throw new Error("Failed to fetch article content");
          const data = await response.json();
          setArticle(data);
        } catch (err) {
          // Fallback to RSS description if scraping fails
          if (rssDescription) {
            const titleFromUrl = decodeURIComponent(window.location.pathname.split('/').pop() || '');
            setArticle({
              title: titleFromUrl,
              articleBody: `
                <div class="rss-content">
                  <p class="lead">${rssDescription}</p>
                  <div class="read-more-notice" style="margin-top: 2rem; padding: 1.5rem; background: rgba(0, 191, 165, 0.1); border-left: 4px solid #00BFA5; border-radius: 0.5rem;">
                    <p style="margin: 0;"><strong>Preview Only:</strong> This is a brief excerpt from the RSS feed. Click the button below to read the full article on ${rssSource || sourceDomain || 'the source website'}.</p>
                  </div>
                </div>
              `
            });
          } else {
            setError("Failed to load article. Please try again later.");
          }
        } finally {
          setLoading(false);
        }
      };

      fetchArticle();
    } else {
      setError("Article URL not found.");
      setLoading(false);
    }
  }, [url, rssDescription, rssSource, sourceDomain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-card to-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-6 bg-border rounded w-24 mb-8"></div>
            <div className="h-12 bg-border rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-border rounded w-1/2 mb-8"></div>
            <div className="h-96 bg-border rounded-xl mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-border rounded w-full"></div>
              <div className="h-4 bg-border rounded w-full"></div>
              <div className="h-4 bg-border rounded w-5/6"></div>
              <div className="h-4 bg-border rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-card to-background">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Link
            href="/#trending"
            className="inline-flex items-center gap-2 text-foreground/80 hover:text-[#00BFA5] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Trending News
          </Link>

          <div className="bg-card rounded-2xl shadow-lg p-12 text-center border border-border">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExternalLink className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Unable to Load Article</h1>
            <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
              We couldn't automatically load the content from the source website.
              You can read the original article by clicking the link below.
            </p>
            <a
              href={url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white bg-[#00BFA5] hover:bg-[#00A896] font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Read Original Article
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-card to-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back button */}
        <Link
          href="/#trending"
          className="inline-flex items-center gap-2 text-foreground/80 hover:text-[#00BFA5] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trending News
        </Link>

        <article className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border">
          {/* Article Header */}
          <div className="p-8 md:p-12 border-b border-border">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {article?.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/80">
              {sourceDomain && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#00BFA5]" />
                  <span className="font-medium">{sourceDomain}</span>
                </div>
              )}
            </div>
          </div>

          {/* Featured Image */}
          {imageUrl && (
            <div className="relative aspect-video overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt={article?.title || "Article image"}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="p-8 md:p-12">
            <div
              className="prose prose-lg max-w-none
                prose-headings:text-foreground prose-headings:font-bold
                prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-[#00BFA5] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:my-6 prose-ol:my-6
                prose-li:text-foreground/80 prose-li:my-2
                prose-img:rounded-lg prose-img:shadow-md
                prose-blockquote:border-l-4 prose-blockquote:border-[#00BFA5]
                prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-foreground/80
                dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: article?.articleBody || "" }}
            />
          </div>

          {/* Footer with external link */}
          <div className="p-8 md:p-12 bg-muted border-t border-border">
            <div className="flex items-start gap-4 p-6 bg-card border-l-4 border-[#00BFA5] rounded-lg">
              <ExternalLink className="w-5 h-5 text-[#00BFA5] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Read the Original Article</h3>
                <p className="text-sm text-foreground/80 mb-3">
                  This article was originally published on {sourceDomain}
                </p>
                <a
                  href={url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#00BFA5] hover:text-[#00A896] font-medium transition-colors"
                >
                  View on {sourceDomain}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function NewsArticlePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewsArticleContent />
    </Suspense>
  );
}
