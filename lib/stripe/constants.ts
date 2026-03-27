// Price IDs from Stripe Dashboard
export const STRIPE_PRICE_IDS = {
    byte_pass: { // "Standard" Plan maps to "byte_pass" in DB
        monthly: process.env.STRIPE_PRICE_STANDARD_MONTHLY || '',
        annual: process.env.STRIPE_PRICE_STANDARD_ANNUAL || '',
    },
    professional: {
        monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || '',
        annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL || '',
    },
    unlimited: {
        monthly: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || '',
        annual: process.env.STRIPE_PRICE_UNLIMITED_ANNUAL || '',
    },
} as const;

// Plan details for display
export const PLAN_DETAILS = {
    free: {
        name: 'Free',
        bytesPerMonth: 3,
        isLifetimeBytes: true,
        aiQueriesPerMonth: 5,
    },
    byte_pass: {
        name: 'Standard', // Display Name
        bytesPerMonth: 5,
        aiQueriesPerMonth: 50,
        prices: { monthly: 15, annual: 144 },
    },
    professional: {
        name: 'Professional',
        bytesPerMonth: 15,
        aiQueriesPerMonth: -1, // Unlimited
        prices: { monthly: 25, annual: 240 },
    },
    unlimited: {
        name: 'Unlimited',
        bytesPerMonth: -1, // Unlimited
        aiQueriesPerMonth: -1, // Unlimited
        prices: { monthly: 35, annual: 336 },
    },
    enterprise: {
        name: 'Enterprise',
        bytesPerMonth: -1, // Unlimited
        aiQueriesPerMonth: -1, // Unlimited
        teamSize: -1, // Unlimited
        prices: null, // Custom pricing
    },
} as const;
export type PlanType = keyof typeof PLAN_DETAILS;
export type BillingCycle = 'monthly' | 'annual';

// Get price ID for a plan and billing cycle
export function getPriceId(plan: Exclude<PlanType, 'free' | 'enterprise'>, cycle: BillingCycle): string {
    return STRIPE_PRICE_IDS[plan][cycle];
}
