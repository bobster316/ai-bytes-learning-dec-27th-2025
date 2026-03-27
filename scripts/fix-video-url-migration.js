
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function applyMigration() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const sql = 'ALTER TABLE course_topics ADD COLUMN IF NOT EXISTS video_url TEXT;';

    console.log('🚀 Applying migration: Add video_url to course_topics...');

    // Using a simple query if possible, or trying to find a way to execute raw SQL
    // Since Supabase client doesn't support raw SQL easily without an RPC, 
    // we'll try to use the fetch approach similar to scripts/apply-migration.js

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ query: sql })
        });

        if (response.ok) {
            console.log('✅ Migration attempted via RPC shortcut.');
            console.log('   Note: This script assumes a generic RPC exists or the REST API allows this specific query.');
        } else {
            console.log(`⚠️  Response status: ${response.status} ${response.statusText}`);
            console.log('   This might mean direct SQL via REST is restricted.');
        }
    } catch (err) {
        console.error('❌ Fetch failed:', err.message);
    }

    console.log('\n📋 Verification:');
    console.log('   Please run node check-video-column.js to verify.');
}

applyMigration();
