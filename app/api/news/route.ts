import { NextResponse } from "next/server";
import Parser from "rss-parser";

let cachedData: any = null;
let cacheTime: number | null = null;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours cache

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded'],
      ['description', 'description']
    ]
  }
});

// AI News RSS Feeds (multiple sources for reliability)
const AI_RSS_FEEDS = [
  { url: 'https://www.artificialintelligence-news.com/feed/', name: 'AI News' },
  { url: 'https://venturebeat.com/category/ai/feed/', name: 'VentureBeat AI' },
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch AI' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', name: 'The Verge AI' },
];

// Decode HTML entities in URLs
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&#038;': '&',
    '&amp;': '&',
    '&#8216;': "'",
    '&#8217;': "'",
    '&quot;': '"',
    '&#34;': '"',
    '&lt;': '<',
    '&gt;': '>',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }
  return decoded;
}

// Extract image from RSS item
function getImageUrl(item: any): string | null {
  // Try enclosure - check MIME type or file extension
  if (item.enclosure?.url) {
    const url = item.enclosure.url;
    const hasImageType = item.enclosure.type?.startsWith('image/');
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);

    if (hasImageType || hasImageExtension) {
      const decoded = decodeHtmlEntities(url);
      // Only return if it's a valid HTTP(S) URL
      if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        return decoded;
      }
    }
  }

  // Handle media:content (rss-parser returns arrays)
  if (item['media:content']) {
    const mediaContent = Array.isArray(item['media:content'])
      ? item['media:content'][0]
      : item['media:content'];
    if (mediaContent?.$ && mediaContent.$.url) {
      const decoded = decodeHtmlEntities(mediaContent.$.url);
      if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        return decoded;
      }
    }
  }

  // Handle media:thumbnail (rss-parser returns arrays)
  if (item['media:thumbnail']) {
    const mediaThumbnail = Array.isArray(item['media:thumbnail'])
      ? item['media:thumbnail'][0]
      : item['media:thumbnail'];
    if (mediaThumbnail?.$ && mediaThumbnail.$.url) {
      const decoded = decodeHtmlEntities(mediaThumbnail.$.url);
      if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        return decoded;
      }
    }
  }

  // Look for images in content - try multiple fields
  const contentFields = [
    item.contentEncoded,
    item['content:encoded'],
    item.content,
    item.description,
    item.summary
  ];

  for (const content of contentFields) {
    if (content && typeof content === 'string') {
      // Try multiple image extraction patterns
      const patterns = [
        /<img[^>]+src=["']([^"'>]+)["']/i,
        /src=["']([^"'>]+\.(?:jpg|jpeg|png|gif|webp))["']/i,
        /https?:\/\/[^"\s]+\.(?:jpg|jpeg|png|gif|webp)/i
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          const decoded = decodeHtmlEntities(match[1]);
          if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
            return decoded;
          }
        } else if (match && match[0] && !match[1]) {
          const decoded = decodeHtmlEntities(match[0]);
          if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
            return decoded;
          }
        }
      }
    }
  }

  return null;
}

