"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Crown, Zap, ArrowRight, CheckCircle2, X } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: string;
    currentPlan?: string;
}

export function UpgradeModal({ isOpen, onClose, reason, currentPlan = 'free' }: UpgradeModalProps) {
    const [loading, setLoading] = useState<string | null>(null);

    const handleUpgrade = async (plan: string, cycle: string) => {
        setLoading(plan);
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
        } finally {
            setLoading(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Upgrade to Continue Learning</DialogTitle>
                    <DialogDescription>
                        {reason || "You've reached your plan limit. Upgrade to unlock more content."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Byte Pass Option */}
                    {currentPlan === 'free' && (
                        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                        <Zap className="w-5 h-5 text-cyan-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">Byte Pass</h3>
                                        <p className="text-sm text-foreground/60 mb-2">Perfect for casual learners</p>
                                        <ul className="text-sm space-y-1">
                                            <li className="flex items-center gap-2 text-foreground/70">
                                                <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                                                5 bytes per month
                                            </li>
                                            <li className="flex items-center gap-2 text-foreground/70">
                                                <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                                                50 AI queries per month
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-foreground">£9</p>
                                    <p className="text-xs text-foreground/50">/month</p>
                                </div>
                            </div>
                            <Button
                                className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600"
                                onClick={() => handleUpgrade('byte_pass', 'monthly')}
                                disabled={!!loading}
                            >
                                {loading === 'byte_pass' ? 'Loading...' : 'Choose Byte Pass'}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}

                    {/* Unlimited Option */}
                    <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary/50 transition-colors relative">
                        <div className="absolute -top-3 left-4">
                            <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                                BEST VALUE
                            </span>
                        </div>
                        <div className="flex items-start justify-between pt-2">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Crown className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">Unlimited Bytes</h3>
                                    <p className="text-sm text-foreground/60 mb-2">For serious learners</p>
                                    <ul className="text-sm space-y-1">
                                        <li className="flex items-center gap-2 text-foreground/70">
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                            Unlimited access to all bytes
                                        </li>
                                        <li className="flex items-center gap-2 text-foreground/70">
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                            Unlimited AI companion
                                        </li>
                                        <li className="flex items-center gap-2 text-foreground/70">
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                            Early access to new content
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-foreground">£39</p>
                                <p className="text-xs text-foreground/50">/month</p>
                            </div>
                        </div>
                        <Button
                            className="w-full mt-4"
                            onClick={() => handleUpgrade('unlimited', 'monthly')}
                            disabled={!!loading}
                        >
                            {loading === 'unlimited' ? 'Loading...' : 'Choose Unlimited'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>

                    <p className="text-center text-xs text-foreground/50">
                        All plans include a 7-day free trial. Cancel anytime.
                    </p>

                    <div className="text-center">
                        <Link
                            href="/pricing"
                            className="text-sm text-primary hover:underline"
                            onClick={onClose}
                        >
                            View all pricing options
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
