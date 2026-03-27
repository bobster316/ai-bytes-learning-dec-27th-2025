import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// This forces the route to be dynamically evaluated allowing cron fetching
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60s for API fetching

// ── RSS Sources (Source Monitoring Playbook) ──────────────────────────────────
// Based on the AI Pulse Source Monitoring Playbook (Tier 1 to 3 feeds).
const RSS_SOURCES = [
  // TIER 1: Primary Sources (Ground Zero)
  'https://openai.com/news/rss.xml',
  'https://arxiv.org/rss/cs.AI',
  
  // TIER 2: Community Amplification (Validation)
  // Filtering for high-signal AI posts on Hacker News (>100 points)
  'https://hnrss.org/newest?q=AI+OR+OpenAI+OR+Anthropic+OR+LLM+OR+Gemini+OR+Llama&points=100',
  
  // TIER 3: Professional Tech Journalism (Same-Day Coverage)
  'https://feeds.feedburner.com/TechCrunch/artificial-intelligence',
  'https://venturebeat.com/category/ai/feed/'
];

// ── AI Frontier Newsletter Style Guide ────────────────────────────────────────
// Based on the public description: "witty, informative newsletter featuring curated
// AI news, the latest innovations and learning resources" (Steve Nouri, AI Frontier).
const SYSTEM_PROMPT = `You are the lead AI journalist and editor for "AI Bytes Learning," writing content for "The Pulse" — the platform's daily AI news feed.

Your editorial voice is directly inspired by the AI Frontier newsletter style:
- **Witty**: Use dry humour and sharp observations. Never dull. Never corporate.
- **Informative**: Every sentence must teach something. No fluff, no padding.
- **Practical**: Always answer "what does this mean for ME?" for the everyday reader.
- **Learning-forward**: Tie every story back to AI literacy, skill-building, or how to use AI better.
- **Conversational**: Write like a smart friend explaining over coffee, not a press release.

You are given a JSON array of AI news headlines scraped today from a multi-tier supply chain:
- **TIER 1 (Primary)**: Company blogs and papers (OpenAI, arXiv). Ground-zero news.
- **TIER 2 (Community)**: Hacker News. Validates what builders actually care about.
- **TIER 3 (Journalism)**: TechCrunch, VentureBeat. Adds context and analysis.

Select the SINGLE most impactful story based on this tiered priority. Favour genuine breakthroughs from Tier 1, highly validated stories from Tier 2, or major industry shifts from Tier 3.

AVOID: vague corporate announcements, stock movements, partnership press releases with no substance.

You MUST output ONLY a pure JSON object with exactly these keys:
- "title": A sharp, curiosity-driving headline (max 65 chars). Avoid clickbait. Make it specific.
- "slug": A URL-friendly slug, lowercase, dashes only (e.g., "openai-gpt5-what-it-means-for-you").
- "content_html": Clean HTML string. Rules: 
    - Open with a bold 1-sentence "why this matters" hook inside a <p> tag.
    - Use <h2> for 2-3 subheadings that guide the reader through the story.
    - Use short <p> paragraphs (2-3 sentences max each).
    - Include a "What This Means for Learners" <h2> section connecting the story to AI skills.
    - End with a <h2>Sources</h2> and a <ul> of <li><a href="..."> links to original articles.
    - No inline CSS. No wrapper divs.
- "search_term_for_image": 1-2 generic words for an Unsplash image search (e.g. "neural network", "robot", "data center"). No brand names.`;

export async function GET(request: Request) {
  // 1. Authenticate check (optional cron secret against unauthorized invocations)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Fetch from multiple RSS sources in parallel
    const parser = new Parser();
    const feedResults = await Promise.allSettled(
      RSS_SOURCES.map(url => parser.parseURL(url))
    );

    // Merge all articles, deduplicate by title
    const allArticles: any[] = [];
    const seenTitles = new Set<string>();
    for (const result of feedResults) {
      if (result.status === 'fulfilled') {
        for (const item of result.value.items.slice(0, 8)) {
          const title = item.title?.trim() || '';
          if (title && !seenTitles.has(title)) {
            seenTitles.add(title);
            allArticles.push({
              title,
              link: item.link,
              snippet: item.contentSnippet || item.content || '',
              date: item.pubDate,
            });
          }
        }
      }
    }

    // Take up to 15 articles as the full context pool
    const articlePool = allArticles.slice(0, 15);

    if (articlePool.length === 0) {
      return NextResponse.json({ error: 'No recent news found' }, { status: 404 });
    }

    // 3. Initialize clients
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Generate 3 distinct articles in parallel
    // Each call gets a different slice of articles and a unique angle instruction
    // so Claude picks 3 different stories from the pool.
    const angles = [
      'Focus on the most impactful BREAKTHROUGH or new model release.',
      'Focus on a PRACTICAL TOOL or productivity use-case people can try today.',
      'Focus on a BUSINESS IMPACT, ethics, regulation, or industry-shift story.',
    ];

    async function generateOneArticle(contextArticles: any[], angle: string, index: number) {
      const promptContext = JSON.stringify(contextArticles, null, 2);
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 3000,
        temperature: 0.5 + index * 0.05, // slight variation per call for diversity
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Here are today's AI news headlines:\n\n${promptContext}\n\nYour angle for this article: ${angle}\n\nGenerate the JSON article payload now.`
          }
        ]
      });

      const aiResponseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const firstBrace = aiResponseText.indexOf('{');
      const lastBrace = aiResponseText.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) throw new Error('Claude did not return valid JSON.');
      return JSON.parse(aiResponseText.substring(firstBrace, lastBrace + 1));
    }

    const articleResults = await Promise.allSettled(
      angles.map((angle, i) => generateOneArticle(articlePool, angle, i))
    );

    // 5. For each successful article, fetch image and save to DB
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    const savedArticles: any[] = [];
    const errors: any[] = [];

    await Promise.allSettled(
      articleResults.map(async (result, i) => {
        if (result.status === 'rejected') {
          errors.push(`Article ${i + 1} generation failed: ${result.reason}`);
          return;
        }

        const articleData = result.value;

        // Fetch Unsplash image
        let imageUrl = null;
        try {
          if (process.env.UNSPLASH_ACCESS_KEY) {
            const imageRes = await fetch(
              `https://api.unsplash.com/photos/random?query=${encodeURIComponent(articleData.search_term_for_image)}&orientation=landscape&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
            );
            const imageData = await imageRes.json();
            imageUrl = imageData.urls?.regular || null;
          }
        } catch { /* proceed without image */ }

        // Build unique slug: base-slug + timestamp + index
        const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${i}`;
        const uniqueSlug = `${articleData.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '')}-${timestamp}`;

        const { data: insertedData, error: dbError } = await supabase
          .from('seo_news_articles')
          .insert({
            title: articleData.title,
            slug: uniqueSlug,
            content_html: articleData.content_html,
            featured_image_url: imageUrl,
            sources: articlePool.map(a => a.link),
          })
          .select()
          .single();

        if (dbError) {
          errors.push(`DB insert failed for article ${i + 1}: ${dbError.message}`);
        } else {
          savedArticles.push(insertedData);
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: `${savedArticles.length} AI Frontier-style articles published to The Pulse!`,
      articlesPublished: savedArticles.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Auto-blog generator failed:', error);
    return NextResponse.json({ error: 'Failed to generate news', details: error.message }, { status: 500 });
  }
}
