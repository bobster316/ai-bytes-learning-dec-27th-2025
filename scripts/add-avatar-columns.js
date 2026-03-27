
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
    console.log('--- Applying Instructor Avatar Migration ---');

    const sql = `
        ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_avatar TEXT DEFAULT 'sarah';
        ALTER TABLE course_topics ADD COLUMN IF NOT EXISTS instructor_avatar TEXT DEFAULT 'sarah';
        ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS instructor_avatar TEXT DEFAULT 'sarah';
    `;

    try {
        const { error: rpcErr } = await supabase.rpc('exec_sql', { query: sql });
        if (rpcErr) {
            console.log('❌ RPC exec_sql failed:', rpcErr.message);
            console.log('\nPlease run this manually in the Supabase SQL Editor:');
            console.log(sql);
        } else {
            console.log('✅ instructor_avatar columns added successfully.');
        }
    } catch (e) {
        console.log('❌ RPC execution error:', e.message);
    }
}

runMigration();
