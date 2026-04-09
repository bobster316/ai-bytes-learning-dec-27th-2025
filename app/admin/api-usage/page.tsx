"use client";

import { useEffect, useState } from "react";
import { Activity, DollarSign, Database, Server, Cpu, BrainCircuit, ExternalLink } from "lucide-react";
import { Header } from "@/components/header";

function TopUpLink({ href, label = "Top up" }: { href: string; label?: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
        >
            {label} <ExternalLink size={10} />
        </a>
    );
}

interface UsageData {
    timestamp: string;
    openRouter: { limit: number; usage: number; isFreeTier: boolean } | null;
    elevenLabs: {
        characterCount: number;
        characterLimit: number;
        charactersRemaining: number;
        tier: string;
        nextResetUnix: number | null;
    } | null;
    internalCosts: {
        providers: Record<string, number>;
        totalMonthlySpend: number;
    };
}

export default function ApiUsageDashboard() {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/admin/system-usage")
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch usage data");
                return res.json();
            })
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8 text-neutral-400 font-mono animate-pulse flex items-center gap-2"><Activity size={16} /> Fetching live API quotas...</div>;
    if (error) return <div className="p-8 text-red-400 font-mono">Error: {error}</div>;

    const orUsagePct = data?.openRouter ? (data.openRouter.usage / (data.openRouter.limit || 1)) * 100 : 0;
    const elUsagePct = data?.elevenLabs ? (data.elevenLabs.characterCount / (data.elevenLabs.characterLimit || 1)) * 100 : 0;

    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-fg)] font-sans">
            <Header />
            <div className="pt-[100px]">
                <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                                <Server className="text-blue-400" /> API Usage & Balances
                            </h1>
                            <p className="text-neutral-400 mt-2">Live quota and cost tracking across the Antigravity pipeline.</p>
                        </div>
                        <div className="text-right bg-neutral-900/50 border border-emerald-900/50 px-6 py-3 rounded-xl backdrop-blur-sm">
                            <div className="text-sm text-neutral-500 font-mono mb-1">Total Monthly Spend</div>
                            <div className="text-3xl font-bold text-emerald-400">${data?.internalCosts.totalMonthlySpend.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        {/* OpenRouter Card */}
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <BrainCircuit className="text-blue-400" size={24} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TopUpLink href="https://openrouter.ai/settings/credits" label="Add credits" />
                                        <span className="text-xs font-mono text-neutral-500 bg-neutral-800/50 px-2 py-1 rounded">OpenRouter</span>
                                    </div>
                                </div>
                                <div className="space-y-1 mb-8">
                                    <h3 className="text-lg font-semibold text-white">Language Models</h3>
                                    <p className="text-sm text-neutral-400">DeepSeek Core Generation</p>
                                </div>
                            </div>
                            
                            {data?.openRouter ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="text-3xl font-mono text-white">${data.openRouter.usage.toFixed(2)}</div>
                                        <div className="text-sm text-neutral-500 font-mono mb-1">/ ${data.openRouter.limit ? data.openRouter.limit.toFixed(2) : "Unlimited"}</div>
                                    </div>
                                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${orUsagePct > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(orUsagePct, 100)}%` }} />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-neutral-500 border border-dashed border-neutral-800 p-4 rounded text-center">API Key not configured</div>
                            )}
                        </div>

                        {/* ElevenLabs Card */}
                        <div className={`bg-neutral-900/50 border rounded-xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between ${elUsagePct > 90 ? 'border-red-700/60' : elUsagePct > 75 ? 'border-amber-700/60' : 'border-neutral-800'}`}>
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-2 rounded-lg border ${elUsagePct > 90 ? 'bg-red-500/10 border-red-500/20' : 'bg-purple-500/10 border-purple-500/20'}`}>
                                        <Activity className={elUsagePct > 90 ? 'text-red-400' : 'text-purple-400'} size={24} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {elUsagePct > 90 && (
                                            <span className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded animate-pulse">QUOTA CRITICAL</span>
                                        )}
                                        {elUsagePct > 75 && elUsagePct <= 90 && (
                                            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">LOW</span>
                                        )}
                                        <TopUpLink href="https://elevenlabs.io/app/subscription" label="Upgrade" />
                                        <span className="text-xs font-mono text-neutral-500 bg-neutral-800/50 px-2 py-1 rounded">ElevenLabs</span>
                                    </div>
                                </div>
                                <div className="space-y-1 mb-4">
                                    <h3 className="text-lg font-semibold text-white">Voice Agent</h3>
                                    <p className="text-sm text-neutral-400">Sterling TTS — {data?.elevenLabs?.tier ?? '…'}</p>
                                </div>
                            </div>

                            {data?.elevenLabs ? (
                                <div className="space-y-4">
                                    {/* Usage bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-end">
                                            <div className="text-3xl font-mono text-white">{data.elevenLabs.characterCount.toLocaleString()}</div>
                                            <div className="text-sm text-neutral-500 font-mono">/ {data.elevenLabs.characterLimit.toLocaleString()}</div>
                                        </div>
                                        <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${elUsagePct > 90 ? 'bg-red-500' : elUsagePct > 75 ? 'bg-amber-500' : 'bg-purple-500'}`}
                                                style={{ width: `${Math.min(elUsagePct, 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-neutral-500 font-mono">{elUsagePct.toFixed(1)}% used</div>
                                    </div>

                                    {/* Detail rows */}
                                    <div className="space-y-2 pt-2 border-t border-neutral-800">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500">Remaining</span>
                                            <span className={`font-mono font-semibold ${elUsagePct > 90 ? 'text-red-400' : elUsagePct > 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                {data.elevenLabs.charactersRemaining.toLocaleString()} chars
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500">Resets</span>
                                            <span className="font-mono text-neutral-300">
                                                {data.elevenLabs.nextResetUnix
                                                    ? new Date(data.elevenLabs.nextResetUnix * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : 'Unknown'}
                                            </span>
                                        </div>
                                    </div>

                                    {elUsagePct > 90 && (
                                        <div className="bg-red-950/40 border border-red-700/40 rounded-lg p-3 text-xs text-red-300 flex items-center justify-between gap-3">
                                            <span>Audio generation will fail until quota resets or plan is upgraded.</span>
                                            <a
                                                href="https://elevenlabs.io/app/subscription"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 inline-flex items-center gap-1 bg-red-500 hover:bg-red-400 text-white font-bold text-xs px-3 py-1.5 rounded transition-colors"
                                            >
                                                Upgrade now <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-neutral-500 border border-dashed border-neutral-800 p-4 rounded text-center">API Key not configured</div>
                            )}
                        </div>

                        {/* DB Logs Card */}
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                        <Database className="text-amber-400" size={24} />
                                    </div>
                                    <span className="text-xs font-mono text-neutral-500 bg-neutral-800/50 px-2 py-1 rounded">Supabase Tracked</span>
                                </div>
                                <div className="space-y-1 mb-4">
                                    <h3 className="text-lg font-semibold text-white">Local Aggregate Log</h3>
                                    <p className="text-sm text-neutral-400">All providers this month</p>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 pb-4 border-b border-neutral-800">
                                    <TopUpLink href="https://platform.openai.com/settings/organization/billing" label="OpenAI (TTS + DALL-E)" />
                                    <TopUpLink href="https://heygen.com/pricing" label="HeyGen (Avatar)" />
                                    <TopUpLink href="https://openrouter.ai/settings/credits" label="OpenRouter" />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Image Generation */}
                                <div className="flex justify-between items-center bg-neutral-800/30 p-4 rounded-xl border border-neutral-800/50">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                            Image Generation
                                        </div>
                                        <div className="pl-4">
                                            <TopUpLink href="https://fal.ai/dashboard/billing" label="Fal AI billing" />
                                        </div>
                                    </div>
                                    <div className="text-xl font-mono text-white">
                                        ${(data?.internalCosts.providers?.fal || 0).toFixed(2)}
                                    </div>
                                </div>

                                {/* Video Generation */}
                                <div className="flex justify-between items-center bg-neutral-800/30 p-4 rounded-xl border border-neutral-800/50">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                            Video Generation
                                        </div>
                                        <div className="pl-4">
                                            <TopUpLink href="https://kie.ai/pricing" label="Kie AI billing" />
                                        </div>
                                    </div>
                                    <div className="text-xl font-mono text-white">
                                        ${(data?.internalCosts.providers?.kie || 0).toFixed(2)}
                                    </div>
                                </div>

                                {/* Other Providers Catch-all */}
                                {Object.entries(data?.internalCosts.providers || {})
                                    .filter(([provider]) => provider !== 'fal' && provider !== 'kie')
                                    .map(([provider, cost]) => (
                                    <div key={provider} className="flex justify-between items-center bg-neutral-800/20 p-3 rounded-lg border border-neutral-800/30">
                                        <div className="text-sm text-neutral-400 capitalize pl-4">{provider} Task</div>
                                        <div className="text-sm font-mono text-neutral-300">${cost.toFixed(2)}</div>
                                    </div>
                                ))}

                                {Object.keys(data?.internalCosts.providers || {}).length === 0 && (
                                    <div className="text-sm text-neutral-500 text-center py-4 border border-dashed border-neutral-800 rounded">No spending logged this month</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
