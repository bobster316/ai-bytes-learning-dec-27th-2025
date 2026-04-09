import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient(true);
    
    // 1. Fetch OpenRouter Balance
    let openRouterUsage = null;
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const orRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }
        });
        if (orRes.ok) {
          const data = await orRes.json();
          openRouterUsage = {
            limit: data.data?.limit,
            usage: data.data?.usage,
            isFreeTier: data.data?.is_free_tier
          };
        }
      } catch (e) {
        console.error("OpenRouter fetch error", e);
      }
    }

    // 2. Fetch ElevenLabs Usage
    let elevenLabsUsage = null;
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const elRes = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }
        });
        if (elRes.ok) {
          const data = await elRes.json();
          const count = data.subscription?.character_count ?? 0;
          const limit = data.subscription?.character_limit ?? 0;
          elevenLabsUsage = {
            characterCount: count,
            characterLimit: limit,
            charactersRemaining: Math.max(0, limit - count),
            tier: data.subscription?.tier ?? 'unknown',
            nextResetUnix: data.subscription?.next_character_count_reset_unix ?? null,
          };
        }
      } catch (e) {
        console.error("ElevenLabs fetch error", e);
      }
    }

    // 3. Fetch Internal Aggregates from Supabase
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const { data: costData, error: costError } = await supabase
      .from('api_cost_logs')
      .select('provider, cost_usd')
      .gte('created_at', startOfMonth.toISOString());

    const providerCosts: Record<string, number> = {};
    let totalSpend = 0;
    if (!costError && costData) {
      costData.forEach(row => {
        const cost = typeof row.cost_usd === 'number' ? row.cost_usd : parseFloat(row.cost_usd || '0');
        providerCosts[row.provider] = (providerCosts[row.provider] || 0) + cost;
        totalSpend += cost;
      });
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      openRouter: openRouterUsage,
      elevenLabs: elevenLabsUsage,
      internalCosts: {
        providers: providerCosts,
        totalMonthlySpend: totalSpend
      }
    });

  } catch (error: any) {
    console.error("[API] System usage fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
