"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, BookOpen, TreeDeciduous, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/mastery", label: "Skill Tree", icon: TreeDeciduous },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden w-full bg-white dark:bg-[#0B101E] border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-6 py-2">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="relative flex flex-col items-center gap-1 p-2 w-[4.5rem] group"
                        >
                            <div
                                className={cn(
                                    "relative z-10 p-1.5 rounded-full transition-all duration-300",
                                    isActive
                                        ? "text-primary"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                                )}
                            >
                                <Icon className={cn("w-6 h-6", isActive ? "fill-primary/10" : "")} />
                            </div>

                            <span className={cn(
                                "text-[10px] font-bold tracking-tight transition-all duration-300",
                                isActive ? "text-primary" : "text-slate-500"
                            )}>
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
