"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Linkedin, Github, Mail, Send } from "lucide-react";

export function Footer() {
    return (
        <footer className="relative w-full bg-[var(--page-bg)] border-t border-[var(--page-border)]">

            {/* Subtle top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FFB3]/30 to-transparent" />

            <div className="max-w-[1140px] mx-auto px-[4vw] pt-20 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">

                    {/* Brand */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link href="/" className="block hover:opacity-80 transition-opacity">
                            <div className="relative h-[clamp(44px,5vw,64px)] w-[clamp(200px,22vw,300px)]">
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
                            {/* X / Twitter — brand: black */}
                            <a href="https://x.com/aibyteslearning" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white hover:border-white/60 transition-all duration-200 group cursor-pointer">
                                <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-black transition-colors duration-200" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            {/* LinkedIn — brand: #0A66C2 */}
                            <a href="https://www.linkedin.com/company/ai-bytes-learning" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-[#0A66C2] hover:border-[#0A66C2]/60 transition-all duration-200 group cursor-pointer">
                                <Linkedin className="w-4 h-4 text-white/40 group-hover:text-white transition-colors duration-200" />
                            </a>
                            {/* GitHub — brand: #1f2328 dark */}
                            <a href="https://github.com/aibyteslearning" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white hover:border-white/60 transition-all duration-200 group cursor-pointer">
                                <Github className="w-4 h-4 text-white/40 group-hover:text-[#1f2328] transition-colors duration-200" />
                            </a>
                            {/* Instagram — brand gradient */}
                            <a href="https://www.instagram.com/aibyteslearning" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:border-[#E1306C]/50 transition-all duration-200 group cursor-pointer"
                               onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"; e.currentTarget.style.borderColor = "transparent"; }}
                               onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.borderColor = ""; }}>
                                <svg className="w-4 h-4 text-white/40 group-hover:text-white transition-colors duration-200" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                                </svg>
                            </a>
                            {/* YouTube — brand: #FF0000 */}
                            <a href="https://www.youtube.com/@aibyteslearning" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-[#FF0000] hover:border-[#FF0000]/60 transition-all duration-200 group cursor-pointer">
                                <svg className="w-4 h-4 text-white/40 group-hover:text-white transition-colors duration-200" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </a>
                            {/* Discord — brand: #5865F2 */}
                            <a href="https://discord.gg/aibyteslearning" target="_blank" rel="noopener noreferrer"
                               className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-[#5865F2] hover:border-[#5865F2]/60 transition-all duration-200 group cursor-pointer">
                                <svg className="w-4 h-4 text-white/40 group-hover:text-white transition-colors duration-200" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
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
                                <Mail className="w-4 h-4 text-[#00FFB3]" />
                                Stay Updated
                            </h4>
                            <p className="font-body text-sm text-white/40 mb-4 leading-relaxed">
                                Get the latest AI news and tutorials delivered to your inbox.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[#00FFB3]/40 transition-colors"
                                />
                                <button className="w-10 h-10 rounded-xl bg-[#00FFB3] hover:bg-[#00FFB3]/90 flex items-center justify-center shrink-0 transition-colors">
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
