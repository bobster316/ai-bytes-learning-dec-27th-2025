import { createClient } from "@/lib/supabase/server";
import { PLAN_DETAILS, PlanType } from "@/lib/stripe/constants";

export type SubscriptionPlan = PlanType | 'byte_pass'; // Add 'byte_pass' legacy or one-off if needed, else just PlanType

export interface SubscriptionCheck {
    hasAccess: boolean;
    plan: SubscriptionPlan;
    reason?: string;
    bytesUsed?: number;
    bytesLimit?: number;
    isNewByte?: boolean;
}

const getPlanLimits = (plan: SubscriptionPlan) => {
    if (plan === 'byte_pass') return { bytes: 5, isLifetime: false }; // Handle custom legacy logic

    // Fallback for types
    const p = plan as PlanType;
    const details = PLAN_DETAILS[p] || PLAN_DETAILS.free;

    return {
        bytes: details.bytesPerMonth,
        isLifetime: (details as any).isLifetimeBytes || false
    };
};

/**
 * Server-side function to check if a user can access a specific lesson/byte
 */
export async function checkLessonAccess(userId: string | undefined, lessonId: string): Promise<SubscriptionCheck> {
    // If no user, they can view preview but not full content
    if (!userId) {
        return {
            hasAccess: false,
            plan: 'free',
            reason: 'Please sign in to access this lesson.',
        };
    }

    const supabase = await createClient();

    // Get user's subscription
    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan, status')
        .eq('user_id', userId)
        .single();

    const plan: SubscriptionPlan = (subscription?.plan as SubscriptionPlan) || 'free';
    const status = subscription?.status || 'active';

    // Check subscription status
    if (status === 'past_due') {
        return {
            hasAccess: false,
            plan,
            reason: 'Your payment is past due. Please update your payment method to continue.',
        };
    }


    // Unlimited plans have full access
    const limits = getPlanLimits(plan);
    if (limits.bytes === -1) {
        return { hasAccess: true, plan };
    }

    // Get current usage period
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get usage data
    const { data: usage } = await supabase
        .from('user_usage')
        .select('bytes_accessed, accessed_byte_ids')
        .eq('user_id', userId)
        .eq('usage_period', period)
        .single();

    const accessedIds: string[] = usage?.accessed_byte_ids || [];
    const bytesUsed = limits.isLifetime ? accessedIds.length : (usage?.bytes_accessed || 0);

    // Check if already accessed this lesson (always allowed)
    if (accessedIds.includes(lessonId)) {
        return {
            hasAccess: true,
            plan,
            bytesUsed,
            bytesLimit: limits.bytes,
            isNewByte: false,
        };
    }

    // Check if limit reached
    if (bytesUsed >= limits.bytes) {
        return {
            hasAccess: false,
            plan,
            bytesUsed,
            bytesLimit: limits.bytes,
            reason: plan === 'free'
                ? `You've used your ${limits.bytes} free bytes. Upgrade to continue learning.`
                : `You've reached your ${limits.bytes} bytes limit for this month. Upgrade for unlimited access.`,
        };
    }

    // Access allowed - this is a new byte
    return {
        hasAccess: true,
        plan,
        bytesUsed,
        bytesLimit: limits.bytes,
        isNewByte: true,
    };
}

/**
 * Record that a user accessed a lesson (call after successful access)
 */
export async function recordLessonAccess(userId: string, lessonId: string): Promise<void> {
    const supabase = await createClient();

    // Use the database function to increment usage
    await supabase.rpc('increment_byte_access', {
        p_user_id: userId,
        p_byte_id: lessonId,
    });
}
