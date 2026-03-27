const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upgrade() {
    const email = 'rav.khangurra@gmail.com';
    console.log(`Upgrading ${email} to Professional...`);

    // 1. Get User
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (listError) {
        console.error("List users error:", listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log(`Found user ${user.id}`);

    // 2. Upsert Subscription
    const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: user.id,
            stripe_customer_id: 'cus_SIMULATED_PRO_' + Date.now(),
            plan: 'professional',
            status: 'active',
            billing_cycle: 'monthly',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

    if (error) console.error("Error updating DB:", error);
    else console.log("Success! User upgraded to Professional.");
}

upgrade();
