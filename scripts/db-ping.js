const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.error("Failed to load .env.local", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

async function ping() {
    console.log("Pinging database...");
    const start = Date.now();
    try {
        const { data, error } = await supabase.from('courses').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log(`✅ Pong! Database is responsive (Latency: ${Date.now() - start}ms)`);
        console.log(`Current Course Count: ${data === null ? 'unknown' : 'checked'}`); // head:true returns null data but count header
    } catch (e) {
        console.error("❌ Database unreachable:", e.message);
    }
}

ping();
