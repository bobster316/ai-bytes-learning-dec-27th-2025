
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndKillLocks() {
    console.log('--- Checking for long-running queries ---');

    // Query to find long running queries (older than 10 seconds)
    const { data: longRunning, error } = await supabase.rpc('get_long_running_options') // Try RPC first if exists
        .catch(() => ({ data: null, error: 'RPC not found' }));

    // Fallback: Use direct SQL via postgres connection is usually not possible with JS client unless RPC is setup.
    // BUT, we can try to use the 'rpc' tool if the project has setup SQL executers, or just infer from behavior.
    // Actually, we can't run raw SQL on pg_stat_activity easily via supabase-js without a wrapper function.

    // Plan B: Just try to read a simple row. If that times out, DB is dead.
    // But we want to UNBLOCK it.

    console.log("Attempting to run a lightweight RPC to inspect locks (if available) or just simple health check.");

    // Since we can't easily kill processes without a specific RPC, we will try to just fetch the list count to confirm if it hangs.
    const start = Date.now();
    try {
        const { count, error: countError } = await supabase.from('courses').select('id', { count: 'exact', head: true }).timeout(5000); // 5s timeout
        const dur = Date.now() - start;
        if (countError) {
            console.error("Health Check Error:", countError);
        } else {
            console.log(`Health Check: DB responded in ${dur}ms. Count: ${count}`);
        }
    } catch (e) {
        console.error("Health Check TIMEOUT/Crash:", e);
    }
}

// Since we cannot run raw SQL to kill, we might need to tell the user to restart Supabase if local? 
// Or, if this is hosted Supabase (urls look like supabase.co), we can't restart it.
// However, Supabase usually kills runaway queries after 2 mins.
// The user has been trying for a while.

checkAndKillLocks();
