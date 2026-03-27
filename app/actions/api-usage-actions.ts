"use server";

import { heyGenService, HeyGenCreditsInfo } from "@/lib/services/heygen-service";
import { elevenLabsService, ElevenLabsUsageQuota } from "@/lib/services/elevenlabs-service";

export interface ApiStatus {
    provider: string;
    type: "quota" | "status";
    connected: boolean;
    data?: any;
    error?: string;
}

export async function getUnifiedApiStatus(): Promise<ApiStatus[]> {
    const statuses: ApiStatus[] = [];

    // 1. HeyGen (Quota)
    try {
        const heyGenCredits = await heyGenService.checkCredits();
        statuses.push({
            provider: "HeyGen",
            type: "quota",
            connected: true,
            data: heyGenCredits
        });
    } catch (e: any) {
        statuses.push({
            provider: "HeyGen",
            type: "quota",
            connected: false,
            error: e.message || "Failed to fetch HeyGen quota"
        });
    }

    // 2. ElevenLabs (Quota)
    try {
        const elevenLabsQuota = await elevenLabsService.checkUsageQuota();
        statuses.push({
            provider: "ElevenLabs",
            type: "quota",
            connected: true,
            data: elevenLabsQuota
        });
    } catch (e: any) {
        statuses.push({
            provider: "ElevenLabs",
            type: "quota",
            connected: false,
            error: e.message || "Failed to fetch ElevenLabs quota"
        });
    }

    // 3. Status-only Indicators
    const statusProviders = [
        { name: "Gemini", envKey: "GEMINI_API_KEY" },
        { name: "OpenAI", envKey: "OPENAI_API_KEY" },
        { name: "Replicate", envKey: "REPLICATE_API_TOKEN" },
        { name: "Midjourney", envKey: "MIDJOURNEY_API_KEY" },
        { name: "Pexels", envKey: "PEXELS_API_KEY" },
        { name: "Stripe", envKey: "STRIPE_SECRET_KEY" }
    ];

    for (const provider of statusProviders) {
        const isConnected = !!process.env[provider.envKey];
        statuses.push({
            provider: provider.name,
            type: "status",
            connected: isConnected,
            error: isConnected ? undefined : "Missing API Key"
        });
    }

    return statuses;
}
