import { createClient } from '@/lib/supabase/client';
import { PLAN_DETAILS, PlanType } from '@/lib/stripe/constants';

export interface UserSubscription {
    id: string;
    user_id: string;
    plan: PlanType;
    billing_cycle: 'monthly' | 'annual' | null;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    current_period_start: string | null;
    current_period_end: string | null;
    trial_end: string | null;
}

export interface UserUsage {
    bytes_accessed: number;
    ai_queries_used: number;
    accessed_byte_ids: string[];
}

export interface UsageQuota {
    bytesUsed: number;
    bytesLimit: number;
    bytesRemaining: number;
    aiQueriesUsed: number;
    aiQueriesLimit: number;
    aiQueriesRemaining: number;
    isUnlimited: boolean;
}

// Get user's current subscription
export async function getSubscription(userId: string): Promise<UserSubscription | null> {
    const supabase = createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        // Return default free subscription if none exists
        return {
            id: '',
            user_id: userId,
            plan: 'free',
            billing_cycle: null,
            status: 'active',
            current_period_start: null,
            current_period_end: null,
            trial_end: null,
        };
    }

    return data as UserSubscription;
}

// Get user's usage for current period
export async function getCurrentUsage(userId: string): Promise<UserUsage> {
    const supabase = createClient();
    if (!supabase) {
        return { bytes_accessed: 0, ai_queries_used: 0, accessed_byte_ids: [] };
    }

    const period = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const { data, error } = await supabase
        .from('user_usage')
        .select('bytes_accessed, ai_queries_used, accessed_byte_ids')
        .eq('user_id', userId)
        .eq('usage_period', period)
        .single();

    if (error || !data) {
        return { bytes_accessed: 0, ai_queries_used: 0, accessed_byte_ids: [] };
    }

    return data as UserUsage;
}

// Get remaining quota for user
export async function getRemainingQuota(userId: string): Promise<UsageQuota> {
    const [subscription, usage] = await Promise.all([
        getSubscription(userId),
        getCurrentUsage(userId),
    ]);

    const plan = subscription?.plan || 'free';
    const planDetails = PLAN_DETAILS[plan];

    const bytesLimit = planDetails.bytesPerMonth;
    const aiQueriesLimit = planDetails.aiQueriesPerMonth;

    // For free tier, count unique bytes accessed (lifetime limit)
    const bytesUsed = plan === 'free'
        ? (usage.accessed_byte_ids?.length || 0)
        : usage.bytes_accessed;

    const isUnlimited = bytesLimit === -1;

    return {
        bytesUsed,
        bytesLimit: isUnlimited ? -1 : bytesLimit,
        bytesRemaining: isUnlimited ? -1 : Math.max(0, bytesLimit - bytesUsed),
        aiQueriesUsed: usage.ai_queries_used,
        aiQueriesLimit: aiQueriesLimit === -1 ? -1 : aiQueriesLimit,
        aiQueriesRemaining: aiQueriesLimit === -1 ? -1 : Math.max(0, aiQueriesLimit - usage.ai_queries_used),
        isUnlimited,
    };
}

// Check if user can access a specific byte/lesson
export async function canAccessByte(userId: string, byteId: string): Promise<{
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
}> {
    const [subscription, usage] = await Promise.all([
        getSubscription(userId),
        getCurrentUsage(userId),
    ]);

    const plan = subscription?.plan || 'free';
    const planDetails = PLAN_DETAILS[plan];

    // Check subscription status
    if (subscription?.status === 'past_due') {
        return {
            allowed: false,
            reason: 'Your payment is past due. Please update your payment method.',
            upgradeRequired: true,
        };
    }

    // Unlimited plans have no restrictions
    if (planDetails.bytesPerMonth === -1) {
        return { allowed: true };
    }

    // Free tier: check if already accessed (allowed) or if limit reached
    if (plan === 'free') {
        const accessedIds = usage.accessed_byte_ids || [];

        // Already accessed this byte - always allowed
        if (accessedIds.includes(byteId)) {
            return { allowed: true };
        }

        // Check if limit reached
        if (accessedIds.length >= planDetails.bytesPerMonth) {
            return {
                allowed: false,
                reason: `You've used your ${planDetails.bytesPerMonth} free bytes. Upgrade to continue learning.`,
                upgradeRequired: true,
            };
        }

        return { allowed: true };
    }

    // Paid plans: check monthly limit
    if (usage.bytes_accessed >= planDetails.bytesPerMonth) {
        return {
            allowed: false,
            reason: `You've reached your ${planDetails.bytesPerMonth} bytes limit for this month. Upgrade for unlimited access.`,
            upgradeRequired: true,
        };
    }

    return { allowed: true };
}

// Check if user can use AI companion
export async function canUseAI(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    remaining?: number;
}> {
    const [subscription, usage] = await Promise.all([
        getSubscription(userId),
        getCurrentUsage(userId),
    ]);

    const plan = subscription?.plan || 'free';
    const planDetails = PLAN_DETAILS[plan];

    // Unlimited AI queries
    if (planDetails.aiQueriesPerMonth === -1) {
        return { allowed: true, remaining: -1 };
    }

    const remaining = planDetails.aiQueriesPerMonth - usage.ai_queries_used;

    if (remaining <= 0) {
        return {
            allowed: false,
            reason: `You've used all ${planDetails.aiQueriesPerMonth} AI queries for this month. Upgrade for more.`,
            remaining: 0,
        };
    }

    return { allowed: true, remaining };
}

// Record byte access (call after user accesses a byte)
export async function recordByteAccess(userId: string, byteId: string): Promise<void> {
    const supabase = createClient();
    if (!supabase) return;

    // Call the database function to increment usage
    await supabase.rpc('increment_byte_access', {
        p_user_id: userId,
        p_byte_id: byteId,
    });
}

// Record AI query usage
export async function recordAIQuery(userId: string): Promise<void> {
    const supabase = createClient();
    if (!supabase) return;

    // Call the database function to increment usage
    await supabase.rpc('increment_ai_query', {
        p_user_id: userId,
    });
}

// Check if user is on a team (Professional tier member)
export async function isTeamMember(userId: string): Promise<{
    isTeam: boolean;
    ownerUserId?: string;
}> {
    const supabase = createClient();
    if (!supabase) return { isTeam: false };

    const { data } = await supabase
        .from('team_members')
        .select('owner_user_id')
        .eq('member_user_id', userId)
        .eq('status', 'accepted')
        .single();

    if (data?.owner_user_id) {
        return { isTeam: true, ownerUserId: data.owner_user_id };
    }

    return { isTeam: false };
}

// Get effective subscription (own or team owner's)
export async function getEffectiveSubscription(userId: string): Promise<UserSubscription | null> {
    // Check if user is a team member first
    const teamStatus = await isTeamMember(userId);

    if (teamStatus.isTeam && teamStatus.ownerUserId) {
        // Return team owner's subscription
        return getSubscription(teamStatus.ownerUserId);
    }

    // Return user's own subscription
    return getSubscription(userId);
}