export async function GET() {
  // Return cached data if available and fresh
  if (cacheTime && Date.now() - cacheTime < CACHE_DURATION && cachedData && cachedData.length > 0) {
    console.log("Returning cached news data");
    return NextResponse.json(cachedData);
  }

  try {
    console.log("Fetching fresh news from RSS feeds");

    // Fetch all feeds in parallel with timeout
    const feedPromises = AI_RSS_FEEDS.map(async (feed) => {
      try {
        console.log(`Fetching from ${feed.name}...`);
        const parsed = await Promise.race([
          parser.parseURL(feed.url),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Feed timeout')), 10000)
          )
        ]);
        console.log(`Successfully fetched ${(parsed as any).items?.length || 0} items from ${feed.name}`);
        return (parsed as any).items.map((item: any) => ({
          ...item,
          sourceName: feed.name,
          sourceUrl: feed.url
        }));
      } catch (error) {
        console.error(`Failed to fetch ${feed.name}:`, error instanceof Error ? error.message : error);
        return [];
      }
    });

    const allFeeds = await Promise.all(feedPromises);
    const allArticles = allFeeds.flat();
    console.log(`Total articles fetched: ${allArticles.length}`);

    // Filter for recent articles (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentArticles = allArticles.filter(item => {
      const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : 0;
      return pubDate > sevenDaysAgo;
    });

    // Sort by date (newest first)
    recentArticles.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });

    // Map to NewsArticle format with image extraction
    const mappedArticles = recentArticles
      .slice(0, 30) // Process top 30
      .map((item: any, index: number) => {
        const description = item.contentSnippet || item.summary || item.description || "";
        // Truncate description to max 300 characters to prevent URL length issues
        const truncatedDescription = description.length > 300
          ? description.substring(0, 300).trim() + "..."
          : description;

        const imageUrl = getImageUrl(item);
        if (index < 3) {
          console.log(`[Article ${index + 1}] "${item.title}" - Image: ${imageUrl || 'NONE'}`);
        }

        return {
          source: {
            id: null,
            name: item.sourceName || "AI News"
          },
          author: item.creator || item.author || null,
          title: item.title || "Untitled",
          description: truncatedDescription,
          url: item.link || "",
          urlToImage: imageUrl,
          publishedAt: item.pubDate || new Date().toISOString(),
          content: item.content || item.contentSnippet || item.description || ""
        };
      });

    console.log(`Mapped ${mappedArticles.length} articles`);

    // Deduplicate articles by URL or title
    const seen = new Set<string>();
    const unique = mappedArticles.filter(article => {
      const key = article.url || article.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`After deduplication: ${unique.length} unique articles`);

    // Filter for articles with images only
    const finalArticles = unique
      .filter(article =>
        article.title &&
        article.description &&
        article.urlToImage // Only articles with images
      )
      .slice(0, 12); // Return top 12 articles

    console.log(`Found ${finalArticles.length} articles`);

    if (finalArticles.length === 0) {
      console.warn("No articles found, using fallback data");
      throw new Error("No articles found");
    }

    // Cache the results
    cachedData = finalArticles;
    cacheTime = Date.now();

    console.log(`Successfully cached ${finalArticles.length} articles. Cache valid until ${new Date(cacheTime + CACHE_DURATION).toISOString()}`);
    return NextResponse.json(cachedData);

  } catch (error) {
    console.error("RSS Feed error:", error);

    // Return stale cache if available
    if (cachedData && cachedData.length > 0) {
      console.log("Returning stale cached data due to error");
      return NextResponse.json(cachedData);
    }

    // Return mock data as last resort with placeholder images
    const mockData = [
      {
        source: { id: null, name: "AI News" },
        author: "AI Bytes Team",
        title: "Latest Developments in Generative AI",
        description: "Explore the cutting-edge advancements in generative AI models and their impact on creative industries.",
        url: "#",
        urlToImage: "https://placehold.co/600x400/0A1628/00BFA5?text=Generative+AI",
        publishedAt: new Date().toISOString(),
        content: "Generative AI continues to evolve, bringing new capabilities to artists, writers, and developers worldwide..."
      },
      {
        source: { id: null, name: "TechCrunch AI" },
        author: "AI Bytes Team",
        title: "Machine Learning Breakthroughs in Healthcare",
        description: "How AI-powered diagnostics are revolutionizing patient care and medical research.",
        url: "#",
        urlToImage: "https://placehold.co/600x400/0A1628/00BFA5?text=Healthcare+AI",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        content: "Machine learning algorithms are now capable of detecting diseases earlier and with greater accuracy..."
      },
      {
        source: { id: null, name: "VentureBeat AI" },
        author: "AI Bytes Team",
        title: "The Future of AI Ethics and Governance",
        description: "Examining the critical importance of responsible AI development and ethical frameworks.",
        url: "#",
        urlToImage: "https://placehold.co/600x400/0A1628/00BFA5?text=AI+Ethics",
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        content: "As AI systems become more powerful, the need for robust ethical guidelines and governance frameworks grows..."
      },
      {
        source: { id: null, name: "The Verge AI" },
        author: "AI Bytes Team",
        title: "Natural Language Processing: The Next Frontier",
        description: "Discover how NLP models are transforming human-computer interaction and communication.",
        url: "#",
        urlToImage: "https://placehold.co/600x400/0A1628/00BFA5?text=NLP+AI",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        content: "Natural language processing has reached new heights, enabling more natural and intuitive interactions..."
      }
    ];

    return NextResponse.json(mockData);
  }
}
