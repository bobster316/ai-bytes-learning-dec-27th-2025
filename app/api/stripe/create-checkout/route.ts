import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe/config';
import { getPriceId, PlanType, BillingCycle } from '@/lib/stripe/constants';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // Check if Stripe is configured
        if (!isStripeConfigured()) {
            return NextResponse.json(
                { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' },
                { status: 500 }
            );
        }

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'You must be logged in to subscribe.' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { plan, billingCycle } = body as { plan: PlanType; billingCycle: BillingCycle };

        // Validate plan
        const validPlans = ['standard', 'unlimited', 'professional'];
        if (!plan || !validPlans.includes(plan as string)) {
            return NextResponse.json(
                { error: `Invalid plan selected. Must be one of: ${validPlans.join(', ')}` },
                { status: 400 }
            );
        }

        // Get price ID
        const selectedPlan = plan as Exclude<PlanType, 'free' | 'enterprise'>;
        const selectedCycle = billingCycle || 'monthly';
        const priceId = getPriceId(selectedPlan, selectedCycle);

        if (!priceId) {
            console.error(`Price ID not found for plan: ${selectedPlan}, cycle: ${selectedCycle}`);
            return NextResponse.json(
                { error: 'Price not configured for this plan. Please contact support.' },
                { status: 500 }
            );
        }

        // Check if user already has a Stripe customer ID
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        let customerId = subscription?.stripe_customer_id;

        // Create new Stripe customer if needed
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id,
                },
            });
            customerId = customer.id;

            // Save customer ID to database
            await supabase
                .from('user_subscriptions')
                .upsert({
                    user_id: user.id,
                    stripe_customer_id: customerId,
                });
        }

        // Create Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${request.nextUrl.origin}/account/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
            subscription_data: {
                metadata: {
                    supabase_user_id: user.id,
                    plan: plan,
                    billing_cycle: billingCycle,
                },
                // Only Apply 7-day free trial for Unlimited plan
                trial_period_days: plan === 'unlimited' ? 7 : undefined,
            },
            allow_promotion_codes: true,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
