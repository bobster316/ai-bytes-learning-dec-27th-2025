"use client";

import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

interface FeaturePageLayoutProps {
    title: string;
    subtitle: string;
    heroImage?: string;
    content: string[]; // Array of paragraphs to ensure proper spacing
    images: {
        src: string;
        alt: string;
        caption?: string;
    }[];
}

export function FeaturePageLayout({
    title,
    subtitle,
    content,
    images,
}: FeaturePageLayoutProps) {
    // We'll distribute images throughout the text.
    // Assuming 900 words is roughly 15-20 paragraphs.
    // We can insert an image every ~5 paragraphs.

    const insertImageAt = (index: number) => {
        if (index === 4 && images[0]) return images[0];
        if (index === 10 && images[1]) return images[1];
        if (index === 16 && images[2]) return images[2];
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] font-sans">
            <Header />

            <main className="container mx-auto px-4 py-16 max-w-4xl">
                {/* Hero Section */}
                <div className="text-center mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
                        {title}
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                    <div className="h-1 w-32 bg-[#00d3f2] mx-auto rounded-full mt-8" />
                </div>

                {/* Main Content */}
                <article className="prose prose-lg dark:prose-invert max-w-none">
                    {content.map((paragraph, index) => {
                        const image = insertImageAt(index);
                        return (
                            <div key={index} className="mb-8">
                                <p className="text-justify leading-loose text-slate-700 dark:text-slate-300 text-lg mb-8">
                                    {paragraph}
                                </p>

                                {image && (
                                    <div className="my-12 relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-500">
                                        <Image
                                            src={image.src}
                                            alt={image.alt}
                                            fill
                                            className="object-cover"
                                        />
                                        {image.caption && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 text-white text-sm text-center">
                                                {image.caption}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Fallback if content is short, show remaining images at bottom */}
                    {content.length < 16 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                            {images.slice(content.length < 5 ? 0 : content.length < 11 ? 1 : 2).map((img, i) => (
                                <div key={i} className="relative w-full h-[300px] rounded-xl overflow-hidden shadow-lg">
                                    <Image src={img.src} alt={img.alt} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </main>

            <Footer />
        </div>
    );
}
