import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadataBase = new URL(APP_URL);

export function absoluteUrl(path: string) {
  if (!path.startsWith("/")) return new URL(path, metadataBase).toString();
  return new URL(path, metadataBase).toString();
}

export function buildMetadata(params: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const { title, description, path, image, keywords, noIndex } = params;
  const url = path ? absoluteUrl(path) : metadataBase.toString();
  const images = image ? [absoluteUrl(image)] : undefined;

  return {
    title,
    description,
    metadataBase,
    alternates: path ? { canonical: url } : undefined,
    keywords,
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "AI Bytes Learning",
      images,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}
