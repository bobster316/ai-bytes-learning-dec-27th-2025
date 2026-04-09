import { NextRequest, NextResponse } from 'next/server';

// Whitelist of allowed news CDN domains
const ALLOWED_DOMAINS = [
  // Vox / The Verge
  'platform.theverge.com',
  'cdn.vox-cdn.com',
  'duet-cdn.vox-cdn.com',
  // WordPress CDNs
  'i0.wp.com',
  'i1.wp.com',
  'i2.wp.com',
  'wp.com',
  // Contentful CDN (VentureBeat + others)
  'images.ctfassets.net',
  // AI News
  'www.artificialintelligence-news.com',
  'artificialintelligence-news.com',
  // TechCrunch / Verizon
  'techcrunch.com',
  's.yimg.com',
  // VentureBeat
  'venturebeat.com',
  // Stock / embed
  'images.unsplash.com',
  'miro.medium.com',
  'placehold.co',
  // Unite AI
  'unite.ai',
  'www.unite.ai',
  // Wired / Condé Nast
  'media.wired.com',
  'assets.wired.com',
  // NYT
  'static01.nyt.com',
  // Ars Technica
  'cdn.arstechnica.net',
  'arstechnica.com',
  'www.arstechnica.com',
  // ZDNet
  'zdnet.com',
  'www.zdnet.com',
  // MIT Tech Review
  'technologyreview.com',
  'www.technologyreview.com',
  'wp.technologyreview.com',
  // Google / OpenAI
  'blogger.googleusercontent.com',
  'storage.googleapis.com',
  'lh3.googleusercontent.com',
  'openai.com',
  'images.openai.com',
  'cdn.openai.com',
  // YouTube thumbnails
  'img.youtube.com',
  'i.ytimg.com',
  // Forbes
  'imageio.forbes.com',
  'specials-images.forbesimg.com',
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    // Validate the URL is from an allowed domain
    const url = new URL(imageUrl);
    const isAllowed = ALLOWED_DOMAINS.some(domain =>
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      console.warn(`Blocked image from unauthorized domain: ${url.hostname}`);
      return new NextResponse('Domain not allowed', { status: 403 });
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Bytes-News/1.0)',
      },
    });

    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageResponse.status}`);
      return new NextResponse('Failed to fetch image', { status: imageResponse.status });
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
