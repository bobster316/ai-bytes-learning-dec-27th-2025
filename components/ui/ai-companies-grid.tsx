"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";

const companies = [
    {
        name: "OpenAI",
        description: "GPT-4, ChatGPT",
        url: "https://openai.com",
        logo: "/companies/openai.png",
        color: "bg-green-100 dark:bg-green-900/20",
        borderColor: "hover:border-green-500/50"
    },
    {
        name: "Anthropic",
        description: "Claude, AI Safety",
        url: "https://anthropic.com",
        logo: "/companies/anthropic.png",
        color: "bg-orange-100 dark:bg-orange-900/20",
        borderColor: "hover:border-orange-500/50"
    },
    {
        name: "Google DeepMind",
        description: "Gemini, AlphaGo",
        url: "https://deepmind.google",
        logo: "/companies/deepmind.png",
        color: "bg-blue-100 dark:bg-blue-900/20",
        borderColor: "hover:border-blue-500/50"
    },
    {
        name: "Meta AI",
        description: "Llama, PyTorch",
        url: "https://ai.meta.com",
        logo: "/companies/meta.png",
        color: "bg-blue-100 dark:bg-blue-900/20",
        borderColor: "hover:border-blue-400/50"
    },
    {
        name: "Microsoft",
        description: "Copilot, Azure AI",
        url: "https://microsoft.com/ai",
        logo: "/companies/microsoft.png",
        color: "bg-cyan-100 dark:bg-cyan-900/20",
        borderColor: "hover:border-cyan-500/50"
    },
    {
        name: "NVIDIA",
        description: "H100, CUDA",
        url: "https://nvidia.com",
        logo: "/companies/nvidia.png",
        color: "bg-green-100 dark:bg-green-900/20",
        borderColor: "hover:border-green-500/50"
    },
    {
        name: "Amazon AWS",
        description: "AWS AI, Alexa",
        url: "https://aws.amazon.com/ai",
        logo: "/companies/amazon.png",
        color: "bg-yellow-100 dark:bg-yellow-900/20",
        borderColor: "hover:border-yellow-500/50"
    },
    {
        name: "Apple",
        description: "Apple Intelligence",
        url: "https://apple.com",
        logo: "/companies/apple.png",
        color: "bg-gray-100 dark:bg-gray-800",
        borderColor: "hover:border-gray-500/50"
    },
    {
        name: "Tesla",
        description: "FSD, Optimus",
        url: "https://tesla.com",
        logo: "/companies/tesla.png",
        color: "bg-red-100 dark:bg-red-900/20",
        borderColor: "hover:border-red-500/50"
    },
    {
        name: "xAI",
        description: "Grok Models",
        url: "https://x.ai",
        logo: "/companies/xai.png",
        color: "bg-slate-100 dark:bg-slate-800",
        borderColor: "hover:border-slate-500/50"
    },
    {
        name: "Baidu",
        description: "Ernie Bot",
        url: "https://research.baidu.com",
        logo: "/companies/baidu.png",
        color: "bg-blue-100 dark:bg-blue-900/20",
        borderColor: "hover:border-blue-600/50"
    },
    {
        name: "Alibaba Cloud",
        description: "Qwen Models",
        url: "https://www.alibabacloud.com",
        logo: "/companies/alibaba.png",
        color: "bg-orange-100 dark:bg-orange-900/20",
        borderColor: "hover:border-orange-500/50"
    },
    {
        name: "Mistral AI",
        description: "Open Models",
        url: "https://mistral.ai",
        logo: "/companies/mistral.png",
        color: "bg-purple-100 dark:bg-purple-900/20",
        borderColor: "hover:border-purple-500/50"
    },
    {
        name: "Cohere",
        description: "Enterprise AI",
        url: "https://cohere.com",
        logo: "/companies/cohere.png",
        color: "bg-teal-100 dark:bg-teal-900/20",
        borderColor: "hover:border-teal-500/50"
    },
    {
        name: "Stability AI",
        description: "Stable Diffusion",
        url: "https://stability.ai",
        logo: "/companies/stability.png",
        color: "bg-indigo-100 dark:bg-indigo-900/20",
        borderColor: "hover:border-indigo-500/50"
    },
    {
        name: "Hugging Face",
        description: "AI Model Hub",
        url: "https://huggingface.co",
        logo: "/companies/huggingface.png",
        color: "bg-yellow-100 dark:bg-yellow-900/20",
        borderColor: "hover:border-yellow-400/50"
    }
];

export function AICompaniesGrid() {
    return (
        <div className="space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {companies.map((company, index) => (
                    <a
                        key={index}
                        href={company.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block h-full"
                    >
                        <Card className={`h-full p-4 flex flex-col items-center text-center transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:shadow-xl group-hover:-translate-y-1 bg-white dark:bg-slate-900 ${company.borderColor} hover:border-opacity-100`}>

                            {/* Logo container */}
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${company.color} flex items-center justify-center mb-3 p-1.5 transition-transform duration-300 group-hover:scale-105`}>
                                <div className="relative w-full h-full">
                                    <Image
                                        src={company.logo}
                                        alt={`${company.name} logo`}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        unoptimized
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5 group-hover:text-primary transition-colors">
                                {company.name}
                            </h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                                {company.description}
                            </p>
                        </Card>
                    </a>
                ))}
            </div>

            {/* Footer Banner */}
            <div className="flex flex-col items-center justify-center gap-8 mt-16">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-400 text-sm font-medium">
                    <Zap className="w-4 h-4 fill-primary text-primary" />
                    <span>Constantly updated with the latest models and tools</span>
                </div>

                <a href="/paths" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-primary-foreground transition-all bg-primary rounded-full hover:bg-primary/90 hover:scale-105 shadow-xl shadow-primary/25">
                    EXPLORE PATHS
                </a>
            </div>
        </div>
    );
}
