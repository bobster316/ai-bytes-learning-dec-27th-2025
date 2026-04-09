"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ThumbsUp, ThumbsDown, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

// Mock Database of Articles
const articleDatabase: Record<string, { title: string; category: string; content: React.ReactNode }> = {
    "platform-overview": {
        title: "Platform Overview",
        category: "Getting Started",
        content: (
            <div className="space-y-4">
                <p>Welcome to AI Bytes Learning! We are dedicated to making Artificial Intelligence education accessible, practical, and engaging for everyone.</p>
                <h3 className="text-xl font-semibold mt-4">What is a Byte?</h3>
                <p>A "Byte" is our signature learning unit. Unlike traditional long-form courses, a Byte is designed to be completed as a focused micro-course. It contains:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Video Lessons:</strong> High-quality, concise explainer videos.</li>
                    <li><strong>Interactive Quizzes:</strong> Check your understanding in real-time.</li>
                    <li><strong>AI Companion:</strong> Chat with our AI tutor to clarify doubts instantly.</li>
                    <li><strong>Hands-on Project:</strong> A practical task to apply what you've learned.</li>
                </ul>
                <h3 className="text-xl font-semibold mt-4">Navigating the Dashboard</h3>
                <p>Your dashboard is your central hub. From here, you can track your progress, see your active courses, and view your earned certificates.</p>
            </div>
        )
    },
    "how-to-start-your-first-course": {
        title: "How to Start Your First Course",
        category: "Getting Started",
        content: (
            <div className="space-y-4">
                <p>Ready to start learning? Follow these simple steps to begin your first AI journey.</p>
                <ol className="list-decimal pl-6 space-y-2">
                    <li><strong>Browse the Catalog:</strong> content of list item 1Click on "Courses" in the top navigation bar.</li>
                    <li><strong>Select a Topic:</strong> Use the filters to find a topic that interests you (e.g., "ChatGPT", "Python").</li>
                    <li><strong>Enroll:</strong> Click the "Start Learning" button. If you're on a Free plan, you can start immediately.</li>
                    <li><strong>Begin Lesson 1:</strong> The video player will load automatically. Good luck!</li>
                </ol>
            </div>
        )
    },
    "payment-methods": {
        title: "Payment Methods",
        category: "Billing & Subscriptions",
        content: (
            <div className="space-y-4">
                <p>We accept a variety of secure payment methods to make your subscription easy.</p>
                <h3 className="text-xl font-semibold mt-4">Accepted Cards</h3>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Visa</li>
                    <li>Mastercard</li>
                    <li>American Express</li>
                    <li>Discover</li>
                </ul>
                <p className="mt-4">We also accept <strong>PayPal</strong> for all recurring subscriptions.</p>
            </div>
        )
    }
};

export default function ArticlePage() {
    const params = useParams();
    const slug = params.slug as string;

    // Handle case where slug might be undefined initially
    if (!slug) return <div>Loading...</div>;

    const article = articleDatabase[slug] || {
        title: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        category: "General Help",
        content: (
            <div className="space-y-4">
                <p className="text-slate-500 italic">This article is currently being updated. Please check back later.</p>
                <p>In the meantime, you can contact our support team for assistance with this topic.</p>
            </div>
        )
    };

    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)]">
            <Header />

            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <Link href="/help" className="inline-flex items-center text-sm text-slate-500 hover:text-cyan-500 mb-8 transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Help Centre
                </Link>

                <div className="grid md:grid-cols-[1fr_250px] gap-12">
                    {/* Main Article Content */}
                    <article>
                        <div className="flex items-center gap-3 text-sm text-cyan-600 font-medium mb-4">
                            <span>{article.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-400 font-normal">
                                <Clock className="w-3 h-3" /> 2 min read
                            </span>
                        </div>

                        <h1 className="text-4xl font-bold mb-8">{article.title}</h1>

                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            {article.content}
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="font-semibold mb-4">Was this article helpful?</h4>
                            <div className="flex gap-4">
                                <Button variant="outline" className="gap-2">
                                    <ThumbsUp className="w-4 h-4" /> Yes
                                </Button>
                                <Button variant="outline" className="gap-2">
                                    <ThumbsDown className="w-4 h-4" /> No
                                </Button>
                            </div>
                        </div>
                    </article>

                    {/* Sidebar */}
                    <aside className="hidden md:block space-y-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-500">Related Topics</h4>
                            <ul className="space-y-3 text-sm">
                                <li><Link href="/help/platform-overview" className="hover:text-cyan-500">Platform Overview</Link></li>
                                <li><Link href="/help/system-requirements" className="hover:text-cyan-500">System Requirements</Link></li>
                                <li><Link href="/contact" className="hover:text-cyan-500">Contact Support</Link></li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
