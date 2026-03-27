"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Crown, Zap, ArrowRight, LogIn } from "lucide-react";
import Link from "next/link";

interface AccessBlockedProps {
    reason: string;
    plan: string;
    bytesUsed?: number;
    bytesLimit?: number;
    isLoggedOut?: boolean;
}

export function AccessBlocked({ reason, plan, bytesUsed, bytesLimit, isLoggedOut }: AccessBlockedProps) {
    const handleUpgrade = async (selectedPlan: string, cycle: string) => {
        try {
            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: selectedPlan, billingCycle: cycle }),
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Error creating checkout:', error);
        }
    };

    if (isLoggedOut) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-8">
                <Card className="max-w-md w-full border-primary/20">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <LogIn className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">Sign In to Continue</h2>
                        <p className="text-foreground/60 mb-6">{reason}</p>
                        <div className="space-y-3">
                            <Link href="/auth/signin" className="block">
                                <Button className="w-full" size="lg">
                                    Sign In <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/auth/signup" className="block">
                                <Button variant="outline" className="w-full" size="lg">
                                    Create Free Account
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
            <Card className="max-w-lg w-full border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-amber-500" />
                    </div>

                    <h2 className="text-2xl font-bold mb-3">Upgrade to Continue</h2>
                    <p className="text-foreground/60 mb-4">{reason}</p>

                    {bytesUsed !== undefined && bytesLimit !== undefined && (
                        <div className="mb-6 p-4 rounded-xl bg-background/50 border border-border">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-foreground/60">Bytes used</span>
                                <span className="font-bold">{bytesUsed} / {bytesLimit}</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (bytesUsed / bytesLimit) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {plan === 'free' && (
                            <Button
                                className="w-full bg-cyan-500 hover:bg-cyan-600"
                                size="lg"
                                onClick={() => handleUpgrade('byte_pass', 'monthly')}
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Get Byte Pass - £9/month
                            </Button>
                        )}

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={() => handleUpgrade('unlimited', 'monthly')}
                        >
                            <Crown className="w-4 h-4 mr-2" />
                            Go Unlimited - £39/month
                        </Button>

                        <Link href="/pricing" className="block">
                            <Button variant="ghost" className="w-full text-foreground/60">
                                View all plans
                            </Button>
                        </Link>
                    </div>

                    <p className="text-xs text-foreground/40 mt-4">
                        All plans include a 7-day free trial. Cancel anytime.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
