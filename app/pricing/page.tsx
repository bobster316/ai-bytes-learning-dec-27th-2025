"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Sparkles,
  X,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      name: "Single Course",
      price: billingCycle === "monthly" ? 39 : 39,
      period: "per course",
      description: "For casual learners",
      popular: false,
      features: [
        "Lifetime access to purchased course",
        "All course materials and updates",
        "Certificate upon completion",
        "Own forever, no subscription",
        "Any difficulty level available",
      ],
      limitations: [
        "No offline download",
        "Limited AI companion (10 queries/day)",
        "Standard support (48h response)",
      ],
      cta: "Browse Courses",
      ctaLink: "/courses",
    },
    {
      name: "Unlimited",
      price: billingCycle === "monthly" ? 49 : 470,
      period: billingCycle === "monthly" ? "/month" : "/year",
      originalPrice: billingCycle === "annual" ? 588 : null,
      savings: billingCycle === "annual" ? "Save £118" : null,
      description: "Recommended for active learners",
      popular: true,
      features: [
        "Unlimited courses (Beginner & Intermediate)",
        "New courses added monthly",
        "Download for offline viewing",
        "All certificates",
        "Priority support (24-hour response)",
        "Advanced AI study companion",
        "Cancel anytime",
      ],
      limitations: [],
      cta: "Start 7-Day FREE Trial",
      ctaLink: "/signup",
      note: "No credit card required",
    },
    {
      name: "Professional",
      price: billingCycle === "monthly" ? 99 : 950,
      period: billingCycle === "monthly" ? "/month" : "/year",
      originalPrice: billingCycle === "annual" ? 1188 : null,
      savings: billingCycle === "annual" ? "Save £238" : null,
      description: "For professionals & teams",
      popular: false,
      features: [
        "Everything in Unlimited",
        "Unlimited Advanced courses",
        "1-on-1 monthly Q&A session (30 min)",
        "Private community access",
        "Premium AI companion (unlimited)",
        "Priority support (4-hour response)",
        "Career guidance resources",
        "Beta access to new features",
      ],
      limitations: [],
      cta: "Start Free Trial",
      ctaLink: "/signup",
    },
  ];

  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden py-12 bg-slate-900 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>
        <div className="container relative z-10 mx-auto px-4 max-w-7xl">
          <div className="text-center space-y-6">
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-primary/20 text-cyan-300 font-medium text-lg tracking-wide uppercase">
              Pricing Options
            </span>
            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">Pricing</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Learn AI at Your Own Pace, Your Own Way. No hidden fees.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-full text-base font-bold transition-all ${billingCycle === "monthly"
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-2 rounded-full text-base font-bold transition-all ${billingCycle === "annual"
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
              >
                Annual <span className="text-xs ml-1 font-normal opacity-70">(Save 20%)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative border-2 ${plan.popular
                  ? "border-primary shadow-xl scale-105 z-10"
                  : "border-slate-200 dark:border-slate-800"
                  } transition-all hover:border-primary bg-card rounded-2xl`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-full text-center z-50">
                    <Badge className="bg-[#00d3f2] hover:bg-[#00b8d4] text-white px-4 py-1 text-sm font-bold shadow-lg border-none rounded-full">
                      MOST POPULAR
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>

                  <div className="mt-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold text-foreground">
                        £{plan.price}
                      </span>
                      <span className="text-foreground/70">{plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="mt-2">
                        <span className="text-foreground/50 line-through">
                          £{plan.originalPrice}
                        </span>
                        <Badge variant="beginner" className="ml-2">
                          {plan.savings}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Link href={plan.ctaLink}>
                    <Button
                      className={`w-full h-10 text-base font-bold rounded-xl ${plan.popular ? "bg-primary hover:bg-primary/90 text-white" : ""}`}
                      size="sm"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                  {plan.note && (
                    <p className="text-xs text-center text-foreground/70">
                      {plan.note}
                    </p>
                  )}

                  <div className="space-y-3 pt-4">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                        <span className="text-sm text-foreground/80">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-foreground/40 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/50">{limitation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { value: "12,847", label: "Active Learners" },
              { value: "4.8/5", label: "Average Rating" },
              { value: "8,432", label: "Certificates" },
              { value: "92%", label: "Completion" },
            ].map((stat, index) => (
              <div key={index}>
                <p className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-foreground/70 uppercase tracking-wider font-semibold">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-12 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-[#10B981]" />
              </div>
              <span className="text-foreground/80">30-Day Money-Back</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <span className="text-foreground/80">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <span className="text-foreground/80">Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I switch plans anytime?",
                a: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
              },
              {
                q: "What happens after the free trial?",
                a: "After your 7-day free trial, you'll be charged based on your selected plan. You can cancel anytime before the trial ends with no charge.",
              },
              {
                q: "Do purchased courses expire?",
                a: "No! When you purchase a single course, you have lifetime access to that course and all its future updates.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, debit cards, and PayPal through our secure payment processor, Stripe.",
              },
            ].map((faq, index) => (
              <Card key={index} className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-start gap-3">
                    <HelpCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {faq.q}
                  </CardTitle>
                  <CardDescription className="pl-7 text-sm">{faq.a}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="bg-slate-900 rounded-[2.5rem] p-12 lg:p-16 text-center space-y-8 max-w-5xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10"></div>
            <h2 className="text-3xl lg:text-4xl font-black text-white relative z-10">Ready to Master AI?</h2>
            <p className="text-lg text-slate-300 relative z-10 max-w-2xl mx-auto">
              Start your journey from AI confused to AI confident
            </p>
            <Link href="/signup" className="relative z-10 inline-block">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 border-none h-14 px-8 text-lg rounded-full shadow-lg hover:scale-105 transition-transform">
                Start Your Free Trial
              </Button>
            </Link>
            <p className="text-sm text-slate-400 relative z-10">
              No credit card required • Cancel anytime • 7 days free
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
