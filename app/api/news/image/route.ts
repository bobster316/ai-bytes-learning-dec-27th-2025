import { NextRequest, NextResponse } from 'next/server';

// Whitelist of allowed news CDN domains
const ALLOWED_DOMAINS = [
  'platform.theverge.com',
  'cdn.vox-cdn.com',
  'i0.wp.com',
  'images.ctfassets.net',
  'www.artificialintelligence-news.com',
  'placehold.co',
  'techcrunch.com',
  'venturebeat.com',
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
