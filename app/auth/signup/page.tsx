"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, AlertCircle, CheckCircle2, ArrowRight, Sparkles, Star, Clock, Users, BookOpen } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
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

  const features = [
    { icon: Clock, text: "60-minute byte-sized lessons" },
    { icon: BookOpen, text: "100+ AI courses available" },
    { icon: Users, text: "Join 10,000+ learners" },
    { icon: Star, text: "95% satisfaction rate" },
  ];

  const testimonials = [
    {
      text: "Finally, AI learning that fits my schedule!",
      author: "Sarah M.",
      role: "Product Manager",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80"
    },
    {
      text: "The best investment in my career.",
      author: "James K.",
      role: "Software Engineer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80"
    },
    {
      text: "Complex AI made simple and practical.",
      author: "Emily R.",
      role: "Data Analyst",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Split Screen Layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        {/* Left Side - Hero/Marketing */}
        <div className="relative lg:w-1/2 bg-slate-900 overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=800&fit=crop&q=90"
              alt="AI Learning"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-cyan-900/70"></div>
          </div>

          {/* Floating Elements Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-40 right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-center p-8 lg:p-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 w-fit mb-8">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Start Learning Free</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight mb-6">
              Master AI in
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                60 Minutes
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-300 max-w-md mb-10 leading-relaxed">
              Complex AI concepts, simplified into 60-minute lessons. Learn at your pace, achieve real results.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-12">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
                >
                  <feature.icon className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-white/80">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Testimonials Row */}
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-wider text-white/40 font-medium">Trusted by learners worldwide</p>
              <div className="flex -space-x-3">
                {testimonials.map((t, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={t.avatar}
                      alt={t.author}
                      className="w-12 h-12 rounded-full border-2 border-slate-900 object-cover transition-transform group-hover:scale-110 group-hover:z-10"
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                      <p className="text-xs text-slate-900 font-medium">"{t.text}"</p>
                      <p className="text-xs text-slate-500">{t.author}, {t.role}</p>
                    </div>
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">10K+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-card">
          <div className="w-full max-w-md">
            {success ? (
              <div className="text-center space-y-6 animate-in fade-in duration-500">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Aboard! 🎉</h2>
                  <p className="text-foreground/60">
                    Check your email to verify your account and start learning.
                  </p>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-foreground/40">Redirecting to sign in...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Form Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Create Account</h2>
                  <p className="text-foreground/60">Start your AI learning journey today</p>
                </div>

                {/* Social Login */}
                <Button
                  variant="outline"
                  onClick={handleGoogleSignUp}
                  type="button"
                  className="w-full h-12 text-base font-medium hover:bg-foreground/5 transition-all duration-300 mb-6"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-4 text-foreground/40">or</span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSignUp} className="space-y-5">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <div className={`relative transition-all duration-300 ${focusedField === 'name' ? 'scale-[1.02]' : ''}`}>
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'name' ? 'text-primary' : 'text-foreground/40'}`} />
                      <Input
                        type="text"
                        placeholder="John Smith"
                        className="h-12 pl-12 text-base rounded-xl border-2 border-border focus:border-primary transition-all duration-300"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-primary' : 'text-foreground/40'}`} />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="h-12 pl-12 text-base rounded-xl border-2 border-border focus:border-primary transition-all duration-300"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'password' ? 'text-primary' : 'text-foreground/40'}`} />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 pl-12 text-base rounded-xl border-2 border-border focus:border-primary transition-all duration-300"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        required
                      />
                    </div>
                    <p className="text-xs text-foreground/40">Must be at least 8 characters</p>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <div className={`relative transition-all duration-300 ${focusedField === 'confirm' ? 'scale-[1.02]' : ''}`}>
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'confirm' ? 'text-primary' : 'text-foreground/40'}`} />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 pl-12 text-base rounded-xl border-2 border-border focus:border-primary transition-all duration-300"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        onFocus={() => setFocusedField('confirm')}
                        onBlur={() => setFocusedField(null)}
                        required
                      />
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <label className="flex items-start gap-3 text-sm text-foreground/60 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-5 h-5 rounded-md border-2 border-border accent-primary cursor-pointer"
                      required
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Get Started Free</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Sign In Link */}
                <p className="text-center text-sm text-foreground/60 mt-8">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
