import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Stripe webhook handler
export async function POST(request: NextRequest) {
    try {
        if (!isStripeConfigured()) {
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
        }

        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'No signature' }, { status: 400 });
        }

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET || ''
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const supabase = await createClient();

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(supabase, session);
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionChange(supabase, subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionCanceled(supabase, subscription);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentFailed(supabase, invoice);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}

// Handle successful checkout
async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
    const userId = session.metadata?.supabase_user_id || (session as any).subscription_data?.metadata?.supabase_user_id;

    if (!userId) {
        console.error('No user ID in checkout session metadata');
        return;
    }

    // Subscription will be updated via the subscription.created event
    console.log(`Checkout completed for user ${userId}`);
}

// Handle subscription creation or update
async function handleSubscriptionChange(supabase: any, subscription: Stripe.Subscription) {
    let userId = subscription.metadata?.supabase_user_id;

    if (!userId) {
        // Try to find user by customer ID
        const customerId = subscription.customer as string;
        const { data } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();

        if (data?.user_id) {
            userId = data.user_id;
        } else {
            console.error('Cannot find user for subscription:', subscription.id);
            return;
        }
    }

    const plan = subscription.metadata?.plan || 'byte_pass';
    const billingCycle = subscription.metadata?.billing_cycle || 'monthly';

    // Map subscription status
    let status = 'active';
    if (subscription.status === 'trialing') status = 'trialing';
    else if (subscription.status === 'past_due') status = 'past_due';
    else if (subscription.status === 'canceled') status = 'canceled';
    else if (subscription.status === 'active') status = 'active';
    else status = subscription.status; // Fallback

    // Update subscription in database
    const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: userId,
            plan: plan,
            billing_cycle: billingCycle,
            status: status,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer, // Ensure customer ID is saved
            stripe_price_id: subscription.items.data[0]?.price.id,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            // trial_end might be null, check before converting
            trial_end: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    if (error) {
        console.error('Failed to upsert subscription:', error);
    } else {
        console.log(`Subscription updated for user ${userId}: ${plan} (${status})`);
    }
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(supabase: any, subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find user by customer ID
    const { data } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!data?.user_id) {
        console.error('Cannot find user for canceled subscription:', subscription.id);
        return;
    }

    // Downgrade to free plan
    await supabase
        .from('user_subscriptions')
        .update({
            plan: 'free',
            status: 'canceled',
            billing_cycle: null,
            stripe_subscription_id: null,
            stripe_price_id: null,
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', data.user_id);

    console.log(`Subscription canceled for user ${data.user_id}, downgraded to free`);
}

// Handle failed payment
async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    // Find user by customer ID
    const { data } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!data?.user_id) {
        console.error('Cannot find user for failed payment:', invoice.id);
        return;
    }

    // Update status to past_due
    await supabase
        .from('user_subscriptions')
        .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', data.user_id);

    console.log(`Payment failed for user ${data.user_id}`);
}
