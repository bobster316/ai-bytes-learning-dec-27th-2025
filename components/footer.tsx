import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Twitter, Linkedin, Github, Instagram, Mail, Send } from "lucide-react";

export function Footer() {
    return (
        <footer className="relative w-full mt-10 bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
            {/* ... background elements ... */}
            <div className="absolute inset-x-0 bottom-0 top-20 bg-white dark:bg-[#0B1120] rounded-t-[2.5rem] overflow-hidden -z-10 shadow-2xl border-t border-slate-200 dark:border-white/5 mx-auto w-[98%] max-w-[1400px] pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                {/* subtle glow - dark mode only or adjusted for light */}
                <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 dark:bg-primary/10 blur-[100px] rounded-full opacity-50 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
            </div>

            <div className="container mx-auto px-6 lg:px-12 pt-40 pb-12 max-w-7xl relative z-10 text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">

                    {/* Brand Column */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Logo - Clickable, links to homepage */}
                        <Link href="/" className="relative h-[4.6rem] w-56 md:h-[5.75rem] md:w-64 overflow-hidden transition-all duration-300 flex items-center hover:opacity-80">
                            <Logo className="w-full h-full scale-[2.1] origin-left" />
                        </Link>
                        <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed max-w-sm font-medium">
                            Democratizing AI education for everyone. Master complex topics in 60-minute byte-sized lessons designed for all ages and backgrounds.
                        </p>
                        <div className="flex gap-3">
                            {/* Socials */}
                            {[
                                { icon: Twitter, href: "#" },
                                { icon: Linkedin, href: "#" },
                                { icon: Github, href: "#" },
                                { icon: Instagram, href: "#" }
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300 group shadow-md"
                                >
                                    <social.icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-white transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 text-lg tracking-tight">Platform</h4>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link href="/courses" className="text-slate-600 dark:text-slate-400 hover:text-primary hover:pl-2 transition-all duration-300 block">Browse Courses</Link></li>
                            <li><Link href="/paths" className="text-slate-600 dark:text-slate-400 hover:text-primary hover:pl-2 transition-all duration-300 block">Learning Paths</Link></li>
                            <li><Link href="/pricing" className="text-slate-600 dark:text-slate-400 hover:text-primary hover:pl-2 transition-all duration-300 block">Pricing</Link></li>
                            <li><Link href="/enterprise" className="text-slate-600 dark:text-slate-400 hover:text-primary hover:pl-2 transition-all duration-300 block">Enterprise</Link></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 text-lg tracking-tight">Company</h4>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link href="/about" className="text-slate-600 dark:text-slate-400 hover:text-primary hover:pl-2 transition-all duration-300 block">About Us</Link></li>
                            <li><Link href="/careers" className="text-slate-600 dark:text-slate-400 hover:text-primary hover:pl-2 transition-all duration-300 block">Careers</Link></li>
                            <li><Link href="/blog" className="text-slate-600 dark:text-slate-400 hover:text-primary hover:pl-2 transition-all duration-300 block">Blog</Link></li>
                            <li><Link href="/contact" className="text-slate-600 dark:text-slate-400 hover:text-primary hover:pl-2 transition-all duration-300 block">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-slate-100 dark:bg-white/5 rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-xl backdrop-blur-sm">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-lg flex items-center gap-2">
                                <Mail className="w-5 h-5 text-primary" />
                                Stay Updated
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Get the latest AI news and tutorials delivered straight to your inbox.</p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter your email"
                                    className="bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl h-10 focus-visible:ring-primary focus-visible:border-primary"
                                />
                                <Button size="sm" className="rounded-xl h-10 px-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 text-white">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-200 dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 font-medium">
                    <p>&copy; {new Date().getFullYear()} AI Bytes Learning. All rights reserved.</p>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <Link href="/privacy" className="hover:text-primary dark:hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-primary dark:hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/cookies" className="hover:text-primary dark:hover:text-white transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
