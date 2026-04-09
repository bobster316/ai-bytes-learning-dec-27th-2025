"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, User, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (!supabase) {
        setError("Authentication is not configured. Please set up Supabase credentials.");
        setLoading(false);
        return;
      }

      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/signin");
      }, 2000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (!supabase) {
        setError("Authentication is not configured. Please set up Supabase credentials.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError(signInError.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#00FFB3]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#9B8FFF]/5 rounded-full blur-[140px]" />
      </div>

      <Header />

      <main className="flex-1 flex items-center justify-center p-4 lg:p-12 relative z-10 w-full max-w-7xl mx-auto">
        <div className="w-full max-w-[520px] bg-white/[0.04] border border-white/[0.08] rounded-[2.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col justify-center backdrop-blur-sm">
          {/* Card inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative z-10 space-y-8">
            {success ? (
              <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 mx-auto rounded-full bg-[#00FFB3]/10 flex items-center justify-center shadow-lg shadow-[#00FFB3]/10 border border-[#00FFB3]/20">
                  <CheckCircle2 className="w-12 h-12 text-[#00FFB3]" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight">
                    Welcome <span className="text-[#00FFB3]">Aboard!</span>
                  </h2>
                  <p className="text-white/50 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                    Check your email to verify your account and begin your AI transformation.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00FFB3]/10 rounded-full border border-[#00FFB3]/20">
                    <Sparkles className="w-4 h-4 text-[#00FFB3]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00FFB3]">New Student Access</span>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                      Master <span className="text-[#00FFB3]">AI</span>
                    </h1>
                    <p className="text-white/40 text-sm font-medium">
                      Join 10,000+ practitioners. No PhD required.
                    </p>
                  </div>
                </div>

                {/* Google sign up */}
                <Button
                  variant="outline"
                  onClick={handleGoogleSignUp}
                  className="w-full h-14 text-sm font-bold border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign up with Google
                </Button>

                {/* Separator */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.08]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.25em]">
                    <span className="bg-[var(--page-bg)] px-4 text-white/30">Registration Details</span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSignUp} className="space-y-5">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <p className="text-xs font-bold text-red-400 leading-relaxed">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">First Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#00FFB3] transition-colors" />
                        <Input
                          type="text"
                          placeholder="John"
                          className="h-14 pl-12 rounded-2xl border border-white/[0.08] bg-white/[0.04] focus:bg-white/[0.07] focus:border-[#00FFB3]/50 focus:ring-0 transition-all text-sm text-white placeholder:text-white/20 font-medium"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Last Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#00FFB3] transition-colors" />
                        <Input
                          type="text"
                          placeholder="Smith"
                          className="h-14 pl-12 rounded-2xl border border-white/[0.08] bg-white/[0.04] focus:bg-white/[0.07] focus:border-[#00FFB3]/50 focus:ring-0 transition-all text-sm text-white placeholder:text-white/20 font-medium"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#00FFB3] transition-colors" />
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        className="h-14 pl-12 rounded-2xl border border-white/[0.08] bg-white/[0.04] focus:bg-white/[0.07] focus:border-[#00FFB3]/50 focus:ring-0 transition-all text-sm text-white placeholder:text-white/20 font-medium"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Password</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-14 px-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] focus:bg-white/[0.07] focus:border-[#00FFB3]/50 focus:ring-0 transition-all text-sm text-white placeholder:text-white/30"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Confirm</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-14 px-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] focus:bg-white/[0.07] focus:border-[#00FFB3]/50 focus:ring-0 transition-all text-sm text-white placeholder:text-white/30"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 mt-4 cursor-pointer group text-left">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded-md border-2 border-white/20 bg-transparent accent-[#00FFB3]" required />
                    <span className="text-[10px] text-white/40 leading-normal font-medium">
                      I agree to the{" "}
                      <Link href="/terms" className="text-[#00FFB3] font-bold hover:text-[#00FFB3]/80 transition-colors">Terms</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-[#00FFB3] font-bold hover:text-[#00FFB3]/80 transition-colors">Privacy Policy</Link>.
                    </span>
                  </label>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 bg-[#00FFB3] hover:brightness-110 text-[#030305] rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_10px_40px_-8px_rgba(0,255,179,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {loading ? "Initializing..." : "Get Started Free"}
                  </Button>
                </form>

                <p className="text-center text-xs text-white/40 font-medium">
                  Already a member?{" "}
                  <Link href="/auth/signin" className="text-[#00FFB3] font-black hover:underline underline-offset-8 transition-all">Sign In</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
