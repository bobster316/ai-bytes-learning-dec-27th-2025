"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

// Expanded database of AI companies
const allCompanies = [
    // Pre-existing local logos
    { name: "OpenAI", url: "https://openai.com", logo: "/companies/openai.png" },
    { name: "Anthropic", url: "https://anthropic.com", logo: "/companies/anthropic.png" },
    { name: "Google DeepMind", url: "https://deepmind.google", logo: "/companies/deepmind.png" },
    { name: "Meta AI", url: "https://ai.meta.com", logo: "/companies/meta.png" },
    { name: "Microsoft", url: "https://microsoft.com/ai", logo: "/companies/microsoft.png" },
    { name: "NVIDIA", url: "https://nvidia.com", logo: "/companies/nvidia.png" },
    { name: "Amazon AWS", url: "https://aws.amazon.com/ai", logo: "/companies/amazon.png" },
    { name: "Apple", url: "https://apple.com", logo: "/companies/apple.png" },
    { name: "Tesla", url: "https://tesla.com", logo: "/companies/tesla.png" },
    { name: "xAI", url: "https://x.ai", logo: "/companies/xai.png" },
    { name: "Baidu", url: "https://research.baidu.com", logo: "/companies/baidu.png" },
    { name: "Alibaba Cloud", url: "https://www.alibabacloud.com", logo: "/companies/alibaba.png" },
    { name: "Mistral AI", url: "https://mistral.ai", logo: "/companies/mistral.png" },
    { name: "Cohere", url: "https://cohere.com", logo: "/companies/cohere.png" },
    { name: "Stability AI", url: "https://stability.ai", logo: "/companies/stability.png" },
    { name: "Hugging Face", url: "https://huggingface.co", logo: "/companies/huggingface.png" },
    
    // Additional companies via external logo service (using high-res favicons)
    { name: "Midjourney", url: "https://midjourney.com", logo: "https://www.google.com/s2/favicons?domain=midjourney.com&sz=128" },
    { name: "Perplexity", url: "https://perplexity.ai", logo: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=128" },
    { name: "Scale AI", url: "https://scale.com", logo: "https://www.google.com/s2/favicons?domain=scale.com&sz=128" },
    { name: "Databricks", url: "https://databricks.com", logo: "https://www.google.com/s2/favicons?domain=databricks.com&sz=128" },
    { name: "Runway", url: "https://runwayml.com", logo: "https://www.google.com/s2/favicons?domain=runwayml.com&sz=128" },
    { name: "ElevenLabs", url: "https://elevenlabs.io", logo: "https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=128" },
    { name: "Jasper", url: "https://jasper.ai", logo: "https://www.google.com/s2/favicons?domain=jasper.ai&sz=128" },
    { name: "Inflection", url: "https://inflection.ai", logo: "https://www.google.com/s2/favicons?domain=inflection.ai&sz=128" },
    { name: "AI21 Labs", url: "https://ai21.com", logo: "https://www.google.com/s2/favicons?domain=ai21.com&sz=128" },
    { name: "Adept", url: "https://adept.ai", logo: "https://www.google.com/s2/favicons?domain=adept.ai&sz=128" },
    { name: "Pinecone", url: "https://pinecone.io", logo: "https://www.google.com/s2/favicons?domain=pinecone.io&sz=128" },
    { name: "Weaviate", url: "https://weaviate.io", logo: "https://www.google.com/s2/favicons?domain=weaviate.io&sz=128" },
    { name: "Qdrant", url: "https://qdrant.tech", logo: "https://www.google.com/s2/favicons?domain=qdrant.tech&sz=128" },
    { name: "LangChain", url: "https://langchain.com", logo: "https://www.google.com/s2/favicons?domain=langchain.com&sz=128" },
    { name: "LlamaIndex", url: "https://llamaindex.ai", logo: "https://www.google.com/s2/favicons?domain=llamaindex.ai&sz=128" },
    { name: "Snorkel AI", url: "https://snorkel.ai", logo: "https://www.google.com/s2/favicons?domain=snorkel.ai&sz=128" },
    { name: "C3 AI", url: "https://c3.ai", logo: "https://www.google.com/s2/favicons?domain=c3.ai&sz=128" },
    { name: "Palantir", url: "https://palantir.com", logo: "https://www.google.com/s2/favicons?domain=palantir.com&sz=128" },
    { name: "Together AI", url: "https://together.ai", logo: "https://www.google.com/s2/favicons?domain=together.ai&sz=128" },
    { name: "Vercel", url: "https://vercel.com", logo: "https://www.google.com/s2/favicons?domain=vercel.com&sz=128" },
    { name: "Glean", url: "https://glean.com", logo: "https://www.google.com/s2/favicons?domain=glean.com&sz=128" },
    { name: "Descript", url: "https://descript.com", logo: "https://www.google.com/s2/favicons?domain=descript.com&sz=128" },
    { name: "Synthesia", url: "https://synthesia.io", logo: "https://www.google.com/s2/favicons?domain=synthesia.io&sz=128" },
    { name: "HeyGen", url: "https://heygen.com", logo: "https://www.google.com/s2/favicons?domain=heygen.com&sz=128" },
    { name: "Writer", url: "https://writer.com", logo: "https://www.google.com/s2/favicons?domain=writer.com&sz=128" },
    { name: "Replika", url: "https://replika.ai", logo: "https://www.google.com/s2/favicons?domain=replika.ai&sz=128" },
    { name: "Anyscale", url: "https://anyscale.com", logo: "https://www.google.com/s2/favicons?domain=anyscale.com&sz=128" },
    { name: "Weights & Biases", url: "https://wandb.ai", logo: "https://www.google.com/s2/favicons?domain=wandb.ai&sz=128" }
];

// Helper to reliably shuffle elements, acting as the randomization core
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function AICompaniesGrid() {
    // We will display 12 boxes by default in a balanced responsive grid
    const ITEMS_TO_DISPLAY = 12;
    const [displayedCompanies, setDisplayedCompanies] = useState<typeof allCompanies>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Initial random set
        setDisplayedCompanies(shuffleArray(allCompanies).slice(0, ITEMS_TO_DISPLAY));

        // Refresh logic: Every 60 seconds (60000ms), grab a new shuffled slice
        const interval = setInterval(() => {
            setDisplayedCompanies(shuffleArray(allCompanies).slice(0, ITEMS_TO_DISPLAY));
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    if (!isMounted || displayedCompanies.length === 0) {
        // Hydration placeholder - rendering blank skeleton squares
        return (
            <div className="space-y-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {Array(ITEMS_TO_DISPLAY).fill(0).map((_, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-white/[0.03] border border-white/[0.07] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <AnimatePresence mode="popLayout">
                    {displayedCompanies.map((company) => (
                        <motion.a
                            key={company.name} // The unique key forces Framer Motion to animate the swappy ins/outs
                            layout
                            initial={{ opacity: 0, scale: 0.8, rotateX: -30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, rotateX: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.8, rotateX: 30, filter: "blur(10px)" }}
                            transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
                            href={company.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block aspect-square"
                        >
                            <Card className="h-full flex flex-col items-center justify-center p-3 transition-all duration-500 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)] hover:shadow-[0_0_40px_rgba(75,152,173,0.15)] rounded-2xl overflow-hidden relative">
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mb-3 transition-transform duration-500 group-hover:scale-110">
                                    <div className="relative w-full h-full opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                        <Image
                                            src={company.logo}
                                            alt={`${company.name} logo`}
                                            fill
                                            className="object-contain" 
                                            unoptimized
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = `https://ui-avatars.com/api/?name=${company.name.charAt(0)}&background=ffffff&color=080810&size=128&font-size=0.6`;
                                            }}
                                        />
                                    </div>
                                </div>
                                <h3 className="text-[11px] md:text-xs font-semibold text-white/50 group-hover:text-white transition-colors text-center w-full px-1 truncate">
                                    {company.name}
                                </h3>
                            </Card>
                        </motion.a>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer Banner */}
            <div className="flex flex-col items-center justify-center gap-8 mt-16 pb-4">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-full text-white/45 text-sm font-medium">
                    <Zap className="w-4 h-4 text-[#00FFB3] animate-pulse" />
                    <span>Live database: Automatically rotating across 40+ industry tools</span>
                </div>
            </div>
        </div>
    );
}
