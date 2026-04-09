"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [welcomeName, setWelcomeName] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (!supabase) {
        setError("Authentication is not configured. Please set up Supabase credentials.");
        setLoading(false);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const name =
          data.user.user_metadata?.full_name?.split(" ")[0] ||
          data.user.email?.split("@")[0] ||
          "back";
        setWelcomeName(name);
        setTimeout(() => router.push(redirectTo), 1800);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (!supabase) { setError("Authentication is not configured."); return; }
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (signInError) setError(signInError.message);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col relative overflow-hidden">
      {/* Mesh blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#00FFB3]/5 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#9B8FFF]/5 blur-[140px]" />
      </div>

      {/* Grain */}
      <svg className="pointer-events-none absolute inset-0 z-0 w-full h-full opacity-[0.025]" style={{ mixBlendMode: "soft-light" }}>
        <filter id="signin-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#signin-grain)" />
      </svg>

      <Header />

      <main className="flex-1 flex items-center justify-center p-4 lg:p-12 relative z-10">
        <div className="w-full max-w-[440px]">

          {/* Welcome back success state */}
          {welcomeName ? (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 rounded-full bg-[#00FFB3]/10 border border-[#00FFB3]/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-[#00FFB3]" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-black text-white mb-2">
                  Welcome back, <span className="text-[#00FFB3]">{welcomeName}</span>
                </h2>
                <p className="text-white/40 text-sm">Taking you to your dashboard...</p>
              </div>
              <div className="w-48 h-0.5 bg-white/[0.08] mx-auto rounded-full overflow-hidden">
                <div className="h-full bg-[#00FFB3] rounded-full animate-[progress_1.8s_linear_forwards]" style={{ width: "100%" }} />
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.04] rounded-2xl p-8 lg:p-10 border border-white/[0.08] backdrop-blur-sm shadow-[0_0_60px_rgba(0,0,0,0.4)]">
              <div className="space-y-8">

                {/* Heading */}
                <div className="text-center space-y-3">
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/30">Sign in</p>
                  <h1 className="font-display text-3xl font-black text-white leading-tight">
                    Welcome <span className="text-[#00FFB3]">Back</span>
                  </h1>
                  <p className="text-white/50 text-sm">Log in to reach your 15-minute daily goal.</p>
                </div>

                {/* Google */}
                <Button
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="w-full h-12 text-sm font-bold border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white rounded-xl flex items-center justify-center gap-3 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[var(--page-bg)] px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
                      or email
                    </span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSignIn} className="space-y-5">
                  {error && (
                    <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-xl p-3 flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-[#FF6B6B] shrink-0" />
                      <p className="text-xs text-[#FF6B6B] leading-relaxed">{error}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-[#00FFB3] transition-colors" />
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        className="h-12 pl-11 rounded-xl border border-white/[0.08] bg-white/[0.06] focus:bg-white/[0.08] focus:border-white/20 focus:ring-0 text-sm text-white placeholder:text-white/20 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Password</label>
                      <Link href="/auth/reset-password" className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#00FFB3]/60 hover:text-[#00FFB3] transition-colors">
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-[#00FFB3] transition-colors" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 pl-11 rounded-xl border border-white/[0.08] bg-white/[0.06] focus:bg-white/[0.08] focus:border-white/20 focus:ring-0 text-sm text-white placeholder:text-white/20 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#00FFB3] hover:bg-[#00FFB3]/90 text-black rounded-xl font-black text-sm uppercase tracking-[0.15em] shadow-lg shadow-[#00FFB3]/20 transition-all disabled:bg-white/[0.04] disabled:text-white/20 disabled:cursor-not-allowed"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <p className="text-center font-mono text-[10px] uppercase tracking-[0.1em] text-white/30">
                  No account?{" "}
                  <Link href="/auth/signup" className="text-[#00FFB3] hover:text-[#00FFB3]/80 transition-colors">
                    Get Started Free
                  </Link>
                </p>

              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        @keyframes progress {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </div>
  );
}
