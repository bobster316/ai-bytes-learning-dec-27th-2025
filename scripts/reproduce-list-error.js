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
    console.error("❌ Missing Env Vars:", {
        url: !!supabaseUrl,
        key: !!supabaseKey
    });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testList() {
    console.log("Testing Course List Query...");
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, description, category, difficulty_level, price, published, thumbnail_url, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error("❌ Query Error:", error);
    } else {
        console.log(`✅ Success! Fetched ${courses.length} courses.`);
        if (courses.length > 0) {
            console.log("Sample:", courses[0]);
        }
    }
}

testList();
