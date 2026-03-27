import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

// Create Stripe Customer Portal session for managing billing
export async function POST(request: NextRequest) {
    try {
        if (!isStripeConfigured()) {
            return NextResponse.json(
                { error: 'Stripe is not configured.' },
                { status: 500 }
            );
        }

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'You must be logged in.' },
                { status: 401 }
            );
        }

        // Get user's Stripe customer ID
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        if (!subscription?.stripe_customer_id) {
            return NextResponse.json(
                { error: 'No billing information found. Please subscribe first.' },
                { status: 400 }
            );
        }

        // Create Customer Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: `${request.nextUrl.origin}/account/subscription`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Customer portal error:', error);
        return NextResponse.json(
            { error: 'Failed to create billing portal session.' },
            { status: 500 }
        );
    }
}
