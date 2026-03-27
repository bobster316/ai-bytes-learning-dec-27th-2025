const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log("Listing tables in public schema...");

    // We can't directly list tables with client unless we use a hack or if there's a specific function
    // But we can try to query common tables to see if they exist

    const tablesToCheck = [
        'courses',
        'enrollments',
        'user_course_progress',
        'user_lesson_progress',
        'user_enrollments',
        'profiles'
    ];

    for (const table of tablesToCheck) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`❌ Table '${table}': Error - ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`✅ Table '${table}': Found (${count} rows)`);
        }
    }
}

listTables();
