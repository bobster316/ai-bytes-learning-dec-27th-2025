-- Migration: 20260320120000_create_seo_news_articles.sql
-- Purpose: Schema for the automated AI News SEO strategy

CREATE TABLE IF NOT EXISTS public.seo_news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content_html TEXT NOT NULL,
    featured_image_url TEXT,
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.seo_news_articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the Next.js frontend to fetch news logic)
CREATE POLICY "Public Read Access" 
ON public.seo_news_articles 
FOR SELECT 
USING (true);

-- Allow authenticated/service role to insert and update (for the API Cron job)
CREATE POLICY "Service Role Insert Access" 
ON public.seo_news_articles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service Role Update Access" 
ON public.seo_news_articles 
FOR UPDATE 
USING (true);

-- Set up an index for faster lookups by slug (since the frontend uses the slug in the URL)
CREATE INDEX IF NOT EXISTS idx_seo_news_articles_slug ON public.seo_news_articles(slug);
-- Set up an index for sorting by publication date
CREATE INDEX IF NOT EXISTS idx_seo_news_articles_published_at ON public.seo_news_articles(published_at DESC);
