"use client";

import { useState, useEffect } from "react";
import { getUnifiedApiStatus, ApiStatus } from "@/app/actions/api-usage-actions";
import {
    RefreshCcw,
    Zap,
    Mic,
    Server,
    Image as ImageIcon,
    MessageSquare,
    AlertCircle,
    CreditCard
} from "lucide-react";

export function ApiUsageDashboard() {
    const [statuses, setStatuses] = useState<ApiStatus[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchStatuses() {
        setLoading(true);
        try {
            const data = await getUnifiedApiStatus();
            setStatuses(data);
        } catch (err) {
            console.error("Failed to fetch API statuses", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchStatuses();
    }, []);

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case "HeyGen": return <Zap className="w-3.5 h-3.5" />;
            case "ElevenLabs": return <Mic className="w-3.5 h-3.5" />;
            case "OpenAI":
            case "Gemini": return <MessageSquare className="w-3.5 h-3.5" />;
            case "Replicate":
            case "Midjourney":
            case "Pexels": return <ImageIcon className="w-3.5 h-3.5" />;
            case "Stripe": return <CreditCard className="w-3.5 h-3.5" />;
            default: return <Server className="w-3.5 h-3.5" />;
        }
    };

    if (loading) {
        return (
            <div className="flex gap-2 items-center">
                <div className="h-9 w-32 bg-white/5 animate-pulse rounded-full border border-white/10" />
                <div className="h-9 w-32 bg-white/5 animate-pulse rounded-full border border-white/10" />
                <div className="h-9 w-24 bg-white/5 animate-pulse rounded-full border border-white/10" />
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-2 pb-2 pt-2">
            {/* Refresh Button */}
            <button
                onClick={fetchStatuses}
                disabled={loading}
                className={`shrink-0 p-2 rounded-full hover:bg-white/10 transition-colors ${loading ? "animate-spin opacity-50" : "text-white/40 hover:text-white"}`}
                title="Refresh API Statuses"
            >
                <RefreshCcw className="w-4 h-4" />
            </button>

            {statuses.map((s) => {
                if (s.type === "quota") {
                    if (s.provider === "HeyGen" && s.data) {
                        const isLow = s.data.remaining_seconds < 300;
                        return (
                            <div
                                key={s.provider}
                                title={`HeyGen (Video Gen)\nRemaining: ${s.data.remaining_seconds}s\nRate: £${s.data.cost_per_minute_gbp.toFixed(2)}/min`}
                                className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 cursor-default ${isLow ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-white/5 border-white/10 text-white/80 hover:border-violet-400/50"}`}
                            >
                                <div className={`p-1 rounded-full ${isLow ? "bg-amber-500 text-white" : "bg-violet-600 text-white"}`}>
                                    {getProviderIcon(s.provider)}
                                </div>
                                <div className="flex flex-col pr-1">
                                    <span className="text-[9px] font-bold uppercase tracking-widest leading-none opacity-60">HeyGen</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-xs font-bold leading-none">{(s.data.remaining_seconds / 60).toFixed(1)}m</span>
                                        <span className="text-[10px] font-semibold opacity-40">/</span>
                                        <span className="text-xs font-bold text-emerald-400 leading-none">£{s.data.estimated_gbp_remaining.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    if (s.provider === "ElevenLabs" && s.data) {
                        const isLow = s.data.usage_percent > 90;
                        return (
                            <div
                                key={s.provider}
                                title={`ElevenLabs (Voice Gen)\nRemaining: ${s.data.characters_remaining.toLocaleString()} chars\nUsage: ${s.data.character_count.toLocaleString()} / ${s.data.character_limit.toLocaleString()}`}
                                className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 cursor-default ${isLow ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-white/5 border-white/10 text-white/80 hover:border-blue-400/50"}`}
                            >
                                <div className={`p-1 rounded-full ${isLow ? "bg-amber-500 text-white" : "bg-blue-600 text-white"}`}>
                                    {getProviderIcon(s.provider)}
                                </div>
                                <div className="flex flex-col pr-1">
                                    <span className="text-[9px] font-bold uppercase tracking-widest leading-none opacity-60">ElevenLabs</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-xs font-bold leading-none">{Math.round(s.data.usage_percent)}%</span>
                                        <span className="text-[10px] font-semibold opacity-40">Used</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Error State for quota tools
                    return (
                        <div key={s.provider} className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm bg-red-500/20 border-red-500/40 text-red-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{s.provider} Error</span>
                        </div>
                    );
                }

                // Status Only Tools (Gemini, Stripe, etc.)
                return (
                    <div
                        key={s.provider}
                        title={`${s.provider}\n${s.connected ? 'Operational (Key Configured)' : 'Missing Configuration (' + s.error + ')'}`}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 cursor-default ${s.connected ? "bg-white/5 border-white/10 text-white/80" : "bg-red-500/20 border-red-500/40 text-red-400 px-4"}`}
                    >
                        <div className={`shrink-0 w-2 h-2 rounded-full ${s.connected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 animate-pulse"}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none max-w-[80px] truncate">{s.provider}</span>
                    </div>
                );
            })}
        </div>
    );
}

// Add a slight scrollbar hide style for cleaner UI
const globalStyles = `
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = globalStyles;
    document.head.appendChild(style);
}
