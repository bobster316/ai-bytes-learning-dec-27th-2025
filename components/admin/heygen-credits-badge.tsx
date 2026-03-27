"use client";

import { useState, useEffect } from "react";
import { getHeyGenCredits } from "@/app/actions/heygen-actions";
import { Badge } from "@/components/ui/badge";
import {
    Coins,
    RefreshCcw,
    AlertCircle,
    ExternalLink,
    Zap,
    Clock
} from "lucide-react";
// import {
//     Tooltip,
//     TooltipContent,
//     TooltipProvider,
//     TooltipTrigger,
// } from "@/components/ui/tooltip";
import { HeyGenCreditsInfo } from "@/lib/services/heygen-service";

export function HeyGenCreditsBadge() {
    const [credits, setCredits] = useState<HeyGenCreditsInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchCredits() {
        setLoading(true);
        setError(null);
        try {
            const result = await getHeyGenCredits();
            if (result.success && result.credits) {
                setCredits(result.credits);
            } else {
                setError(result.error || "Failed to load balance");
            }
        } catch (err) {
            setError("Connection error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCredits();
    }, []);

    if (error) {
        return (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 gap-1.5 py-1.5 px-3">
                <AlertCircle className="w-3.5 h-3.5" />
                Error loading balance
                <button onClick={fetchCredits} className="ml-1 hover:rotate-180 transition-transform duration-500">
                    <RefreshCcw className="w-3 h-3" />
                </button>
            </Badge>
        );
    }

    if (loading || !credits) {
        return (
            <div className="h-9 w-40 bg-slate-100 animate-pulse rounded-full border border-slate-200" />
        );
    }

    const isLow = credits.remaining_seconds < 300; // Less than 5 mins

    return (
        <div className="flex items-center gap-3">
            <div
                title={`Account Quota: ${credits.remaining_seconds}s remaining\nRate: £${credits.cost_per_minute_gbp.toFixed(2)}/min`}
                className={`
                flex items-center gap-2.5 px-4 py-1.5 rounded-full border shadow-sm transition-all duration-300 cursor-default
                ${isLow
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-white border-slate-200 text-slate-700 hover:border-violet-300 hover:shadow-md"
                    }
            `}>
                <div className={`p-1 rounded-full ${isLow ? "bg-amber-500" : "bg-violet-600"}`}>
                    <Zap className="w-3 h-3 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none opacity-60">
                        Credits Remaining
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-bold leading-none">
                            {(credits.remaining_seconds / 60).toFixed(1)}m
                        </span>
                        <span className="text-xs font-semibold opacity-40">/</span>
                        <span className="text-xs font-bold text-emerald-600 leading-none">
                            £{credits.estimated_gbp_remaining.toFixed(2)}
                        </span>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        fetchCredits();
                    }}
                    disabled={loading}
                    className={`ml-1 hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin" : ""}`}
                >
                    <RefreshCcw className="w-3 h-3 opacity-40 hover:opacity-100" />
                </button>
            </div>
        </div>
    );
}
