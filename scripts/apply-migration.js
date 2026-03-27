/**
 * Supabase Migration Script
 * Applies SQL migrations to Supabase database using the admin API
 * 
 * Usage: npm run migrate
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing environment variables:');
        console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
        console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
        console.error('\nPlease check your .env.local file.');
        process.exit(1);
    }

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260103_fix_analytics.sql');

    if (!fs.existsSync(migrationPath)) {
        console.error('❌ Migration file not found:', migrationPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Loaded migration file: 20251230_engagement_layer.sql');
    console.log(`   Size: ${(sql.length / 1024).toFixed(2)} KB`);

    // Execute via Supabase REST API
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

    // Note: Direct SQL execution via REST API is limited
    // This script provides a reference - you may need to use Supabase CLI or Dashboard

    console.log('');
    console.log('⚠️  Direct SQL execution via REST API is limited.');
    console.log('');
    console.log('📋 Please run this migration manually:');
    console.log('');
    console.log('   Option 1: Supabase Dashboard');
    console.log('   1. Go to https://app.supabase.com');
    console.log('   2. Select your project');
    console.log('   3. Go to "SQL Editor" (left sidebar)');
    console.log('   4. Click "+ New query"');
    console.log('   5. Paste the contents of:');
    console.log(`      ${migrationPath}`);
    console.log('   6. Click "Run"');
    console.log('');
    console.log('   Option 2: Supabase CLI');
    console.log('   $ supabase db push');
    console.log('');
    console.log('The SQL file has been printed below for easy copy/paste:');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
}

runMigration().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
