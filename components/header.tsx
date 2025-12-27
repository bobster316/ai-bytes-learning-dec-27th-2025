"use client";

import { Logo } from "@/components/logo";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // or a skeleton loader
  }

  return (
    <header className="sticky top-4 z-50 rounded-2xl mx-auto w-[95%] max-w-7xl backdrop-blur-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 shadow-2xl transition-all duration-300">
      <div className="flex h-28 items-center justify-between px-2 lg:px-6 max-w-full overflow-hidden">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 lg:gap-3 shrink-0 pl-0">
          {/* Large logo but constrained width to prevent overflow */}
          <div className="relative h-20 w-80 md:h-24 md:w-[26rem] overflow-hidden">
            <Logo className="w-full h-full scale-[1.8] origin-left" />
          </div>
        </Link>



        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
          <Link
            href="/"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
          >
            Home
          </Link>
          <Link
            href="/courses"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
          >
            Courses
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
          >
            About
          </Link>
          <Link
            href="/blog"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
          >
            Blog
          </Link>
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 font-medium px-2">
              <Settings className="w-4 h-4 mr-0 lg:mr-2" />
              <span className="hidden xl:inline">Admin</span>
            </Button>
          </Link>

          <div className="h-6 w-px bg-border mx-2" />
          <Link href="/auth/signin">
            <Button variant="ghost" className="text-slate-600 dark:text-slate-300 font-bold px-2 xl:px-4 text-xs xl:text-sm whitespace-nowrap">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="font-bold bg-[#00d3f2] hover:bg-[#00b8d4] text-white shadow-lg hover:shadow-xl transition-all px-4 xl:px-6 text-xs xl:text-sm h-10 whitespace-nowrap">
              Start Free Trial
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button - Shown on screens < lg */}
        <button
          className="lg:hidden p-2 -mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div >

      {/* Mobile Menu */}
      {
        mobileMenuOpen && (
          <div className="border-t border-border bg-background lg:hidden animate-in slide-in-from-top-5 duration-200">
            <nav className="container mx-auto flex flex-col space-y-4 px-4 py-6">
              <Link
                href="/"
                className="text-lg font-medium text-foreground/80 hover:text-foreground p-2 rounded-md hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/courses"
                className="text-lg font-medium text-foreground/80 hover:text-foreground p-2 rounded-md hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Courses
              </Link>
              <Link
                href="/pricing"
                className="text-lg font-medium text-foreground/80 hover:text-foreground p-2 rounded-md hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="text-lg font-medium text-foreground/80 hover:text-foreground p-2 rounded-md hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/blog"
                className="text-lg font-medium text-foreground/80 hover:text-foreground p-2 rounded-md hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/admin"
                className="text-lg font-medium text-foreground/80 hover:text-foreground p-2 rounded-md hover:bg-muted flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="w-5 h-5 mr-2" />
                Admin
              </Link>

              <div className="pt-4 space-y-3 border-t border-border mt-2">

                <div className="grid grid-cols-2 gap-3">
                  <Link href="/auth/signin">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="w-full bg-primary text-primary-foreground">
                      Start Trial
                    </Button>
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        )
      }
    </header >
  );
}
