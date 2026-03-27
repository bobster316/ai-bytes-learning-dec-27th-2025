
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Config:", {
    url: supabaseUrl,
    hasKey: !!supabaseServiceKey
});

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

async function diagnose() {
    console.log('--- DIAGNOSTIC START ---');

    // 1. Check a simple table (profiles) - less likely to be locked
    try {
        console.log("Checking 'profiles' table...");
        const start = Date.now();
        const { data, error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        console.log(`Profiles Payload:`, { data, error });
        console.log(`Profiles responded in ${Date.now() - start}ms`);
    } catch (e) {
        console.error("Profiles Check Crashed:", e);
    }

    // 2. Check 'courses' table - Suspected Locked
    try {
        console.log("Checking 'courses' table...");
        const start = Date.now();
        const { count, error } = await supabase.from('courses').select('id', { count: 'exact', head: true });
        console.log(`Courses Payload:`, { count, error });
        console.log(`Courses responded in ${Date.now() - start}ms`);

        if (error) {
            console.error("Courses Error Details:", JSON.stringify(error, null, 2));
        }
    } catch (e) {
        console.error("Courses Check Crashed:", e);
    }

    console.log('--- DIAGNOSTIC END ---');
}

diagnose();
