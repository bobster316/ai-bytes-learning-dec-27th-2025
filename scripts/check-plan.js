const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Error: Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const email = 'rav.khangurra@gmail.com';
    console.log(`Checking plan for ${email}...`);

    // List users (first 1000)
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (error) {
        console.error('Auth Error:', error.message);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log('User NOT found in Auth system.');
        console.log('Available users (first 5):');
        users.slice(0, 5).forEach(u => console.log(`- ${u.email}`));
        return;
    }

    console.log(`User ID: ${user.id}`);

    const { data: sub, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (subError && subError.code !== 'PGRST116') {
        console.error('DB Error:', subError.message);
        return;
    }

    if (!sub) {
        console.log('Plan: Free (No DB entry)');
    } else {
        console.log(`Plan: ${sub.plan ? sub.plan.toUpperCase() : 'UNKNOWN'}`);
        console.log(`Status: ${sub.status}`);
        console.log(`Billing: ${sub.billing_cycle}`);
    }
}

check();
