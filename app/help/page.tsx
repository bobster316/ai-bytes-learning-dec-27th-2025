import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, Book, User, CreditCard, MonitorPlay } from "lucide-react";
import Link from "next/link";

export default function HelpCenterPage() {
    const categories = [
        {
            title: "Getting Started",
            icon: <Book className="w-6 h-6 text-cyan-500" />,
            articles: ["Platform Overview", "How to Start Your First Course", "System Requirements"]
        },
        {
            title: "Account & Login",
            icon: <User className="w-6 h-6 text-purple-500" />,
            articles: ["Resetting Your Password", "Updating Profile Details", "Two-Factor Authentication"]
        },
        {
            title: "Billing & Subscriptions",
            icon: <CreditCard className="w-6 h-6 text-green-500" />,
            articles: ["Managing Your Subscription", "Payment Methods", "Refund Policy"]
        },
        {
            title: "Course Learning",
            icon: <MonitorPlay className="w-6 h-6 text-orange-500" />,
            articles: ["Navigating the Player", "Quizzes & Assessments", "Downloading Certificates"]
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)]">
            <Header />

            {/* Search Hero */}
            <div className="bg-slate-900 py-20 px-4 text-center">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">How can we help you?</h1>
                <div className="max-w-2xl mx-auto relative">
                    <Input
                        placeholder="Search for answers..."
                        className="h-14 pl-12 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                </div>
            </div>

            {/* Categories */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-2 gap-6">
                    {categories.map((cat, idx) => (
                        <Card key={idx} className="hover:border-cyan-500/50 transition-colors cursor-pointer group">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-cyan-500/10 transition-colors">
                                    {cat.icon}
                                </div>
                                <CardTitle className="text-xl">{cat.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {cat.articles.map((article, i) => {
                                        const slug = article.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                        return (
                                            <li key={i}>
                                                <Link
                                                    href={`/help/${slug}`}
                                                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-500 hover:underline block py-1"
                                                >
                                                    {article}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-slate-50 dark:bg-slate-900 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
                <p className="text-slate-500 mb-8">Our support team is just a message away.</p>
                <Link href="/contact">
                    <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Contact Support</Button>
                </Link>
            </div>
        </div>
    );
}
