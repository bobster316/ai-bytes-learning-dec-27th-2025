"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, X, Zap, Star, Crown, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { User } from "@supabase/supabase-js";
import { PLAN_DETAILS } from "@/lib/stripe/constants";

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [user, setUser] = useState<User | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      }
    };
    checkUser();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push("/auth/signup");
      return;
    }
    if (planId === "free") {
      router.push("/dashboard");
      return;
    }
    setLoadingId(planId);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, billingCycle }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(`Checkout failed: ${data.error}`);
      }
    } catch {
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  const plans = [
    {
      id: "free",
      name: "Starter",
      icon: Zap,
      iconColor: "#00FFB3",
      description: "Start small and build momentum",
      price: { monthly: 0, annual: 0 },
      features: ["Access to 3 courses", "Basic progress tracking", "Basic skill tree access"],
      cta: "Get Started",
      highlight: false,
    },
    {
      id: "standard",
      name: "Growth",
      icon: Star,
      iconColor: "#4b98ad",
      description: "Build consistency and range",
      price: PLAN_DETAILS.byte_pass.prices,
      features: [
        "Access to 20 courses",
        "Full progress dashboard",
        "Daily challenges",
        "Structured course categories",
        "Shareable certificates",
        "Basic skill tree access",
      ],
      cta: "Start Learning",
      highlight: false,
    },
    {
      id: "professional",
      name: "Pro",
      icon: Users,
      iconColor: "#4b98ad",
      description: "Serious learners and teams",
      price: PLAN_DETAILS.professional.prices,
      features: [
        "Access to 40 courses",
        "Full progress dashboard",
        "Daily challenges",
        "Structured course categories",
        "Shareable certificates",
        "Full skill tree expansion",
        "Full library access",
        "Industry-recognised credits",
      ],
      cta: "Go Pro",
      highlight: true,
      tag: "BEST VALUE",
    },
    {
      id: "unlimited",
      name: "Elite",
      icon: Crown,
      iconColor: "#FFB347",
      description: "All‑access, no limits",
      price: PLAN_DETAILS.unlimited.prices,
      features: [
        "Everything in Professional",
        "Unlimited course access",
        "Offline course downloads",
        "Early access features",
      ],
      cta: "Choose Elite",
      highlight: false,
    },
  ];

  const tick = <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#00FFB3]/10 text-[#00FFB3] text-xs font-bold">✓</span>;
  const cross = <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6B6B]/10 text-[#FF6B6B] text-xs font-bold">✕</span>;

  return (
    <div className="min-h-screen bg-[#080810] text-white selection:bg-[#4b98ad]/30">
      {/* Mesh blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#4b98ad] opacity-[0.08] blur-[120px]" />
        <div className="absolute top-[40%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#00FFB3] opacity-[0.05] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-[#FFB347] opacity-[0.05] blur-[120px]" />
      </div>

      {/* Grain overlay */}
      <svg className="pointer-events-none fixed inset-0 z-0 w-full h-full opacity-[0.025]" style={{ mixBlendMode: "soft-light" }}>
        <filter id="pricing-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#pricing-grain)" />
      </svg>

      <div className="relative z-10">
        <Header />

        <main className="pt-32 pb-24">

          {/* Hero */}
          <div className="container mx-auto px-4 text-center max-w-4xl mb-20">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40 mb-4">Pricing</p>
            <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
              Select your plan
            </h1>
            <p className="text-white/50 text-lg mb-10">
              Start your AI learning journey today.
            </p>

            {/* Billing toggle */}
            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] inline-flex">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                    billingCycle === "monthly"
                      ? "bg-[#4b98ad] text-white shadow-lg shadow-[#4b98ad]/20"
                      : "text-white/50 hover:text-white"
                  )}
                >
                  MONTHLY
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                    billingCycle === "annual"
                      ? "bg-[#4b98ad] text-white shadow-lg shadow-[#4b98ad]/20"
                      : "text-white/50 hover:text-white"
                  )}
                >
                  YEARLY
                </button>
              </div>
              <div className="bg-[#00FFB3]/10 text-[#00FFB3] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-[#00FFB3]/20">
                Limited Time: 20% Off
              </div>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {plans.map((plan) => {
                const isAnnual = billingCycle === "annual";
                const price = isAnnual && plan.price ? Math.round(plan.price.annual / 12) : plan.price?.monthly ?? 0;
                const PlanIcon = plan.icon;

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative rounded-2xl p-7 flex flex-col transition-all duration-300 border",
                      plan.highlight
                        ? "bg-[#0d0d1c] border-[#4b98ad]/40 shadow-[0_0_50px_rgba(155,143,255,0.12)] scale-[1.02] z-10"
                        : "bg-[#0d0d1c] border-white/[0.06] hover:border-white/[0.12] hover:-translate-y-1"
                    )}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="font-mono text-[10px] font-bold text-[#4b98ad] bg-[#4b98ad]/15 px-3 py-1 rounded-full uppercase tracking-wider border border-[#4b98ad]/30">
                          {plan.tag}
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${plan.iconColor}15` }}>
                          <PlanIcon className="w-4 h-4" style={{ color: plan.iconColor }} />
                        </div>
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/40">{plan.name}</span>
                      </div>

                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-4xl font-black text-white">£{price}</span>
                        {price > 0 && <span className="text-white/40 text-sm">/mo</span>}
                      </div>

                      {isAnnual && plan.price && plan.price.annual > 0 && (
                        <p className="font-mono text-[10px] text-white/30 mt-1">
                          Billed £{plan.price.annual} yearly
                        </p>
                      )}

                      <p className="text-white/40 text-xs mt-2">{plan.description}</p>
                    </div>

                    <div className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-[#00FFB3] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                          <span className="text-sm text-white/60 leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loadingId === plan.id}
                      className={cn(
                        "w-full rounded-xl font-bold h-11 transition-all border-0",
                        plan.highlight
                          ? "bg-[#4b98ad] hover:bg-[#4b98ad]/90 text-white shadow-lg shadow-[#4b98ad]/20"
                          : "bg-white/[0.06] hover:bg-white/[0.10] text-white border border-white/[0.10]"
                      )}
                    >
                      {loadingId === plan.id ? "Processing..." : plan.cta}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Comparison Table */}
            <div className="mt-16">
              <div className="bg-[#0d0d1c] rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="p-6 md:p-8 border-b border-white/[0.06]">
                  <h2 className="font-display text-2xl font-black text-white">Compare plans</h2>
                  <p className="text-white/40 text-sm mt-1">Pick the plan that matches your learning pace.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 bg-white/[0.02]">
                        <th className="px-6 py-4 font-bold">Feature</th>
                        <th className="px-6 py-4 font-bold">Starter £0</th>
                        <th className="px-6 py-4 font-bold">Growth £15</th>
                        <th className="px-6 py-4 font-bold text-[#4b98ad]">Pro £25</th>
                        <th className="px-6 py-4 font-bold">Elite £35</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-sm">
                      {[
                        { label: "Course Access", vals: ["3 courses", "20 courses", "40 courses", "Unlimited"] },
                        { label: "Progress Tracking", vals: ["Basic", "Full Dashboard", "Full Dashboard", "Full Dashboard"] },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-semibold text-white/80">{row.label}</td>
                          {row.vals.map((v, j) => (
                            <td key={j} className={cn("px-6 py-4", j === 2 ? "text-white font-semibold" : "text-white/50")}>{v}</td>
                          ))}
                        </tr>
                      ))}
                      {[
                        { label: "Basic Skill Tree", vals: [true, true, true, true] },
                        { label: "Daily Challenges", vals: [false, true, true, true] },
                        { label: "Structured Categories", vals: [false, true, true, true] },
                        { label: "Shareable Certificates", vals: [false, true, true, true] },
                        { label: "Full Skill Tree Expansion", vals: [false, false, true, true] },
                        { label: "Full Library Access", vals: [false, false, true, true] },
                        { label: "Industry-recognised Credits", vals: [false, false, true, true] },
                        { label: "Offline Downloads", vals: [false, false, false, true] },
                        { label: "Early Access Features", vals: [false, false, false, true] },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-semibold text-white/80">{row.label}</td>
                          {row.vals.map((v, j) => (
                            <td key={j} className="px-6 py-4 text-center">
                              {v ? tick : cross}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-white/[0.02]">
                        <td className="px-6 py-4 font-semibold text-white/80">Best for</td>
                        <td className="px-6 py-4 text-white/40">Trying it out</td>
                        <td className="px-6 py-4 text-white/40">Regular learners</td>
                        <td className="px-6 py-4 font-semibold text-white">Dedicated learners</td>
                        <td className="px-6 py-4 text-white/40">Teams &amp; power users</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-white/[0.04] font-mono text-[10px] text-white/25 uppercase tracking-[0.1em]">
                  Personalised plans available subject to consultation.
                </div>
              </div>
            </div>

            {/* Enterprise CTA */}
            <div className="mt-12 text-center">
              <p className="text-white/40 mb-4 text-sm">Need a custom plan for your team?</p>
              <Link href="/contact">
                <Button variant="ghost" className="text-white/70 hover:text-white font-bold hover:bg-transparent p-0 gap-2">
                  Contact Sales <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div className="container mx-auto px-4 max-w-3xl mt-24">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/30 text-center mb-3">FAQ</p>
            <h2 className="font-display text-2xl font-black text-white text-center mb-12">Common Questions</h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {[
                { q: "Can I cancel at any time?", a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing cycle." },
                { q: "Is there a student discount?", a: "The Starter plan is priced specifically for students, offering a significant saving compared to our Professional tier." },
                { q: "What payment methods do you accept?", a: "We accept all major credit cards including Visa, Mastercard, and American Express via our secure Stripe payment processor." },
              ].map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border border-white/[0.06] rounded-xl px-6 bg-[#0d0d1c]"
                >
                  <AccordionTrigger className="text-white/80 hover:text-white hover:no-underline py-5 text-left font-semibold text-sm">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/50 pb-5 text-sm leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

        </main>
        <Footer />
      </div>
    </div>
  );
}
