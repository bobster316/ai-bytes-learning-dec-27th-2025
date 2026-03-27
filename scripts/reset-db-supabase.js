const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.log('Could not load .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetDatabase() {
    console.log('🔌 Connecting to Supabase...');

    try {
        // Delete all courses. Assuming Cascade Delete is set up in Postgres for children tables.
        // If not, this might fail or leave orphans.
        // Based on the migration files viewed earlier, ON DELETE CASCADE was used.

        console.log('🗑️  Deleting independent tables first to avoid timeouts...');

        // Parallel deletes for leaf nodes
        await Promise.all([
            supabase.from('user_course_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
            supabase.from('user_lesson_progress').delete().neq('id', 0),
            supabase.from('quiz_attempts').delete().neq('id', 0),
            supabase.from('certificates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        ]);

        console.log('🗑️  Deleting all courses...');
        const { error } = await supabase
            .from('courses')
            .delete()
            .neq('id', 0); // Delete all where ID is not 0 (effectively all)

        if (error) {
            console.error('❌ Error deleting courses:', error);
            // backup: try deleting explicit children if cascade failed logic (though API usually returns foreign key violation error)
        } else {
            console.log('✅ All courses deleted successfully.');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

resetDatabase();
