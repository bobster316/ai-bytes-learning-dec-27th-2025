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
  Zap,
  Crown,
  Users,
  Building2,
  Clock,
  Brain,
  BookOpen,
  MessageCircle,
  Download,
  Award,
  ArrowRight,
  Gift,
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      name: "Free",
      subtitle: "Taste of AI",
      image: "https://images.unsplash.com/photo-1676299081847-824916de030a?w=200&h=120&fit=crop&q=80",
      price: 0,
      period: "forever",
      description: "Start your AI journey risk-free",
      popular: false,
      highlight: false,
      color: "slate",
      features: [
        { text: "3 starter bytes (180 mins of learning)", included: true },
        { text: "Basic certificate of completion", included: true },
        { text: "Community forum access (read-only)", included: true },
        { text: "5 AI companion queries/month", included: true },
        { text: "Email support", included: true },
      ],
      cta: "Start Free",
      ctaLink: "/auth/signup",
      note: "No credit card required",
    },
    {
      name: "Byte Pass",
      subtitle: "Weekly Learning",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=120&fit=crop&q=80",
      price: billingCycle === "monthly" ? 9 : 79,
      period: billingCycle === "monthly" ? "/month" : "/year",
      monthlyEquivalent: billingCycle === "annual" ? "£6.60/mo" : null,
      savings: billingCycle === "annual" ? "Save £29" : null,
      description: "Perfect for busy professionals",
      popular: false,
      highlight: false,
      color: "cyan",
      features: [
        { text: "4-5 new bytes per month", included: true },
        { text: "Choose from 100+ AI topics", included: true },
        { text: "Downloadable resources & worksheets", included: true },
        { text: "Verified certificates", included: true },
        { text: "50 AI companion queries/month", included: true },
        { text: "Community forum (full access)", included: true },
      ],
      cta: "Try Free",
      ctaLink: "/auth/signup",
      note: "Cancel anytime",
    },
    {
      name: "Unlimited Bytes",
      subtitle: "All-Access Learning",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&h=120&fit=crop&q=80",
      price: billingCycle === "monthly" ? 39 : 319,
      period: billingCycle === "monthly" ? "/month" : "/year",
      monthlyEquivalent: billingCycle === "annual" ? "£26.60/mo" : null,
      savings: billingCycle === "annual" ? "Save £149" : null,
      description: "For serious AI learners",
      popular: true,
      highlight: true,
      color: "primary",
      features: [
        { text: "Unlimited access to ALL bytes (100+ hours)", included: true },
        { text: "Full AI course generation", included: true },
        { text: "Unlimited AI study companion", included: true },
        { text: "Priority support (24h response)", included: true },
        { text: "Advanced LinkedIn-ready certificates", included: true },
        { text: "Downloadable offline content", included: true },
        { text: "Early access to new bytes", included: true },
      ],
      cta: "Start Free Trial",
      ctaLink: "/auth/signup",
      badge: "Most Popular",
      note: "Best value for dedicated learners",
    },
    {
      name: "Professional Bytes",
      subtitle: "Team Accelerator",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=120&fit=crop&q=80",
      price: billingCycle === "monthly" ? 79 : 649,
      period: billingCycle === "monthly" ? "/month" : "/year",
      monthlyEquivalent: billingCycle === "annual" ? "£54/mo" : null,
      savings: billingCycle === "annual" ? "Save £299" : null,
      description: "For teams of 3-5 members",
      popular: false,
      highlight: false,
      color: "purple",
      features: [
        { text: "Everything in Unlimited Bytes", included: true },
        { text: "3-5 team member accounts", included: true },
        { text: "Team dashboard & progress tracking", included: true },
        { text: "Monthly 30-min Q&A with AI experts", included: true },
        { text: "Custom byte creation for your industry", included: true },
        { text: "Quarterly 1-on-1 career coaching", included: true },
        { text: "Premium community access", included: true },
        { text: "Certification pathway guidance", included: true },
      ],
      cta: "Start Team Trial",
      ctaLink: "/auth/signup",
      note: "£16/user for 5 members",
    },
    {
      name: "Enterprise",
      subtitle: "Custom Solutions",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=120&fit=crop&q=80",
      price: null,
      period: "",
      description: "For organizations 10+ users",
      popular: false,
      highlight: false,
      color: "amber",
      features: [
        { text: "Everything in Professional Bytes", included: true },
        { text: "Unlimited team members", included: true },
        { text: "Custom branded learning portal", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "Custom byte development", included: true },
        { text: "LMS integration", included: true },
        { text: "Advanced analytics & reporting", included: true },
        { text: "On-site workshops (optional)", included: true },
      ],
      cta: "Contact Sales",
      ctaLink: "/contact",
      note: "Starting at £50/user/month",
    },
  ];

  const faqs = [
    {
      q: "What is a 'byte'?",
      a: "A byte is our signature 60-minute learning module that breaks down complex AI topics into digestible, actionable lessons. Each byte is designed for maximum retention and immediate application.",
    },
    {
      q: "Can I switch plans anytime?",
      a: "Yes! You can upgrade or downgrade your plan at any time. If you upgrade, you'll get immediate access. If you downgrade, changes apply at your next billing cycle.",
    },
    {
      q: "What's included in the free tier?",
      a: "The free tier includes 3 complete starter bytes (180 minutes of learning), covering ChatGPT basics, AI ethics, and prompt engineering fundamentals. No credit card required.",
    },
    {
      q: "How does the team plan work?",
      a: "Professional Bytes includes 3-5 team member accounts. Each member gets full access plus you get a team dashboard, progress tracking, and monthly expert Q&A sessions.",
    },
    {
      q: "Do you offer student discounts?",
      a: "Yes! Students with a valid .edu email get 20% off any paid plan. Contact us with your student email to get your discount code.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit cards, PayPal, and bank transfers for annual enterprise plans. All payments are processed securely.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - Homepage Style */}
      <section className="relative mx-auto w-[95%] max-w-7xl my-4 rounded-3xl border border-white/5 shadow-2xl py-16 flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-900 pointer-events-none rounded-3xl"></div>
        <div className="container relative z-10 mx-auto px-4 max-w-7xl">
          <div className="text-center space-y-6">
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-primary/20 text-cyan-300 font-medium text-lg tracking-wide uppercase">
              Pricing Plans
            </span>
            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Learn AI One <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">Byte</span> at a Time
            </h1>
            <p className="text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Master any AI topic in just 60 minutes. Start with 3 free bytes—no credit card required.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2.5 rounded-full text-base font-bold transition-all ${billingCycle === "monthly"
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-2.5 rounded-full text-base font-bold transition-all flex items-center gap-2 ${billingCycle === "annual"
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
              >
                Annual
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  Save up to 32%
                </Badge>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Main 4 Plans Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {plans.slice(0, 4).map((plan) => {
              return (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col overflow-hidden ${plan.highlight
                    ? "border-2 border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                    : "border-border hover:border-primary/50"
                    } transition-all duration-300`}
                >
                  {plan.badge && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-primary text-white px-3 py-1 text-xs font-bold shadow-lg">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Thumbnail Image */}
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={plan.image}
                      alt={plan.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>

                  <CardHeader className="pb-4 pt-4">
                    <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                    <p className="text-sm text-foreground/60">{plan.subtitle}</p>

                    <div className="pt-4">
                      {plan.price !== null ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-foreground">£{plan.price}</span>
                            <span className="text-foreground/60">{plan.period}</span>
                          </div>
                          {plan.monthlyEquivalent && (
                            <p className="text-sm text-primary font-medium mt-1">{plan.monthlyEquivalent}</p>
                          )}
                          {plan.savings && (
                            <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-600 border-green-500/20">
                              {plan.savings}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <div className="text-3xl font-black text-foreground">Custom</div>
                      )}
                    </div>
                    <p className="text-sm text-foreground/70 mt-2">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="flex-grow flex flex-col">
                    <ul className="space-y-3 mb-6 flex-grow">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-foreground/80">{feature.text}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="space-y-2 mt-auto">
                      <Link href={plan.ctaLink} className="block">
                        <Button
                          className={`w-full h-11 text-sm font-semibold ${plan.highlight
                            ? "bg-primary hover:bg-primary/90 text-white"
                            : plan.price === 0
                              ? "bg-slate-800 hover:bg-slate-700 text-white"
                              : ""
                            }`}
                          variant={plan.highlight || plan.price === 0 ? "default" : "outline"}
                        >
                          {plan.cta}
                          <ArrowRight className="ml-1 w-4 h-4 flex-shrink-0" />
                        </Button>
                      </Link>
                      {plan.note && (
                        <p className="text-xs text-center text-foreground/50">{plan.note}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Enterprise Card - Full Width */}
          <Card className="border-border hover:border-amber-500/50 transition-all duration-300 bg-gradient-to-br from-amber-500/5 to-orange-500/5 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Thumbnail Image */}
              <div className="relative lg:w-64 h-48 lg:h-auto overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&q=80"
                  alt="Enterprise"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40 lg:bg-gradient-to-l"></div>
              </div>

              <div className="p-8 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center gap-8 flex-1">
                <div className="flex-1">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-foreground">Enterprise</h3>
                    <p className="text-foreground/60">Custom Solutions for Organizations</p>
                  </div>
                  <p className="text-foreground/80 mb-6 max-w-2xl">
                    Transform your organization's AI capabilities with custom bytes, dedicated support, branded portals, and advanced analytics. Perfect for companies, universities, and training organizations.
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans[4].features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-foreground/70">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center lg:items-end gap-3">
                  <div className="text-center lg:text-right">
                    <p className="text-sm text-foreground/60 mb-1">Starting at</p>
                    <p className="text-3xl font-black text-foreground">£50<span className="text-lg font-normal text-foreground/60">/user/month</span></p>
                    <p className="text-sm text-foreground/60">(10+ users)</p>
                  </div>
                  <Link href="/contact">
                    <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white px-8">
                      Contact Sales <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Comparison Highlight */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Why Choose AI Bytes Learning?
            </h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              The only AI-focused platform with structured 60-minute "bytes" format—master any topic in just one hour.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-background border border-border">
              <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-cyan-500" />
              </div>
              <h3 className="font-bold text-foreground mb-2">60-Minute Mastery</h3>
              <p className="text-sm text-foreground/70">Each byte is designed for maximum learning in minimum time. No overwhelming 40-hour courses.</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-background border border-border">
              <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="font-bold text-foreground mb-2">AI Study Companion</h3>
              <p className="text-sm text-foreground/70">Get personalized help, explanations, and practice questions from our AI assistant.</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-background border border-border">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="font-bold text-foreground mb-2">3x Completion Rate</h3>
              <p className="text-sm text-foreground/70">Micro-learning proven to have 3x higher completion rates than traditional courses.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-card border border-border">
                <h3 className="font-bold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-foreground/70">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Start with 3 Free Bytes Today
          </h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Master ChatGPT basics, AI ethics, and prompt engineering—all in under 3 hours. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90">
                Start Learning Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10">
                Browse All Bytes
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
