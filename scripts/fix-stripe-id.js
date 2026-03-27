const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover', // API Version from config
});

async function fixStripeId() {
    const email = 'rav.khangurra@gmail.com';
    console.log(`Fixing Stripe ID for ${email}...`);

    // 1. Get User
    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error("User not found!");
        return;
    }

    // 2. Get Real Stripe Customer
    console.log("Fetching Stripe Customer...");
    const customers = await stripe.customers.list({ email: email, limit: 1 });

    if (customers.data.length === 0) {
        console.error("No Stripe customer found for this email. (Did you complete checkout?)");
        // If not found, we can't fix it.
        return;
    }

    const realId = customers.data[0].id;
    console.log(`Found Real Stripe ID: ${realId}`);

    // 3. Update DB
    const { error } = await supabase
        .from('user_subscriptions')
        .update({ stripe_customer_id: realId })
        .eq('user_id', user.id);

    if (error) console.error("DB Error:", error);
    else console.log("Success! Database updated with real Stripe ID.");
}

fixStripeId();
