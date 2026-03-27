"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Linkedin, Github, Instagram, Mail, Send } from "lucide-react";

export function Footer() {
    return (
        <footer className="relative w-full bg-[#080810] border-t border-white/[0.06]">

            {/* Subtle top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4b98ad]/30 to-transparent" />

            <div className="max-w-[1140px] mx-auto px-[4vw] pt-20 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">

                    {/* Brand */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link href="/" className="block hover:opacity-80 transition-opacity">
                            <div className="relative h-[48px] w-[150px]">
                                <Logo className="w-full h-full" />
                            </div>
                        </Link>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] font-mono text-[0.55rem] uppercase tracking-[0.18em] text-white/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB3] animate-pulse" />
                            UK-Based Organisation
                        </div>

                        <p className="font-body text-sm text-white/45 leading-relaxed max-w-sm">
                            We explain AI in plain English, breaking down complex topics into micro lessons anyone can understand. No tech background required.
                        </p>

                        <div className="flex gap-2.5">
                            {/* X */}
                            <a href="https://x.com/aibyteslearning" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-[#4b98ad]/15 hover:border-[#4b98ad]/30 transition-all duration-200 group">
                                <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-[#4b98ad] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            {/* LinkedIn */}
                            <a href="https://www.linkedin.com/company/ai-bytes-learning" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-[#4b98ad]/15 hover:border-[#4b98ad]/30 transition-all duration-200 group">
                                <Linkedin className="w-4 h-4 text-white/40 group-hover:text-[#4b98ad] transition-colors" />
                            </a>
                            {/* GitHub */}
                            <a href="https://github.com/aibyteslearning" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-[#4b98ad]/15 hover:border-[#4b98ad]/30 transition-all duration-200 group">
                                <Github className="w-4 h-4 text-white/40 group-hover:text-[#4b98ad] transition-colors" />
                            </a>
                            {/* Instagram */}
                            <a href="https://www.instagram.com/aibyteslearning" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-[#4b98ad]/15 hover:border-[#4b98ad]/30 transition-all duration-200 group">
                                <Instagram className="w-4 h-4 text-white/40 group-hover:text-[#4b98ad] transition-colors" />
                            </a>
                        </div>
                    </div>

                    {/* Platform links */}
                    <div className="lg:col-span-2">
                        <h4 className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40 mb-5">Platform</h4>
                        <ul className="space-y-3.5">
                            {[
                                { href: "/courses",    label: "Browse Courses" },
                                { href: "/paths",      label: "Learning Paths" },
                                { href: "/pricing",    label: "Pricing" },
                                { href: "/enterprise", label: "Enterprise" },
                            ].map(l => (
                                <li key={l.href}>
                                    <Link href={l.href} className="font-body text-sm text-white/50 hover:text-white transition-colors duration-200">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company links */}
                    <div className="lg:col-span-2">
                        <h4 className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40 mb-5">Company</h4>
                        <ul className="space-y-3.5">
                            {[
                                { href: "/about",   label: "About Us" },
                                { href: "/careers", label: "Careers" },
                                { href: "/blog",    label: "Blog" },
                                { href: "/contact", label: "Contact" },
                            ].map(l => (
                                <li key={l.href}>
                                    <Link href={l.href} className="font-body text-sm text-white/50 hover:text-white transition-colors duration-200">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-4">
                        <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.07]">
                            <h4 className="font-display font-bold text-white text-base mb-1.5 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[#4b98ad]" />
                                Stay Updated
                            </h4>
                            <p className="font-body text-sm text-white/40 mb-4 leading-relaxed">
                                Get the latest AI news and tutorials delivered to your inbox.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[#4b98ad]/40 transition-colors"
                                />
                                <button className="w-10 h-10 rounded-xl bg-[#4b98ad] hover:bg-[#4b98ad]/90 flex items-center justify-center shrink-0 transition-colors">
                                    <Send className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="font-mono text-[0.6rem] text-white/30 uppercase tracking-[0.1em]">
                        &copy; {new Date().getFullYear()} AI Bytes Learning. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        {[
                            { href: "/privacy", label: "Privacy Policy" },
                            { href: "/terms",   label: "Terms of Service" },
                            { href: "/cookies", label: "Cookie Policy" },
                        ].map(l => (
                            <Link key={l.href} href={l.href}
                                  className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-white/30 hover:text-white/60 transition-colors">
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
