import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'platform.theverge.com',
      },
      {
        protocol: 'https',
        hostname: 'www.theverge.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.vox-cdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.vox-cdn.com',
      },
      {
        protocol: 'https',
        hostname: 'i0.wp.com',
      },
      {
        protocol: 'https',
        hostname: '**.wp.com',
      },
      {
        protocol: 'https',
        hostname: 'techcrunch.com',
      },
      {
        protocol: 'https',
        hostname: '**.techcrunch.com',
      },
      {
        protocol: 'https',
        hostname: 'venturebeat.com',
      },
      {
        protocol: 'https',
        hostname: '**.venturebeat.com',
      },
      {
        protocol: 'https',
        hostname: '**.ctfassets.net',
      },
      {
        protocol: 'https',
        hostname: '**.artificialintelligence-news.com',
      },
      {
        protocol: 'https',
        hostname: '**.newsapi.org',
      },
      {
        protocol: 'https',
        hostname: '**.cnn.com',
      },
      {
        protocol: 'https',
        hostname: '**.bbc.com',
      },
      {
        protocol: 'https',
        hostname: '**.theguardian.com',
      },
      {
        protocol: 'https',
        hostname: '**.reuters.com',
      },
      {
        protocol: 'https',
        hostname: '**.wired.com',
      },
      {
        protocol: 'https',
        hostname: '**.zdnet.com',
      },
      {
        protocol: 'https',
        hostname: '**.arstechnica.com',
      },
      {
        protocol: 'https',
        hostname: '**.thenextweb.com',
      },
      {
        protocol: 'https',
        hostname: '**.mit.edu',
      },
    ],
    // Allow any HTTPS image as fallback
    unoptimized: false,
  },
};

export default nextConfig;
