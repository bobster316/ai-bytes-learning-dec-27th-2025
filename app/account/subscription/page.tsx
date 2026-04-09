"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Crown,
    Zap,
    Users,
    CreditCard,
    CheckCircle2,
    Brain,
    BookOpen,
    Loader2,
    Sparkles,
    Shield
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLAN_DETAILS, PlanType } from "@/lib/stripe/constants";
import { cn } from "@/lib/utils";

interface Subscription {
    plan: PlanType;
    status: string;
    billing_cycle: string | null;
    current_period_end: string | null;
    trial_end: string | null;
}

interface Usage {
    bytes_accessed: number;
    ai_queries_used: number;
}

export default function SubscriptionPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<Usage | null>(null);
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);

    useEffect(() => {
        loadSubscriptionData();
    }, []);

    const loadSubscriptionData = async () => {
        try {
            const supabase = createClient();
            if (!supabase) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get subscription
            const { data: subData } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (subData) {
                setSubscription(subData as Subscription);
            } else {
                setSubscription({
                    plan: 'free',
                    status: 'active',
                    billing_cycle: null,
                    current_period_end: null,
                    trial_end: null,
                });
            }

            // Get usage for current period
            const period = new Date().toISOString().slice(0, 7);
            const { data: usageData } = await supabase
                .from('user_usage')
                .select('bytes_accessed, ai_queries_used')
                .eq('user_id', user.id)
                .eq('usage_period', period)
                .single();

            if (usageData) {
                setUsage(usageData as Usage);
            } else {
                setUsage({ bytes_accessed: 0, ai_queries_used: 0 });
            }
        } catch (error) {
            console.error('Error loading subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCustomerPortal = async () => {
        setPortalLoading(true);
        try {
            const response = await fetch('/api/stripe/customer-portal', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Error opening portal:', error);
        } finally {
            setPortalLoading(false);
        }
    };

    const handleUpgrade = async (plan: string, cycle: string) => {
        try {
            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, billingCycle: cycle }),
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Error creating checkout:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] flex flex-col">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#00FFB3]" />
                </div>
            </div>
        );
    }

    const plan = subscription?.plan || 'free';
    const planDetails = PLAN_DETAILS[plan];
    const bytesLimit = planDetails.bytesPerMonth;
    const aiLimit = planDetails.aiQueriesPerMonth;
    const bytesUsed = usage?.bytes_accessed || 0;
    const aiUsed = usage?.ai_queries_used || 0;

    const getPlanIcon = (p: string) => {
        switch (p) {
            case 'unlimited': return Crown;
            case 'professional': return Users;
            case 'byte_pass': return Zap;
            default: return BookOpen;
        }
    };

    const CurrentPlanIcon = getPlanIcon(plan);

    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)]">
            <Header />

            <div className="relative pt-32 pb-20 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#9B8FFF]/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="container mx-auto px-4 max-w-6xl relative z-10">
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                            Subscription &amp; Usage
                        </h1>
                        <p className="text-white/65 text-lg">
                            Manage your plan, check your limits, and unlock more power.
                        </p>
                    </div>

                    {/* Active Subscription Card */}
                    <div className="grid lg:grid-cols-3 gap-8 mb-16">
                        <Card className="lg:col-span-2 bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm overflow-hidden">
                            <CardHeader className="border-b border-white/[0.08] pb-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner",
                                            plan === 'unlimited' ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
                                                plan === 'professional' ? "bg-blue-600 text-white" :
                                                    "bg-white/[0.08] text-white/65"
                                        )}>
                                            <CurrentPlanIcon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <CardTitle className="text-2xl font-bold text-white">{planDetails.name} Plan</CardTitle>
                                                {subscription?.status === 'active' && (
                                                    <Badge variant="outline" className="bg-[#00FFB3]/10 text-[#00FFB3] border-[#00FFB3]/20">
                                                        Active
                                                    </Badge>
                                                )}
                                                {subscription?.status === 'trialing' && (
                                                    <Badge variant="secondary" className="bg-[#FFB347]/10 text-[#FFB347] border-[#FFB347]/20">
                                                        Trial Active
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-white/50 mt-1">
                                                {subscription?.billing_cycle === 'annual' ? 'Billed annually' : 'Billed monthly'}
                                                {subscription?.current_period_end && ` • Renews ${new Date(subscription.current_period_end).toLocaleDateString('en-GB')}`}
                                            </p>
                                        </div>
                                    </div>

                                    {plan !== 'free' && (
                                        <Button
                                            variant="outline"
                                            onClick={openCustomerPortal}
                                            disabled={portalLoading}
                                            className="hidden sm:flex border-white/[0.08] text-white hover:bg-white/[0.08]"
                                        >
                                            {portalLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                                            Manage Billing
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="pt-8 grid sm:grid-cols-2 gap-8">
                                {/* Bytes Usage */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 font-medium text-white">
                                            <BookOpen className="w-4 h-4 text-[#00FFB3]" />
                                            <span>Content Access</span>
                                        </div>
                                        <span className="text-white/50">
                                            {bytesLimit === -1 ? 'Unlimited' : `${bytesUsed} / ${bytesLimit} bytes`}
                                        </span>
                                    </div>
                                    {bytesLimit === -1 ? (
                                        <div className="h-2.5 w-full bg-emerald-500/20 rounded-full overflow-hidden relative">
                                            <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
                                            <div className="h-full bg-emerald-500 w-full" />
                                        </div>
                                    ) : (
                                        <Progress
                                            value={(bytesUsed / bytesLimit) * 100}
                                            className="h-2.5 bg-white/[0.08]"
                                            indicatorClassName={cn(
                                                (bytesUsed / bytesLimit) > 0.9 ? "bg-[#FF6B6B]" : "bg-[#00FFB3]"
                                            )}
                                        />
                                    )}
                                    <p className="text-xs text-white/40">
                                        {bytesLimit === -1
                                            ? "You have unlimited access to all learning materials."
                                            : "Usage resets at the start of next billing cycle."}
                                    </p>
                                </div>

                                {/* AI Usage */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 font-medium text-white">
                                            <Brain className="w-4 h-4 text-[#9B8FFF]" />
                                            <span>AI Tutor Queries</span>
                                        </div>
                                        <span className="text-white/50">
                                            {aiLimit === -1 ? 'Unlimited' : `${aiUsed} / ${aiLimit} queries`}
                                        </span>
                                    </div>
                                    {aiLimit === -1 ? (
                                        <div className="h-2.5 w-full bg-[#9B8FFF]/20 rounded-full overflow-hidden relative">
                                            <div className="absolute inset-0 bg-[#9B8FFF]/10 animate-pulse" />
                                            <div className="h-full bg-[#9B8FFF] w-full" />
                                        </div>
                                    ) : (
                                        <Progress
                                            value={(aiUsed / aiLimit) * 100}
                                            className="h-2.5 bg-white/[0.08]"
                                            indicatorClassName="bg-[#9B8FFF]"
                                        />
                                    )}
                                    <p className="text-xs text-white/40">
                                        {aiLimit === -1
                                            ? "Ask specific questions and get personalised help."
                                            : "Detailed answers from your AI learning companion."}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upgrade/Upsell Card */}
                        <div className="flex flex-col gap-4">
                            {plan === 'free' && (
                                <Card className="flex-grow bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                                    <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                                        <div className="w-12 h-12 rounded-full bg-[#00FFB3]/10 text-[#00FFB3] flex items-center justify-center mb-4">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-lg text-white mb-2">Unlock Your Potential</h3>
                                        <p className="text-sm text-white/65 mb-6">
                                            Upgrade to Standard to get 5x more content and personalised AI guidance.
                                        </p>
                                        <Button
                                            onClick={() => handleUpgrade('byte_pass', 'monthly')}
                                            className="w-full bg-[#00FFB3] text-black hover:bg-[#00FFB3]/90 border-0"
                                        >
                                            Upgrade Now
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                            {plan !== 'free' && plan !== 'unlimited' && (
                                <Card className="flex-grow border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-600/5">
                                    <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                                        <div className="w-12 h-12 rounded-full bg-amber-900/30 text-amber-400 flex items-center justify-center mb-4">
                                            <Crown className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-lg text-white mb-2">Go Unlimited</h3>
                                        <p className="text-sm text-white/65 mb-6">
                                            Remove all limits and learn at your own pace with the Unlimited plan.
                                        </p>
                                        <Button
                                            onClick={() => handleUpgrade('unlimited', 'monthly')}
                                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-0 text-white"
                                        >
                                            Get Unlimited
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                            {plan === 'unlimited' && (
                                <Card className="flex-grow bg-white/[0.04] border border-white/[0.08]">
                                    <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                                        <div className="w-12 h-12 rounded-full bg-white/[0.08] text-white/65 flex items-center justify-center mb-4">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-lg text-white mb-2">You&apos;re All Set!</h3>
                                        <p className="text-sm text-white/65 mb-4">
                                            You have the highest tier plan available. Enjoy your learning!
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* All Plans */}
                    {plan !== 'unlimited' && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <h2 className="text-2xl font-bold text-white mb-8">Available Upgrades</h2>
                            <div className="grid md:grid-cols-3 gap-6">

                                {/* Standard Plan */}
                                {plan !== 'byte_pass' && plan !== 'professional' && (
                                    <Card className="bg-white/[0.04] border border-white/[0.08] hover:border-[#9B8FFF]/30 hover:shadow-lg transition-all duration-300">
                                        <CardHeader>
                                            <div className="w-10 h-10 rounded-lg bg-[#00FFB3]/10 text-[#00FFB3] flex items-center justify-center mb-4">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <CardTitle className="text-white">{PLAN_DETAILS.byte_pass.name}</CardTitle>
                                            <div className="flex items-baseline mt-2">
                                                <span className="text-3xl font-bold text-white">£{PLAN_DETAILS.byte_pass.prices.monthly}</span>
                                                <span className="text-white/50 ml-1">/mo</span>
                                            </div>
                                            <CardDescription className="text-white/50">Essential AI learning tools</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-3 mb-6">
                                                <li className="flex items-center text-sm text-white/65">
                                                    <CheckCircle2 className="w-4 h-4 text-[#00FFB3] mr-2 flex-shrink-0" />
                                                    {PLAN_DETAILS.byte_pass.bytesPerMonth} Bytes / month
                                                </li>
                                                <li className="flex items-center text-sm text-white/65">
                                                    <CheckCircle2 className="w-4 h-4 text-[#00FFB3] mr-2 flex-shrink-0" />
                                                    {PLAN_DETAILS.byte_pass.aiQueriesPerMonth} AI Queries / month
                                                </li>
                                                <li className="flex items-center text-sm text-white/65">
                                                    <CheckCircle2 className="w-4 h-4 text-[#00FFB3] mr-2 flex-shrink-0" />
                                                    Access to Community
                                                </li>
                                            </ul>
                                            <Button
                                                className="w-full bg-[#00FFB3] text-black hover:bg-[#00FFB3]/90"
                                                onClick={() => handleUpgrade('byte_pass', 'monthly')}
                                            >
                                                Upgrade to Standard
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Professional Plan */}
                                {plan !== 'professional' && (
                                    <Card className="bg-white/[0.04] border border-blue-900/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                            Popular
                                        </div>
                                        <CardHeader>
                                            <div className="w-10 h-10 rounded-lg bg-blue-900/30 text-blue-400 flex items-center justify-center mb-4">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <CardTitle className="text-white">{PLAN_DETAILS.professional.name}</CardTitle>
                                            <div className="flex items-baseline mt-2">
                                                <span className="text-3xl font-bold text-white">£{PLAN_DETAILS.professional.prices.monthly}</span>
                                                <span className="text-white/50 ml-1">/mo</span>
                                            </div>
                                            <CardDescription className="text-white/50">For serious learners</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-3 mb-6">
                                                <li className="flex items-center text-sm text-white/65">
                                                    <CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                                                    {PLAN_DETAILS.professional.bytesPerMonth} Bytes / month
                                                </li>
                                                <li className="flex items-center text-sm text-white/65">
                                                    <CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                                                    <span className="font-medium text-white">Unlimited</span> AI Queries
                                                </li>
                                                <li className="flex items-center text-sm text-white/65">
                                                    <CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                                                    Priority Support
                                                </li>
                                            </ul>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleUpgrade('professional', 'monthly')}>
                                                Upgrade to Professional
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Unlimited Plan */}
                                {true && (
                                    <Card className="bg-white/[0.04] border border-amber-900/30 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
                                        <CardHeader>
                                            <div className="w-10 h-10 rounded-lg bg-amber-900/30 text-amber-400 flex items-center justify-center mb-4">
                                                <Crown className="w-5 h-5" />
                                            </div>
                                            <CardTitle className="text-white">{PLAN_DETAILS.unlimited.name}</CardTitle>
                                            <div className="flex items-baseline mt-2">
                                                <span className="text-3xl font-bold text-white">£{PLAN_DETAILS.unlimited.prices.monthly}</span>
                                                <span className="text-white/50 ml-1">/mo</span>
                                            </div>
                                            <CardDescription className="text-white/50">Total freedom</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-3 mb-6">
                                                <li className="flex items-center text-sm text-white/65">
                                                    <CheckCircle2 className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
                                                    <span className="font-medium text-white">Unlimited</span> Bytes
                                                </li>
                                                <li className="flex items-center text-sm text-white/65">
                                                    <CheckCircle2 className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
                                                    <span className="font-medium text-white">Unlimited</span> AI Queries
                                                </li>
                                                <li className="flex items-center text-sm text-white/65">
                                                    <CheckCircle2 className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
                                                    VIP Support &amp; Features
                                                </li>
                                            </ul>
                                            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-900/20" onClick={() => handleUpgrade('unlimited', 'monthly')}>
                                                Get Unlimited
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-12 text-center">
                        <p className="text-white/50 text-sm">
                            Need help? <Link href="/contact" className="text-[#00FFB3] hover:underline">Contact Support</Link>
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
