"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");

    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setMessage("Thank you for subscribing!");
      setEmail("");
    }, 1500);
  };

  return (
    <section className="mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl py-16 bg-gradient-to-br from-primary/10 to-cyan-500/10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20">
            <Mail className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Stay Updated with AI Insights
          </h2>

          <p className="text-xl text-foreground/70 mb-8 leading-relaxed">
            Get the latest AI news, tutorials, and exclusive content delivered straight to your inbox.
            Join over 10,000 AI enthusiasts learning together.
          </p>

          {status === "success" ? (
            <div className="flex items-center justify-center gap-3 p-6 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
              <CheckCircle className="w-6 h-6 text-[#10B981]" />
              <p className="text-[#10B981] font-semibold">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus("idle");
                    setMessage("");
                  }}
                  className="h-14 text-lg"
                  disabled={status === "loading"}
                />
                {status === "error" && (
                  <p className="text-sm text-[#EF4444] mt-2 text-left">{message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="h-14 px-8 bg-primary text-primary-foreground font-semibold text-lg rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  "Subscribe"
                )}
              </button>
            </form>
          )}

          <p className="text-base text-foreground/60 mt-4">
            No spam, unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      </div>
    </section>
  );
}
