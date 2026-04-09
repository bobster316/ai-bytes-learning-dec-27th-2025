"use client";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Settings, Menu, X, Home, BookOpen, TreeDeciduous, CreditCard, LayoutDashboard, LogOut, LogIn, UserPlus, Newspaper } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkUser();

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.pageYOffset;
      setScrollProgress((currentScroll / (totalScroll || 1)) * 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const checkUser = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        let role = authUser.app_metadata?.role || authUser.user_metadata?.role || "student";
        if (authUser.email === "rav.khangurra@gmail.com") {
          role = "admin";
        }

        setUser({
          email: authUser.email || "",
          name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
          role: role,
        });
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
        setUser(null);
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!mounted) return null;

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/news", label: "The Pulse", icon: Newspaper },
    { href: "/skill-tree", label: "Skill Tree", icon: TreeDeciduous },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 z-[100] w-full transition-all duration-300 backdrop-blur-xl dark:bg-[#080810]/95 bg-white/95 dark:border-white/[0.06] border-black/[0.06] border-b">
        {/* Scroll Progress Bar */}
        <div
          className="scroll-progress h-[2px] bg-primary absolute bottom-0 left-0 transition-all duration-150 z-[120]"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="mx-auto w-[1440px] max-w-[98vw] px-[clamp(12px,2.2vw,24px)]">
          <div className="flex h-[clamp(60px,7vw,80px)] items-center justify-between gap-[clamp(6px,1.2vw,12px)]">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 z-[110]">
              <div className="relative h-[clamp(44px,5vw,64px)] w-[clamp(200px,22vw,300px)] transition-all duration-300">
                <Logo className="w-full h-full origin-left" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-[clamp(2px,0.6vw,6px)] flex-nowrap">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-[clamp(11px,1.1vw,14px)] font-bold px-[clamp(10px,1.6vw,16px)] py-[clamp(6px,0.8vw,8px)] rounded-full transition-all duration-200",
                    isActive(link.href)
                      ? "text-[#00C896] bg-[#00C896]/10"
                      : "dark:text-white/65 dark:hover:text-white dark:hover:bg-white/[0.06] text-slate-700 hover:text-slate-900 hover:bg-black/[0.05]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className={cn(
                    "text-[clamp(11px,1.1vw,14px)] font-bold px-[clamp(10px,1.6vw,16px)] py-[clamp(6px,0.8vw,8px)] rounded-full transition-all duration-200",
                    isActive("/admin")
                      ? "text-[#00C896] bg-[#00C896]/10"
                      : "dark:text-white/65 dark:hover:text-white dark:hover:bg-white/[0.06] text-slate-700 hover:text-slate-900 hover:bg-black/[0.05]"
                  )}
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-[clamp(6px,1vw,16px)] flex-nowrap">
              <ThemeToggle />
              {loading ? (
                <div className="w-20 h-8 bg-slate-100 animate-pulse rounded-full" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="font-bold dark:text-white/70 dark:hover:text-white dark:hover:bg-white/[0.06] text-slate-700 hover:text-slate-900 hover:bg-black/[0.05] text-[clamp(11px,1.05vw,13px)] h-[clamp(28px,3.6vw,36px)] px-[clamp(8px,1.4vw,14px)] rounded-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="font-bold dark:text-white/65 dark:border-white/[0.12] dark:hover:text-white dark:hover:border-white/25 dark:hover:bg-white/[0.06] text-slate-700 border-slate-300 hover:text-slate-900 hover:border-slate-400 hover:bg-black/[0.04] bg-transparent text-[clamp(11px,1.05vw,13px)] h-[clamp(28px,3.6vw,36px)] px-[clamp(8px,1.4vw,14px)] rounded-full">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="font-bold dark:text-white/65 dark:hover:text-white dark:hover:bg-white/[0.06] text-slate-700 hover:text-slate-900 hover:bg-black/[0.05] text-[clamp(11px,1.05vw,13px)] h-[clamp(28px,3.6vw,36px)] px-[clamp(8px,1.4vw,14px)]">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="bg-[#00FFB3] hover:bg-[#00FFB3]/90 text-black keep-white font-black rounded-full shadow-lg shadow-[#00FFB3]/20 text-[clamp(11px,1.05vw,13px)] h-[clamp(28px,3.6vw,36px)] px-[clamp(10px,1.6vw,16px)]">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Auth/Profile - Simplified */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              {user ? (
                <Link href="/dashboard">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 active:scale-90 transition-all">
                    <LayoutDashboard className="w-5 h-5 text-slate-600" />
                  </div>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button size="sm" className="dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-white bg-slate-800 hover:bg-slate-700 text-white keep-white font-black rounded-full text-xs h-9 px-4">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="h-[clamp(60px,7vw,80px)] w-full" aria-hidden="true" />
    </>
  );
}
