const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for schema access if needed
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("Inspecting 'courses' table schema...");
    const { data: coursesCols, error: coursesError } = await supabase
        .rpc('get_table_columns', { table_name_input: 'courses' });

    if (coursesError) {
        // Fallback: Try a direct query to information_schema if RPC doesn't exist
        console.log("RPC failed, trying raw SQL via existing edge function or just checking another way...");
        const { data, error } = await supabase.from('courses').select().limit(0);
        if (error) {
            console.error("Column check failed:", error.message);
        } else {
            console.log("Courses columns hint:", error?.message);
        }
    } else {
        console.log("Courses Columns:", coursesCols);
    }

    console.log("\nInspecting 'user_course_progress' table schema...");
}

// Since I can't easily create an RPC, let's just try to select 0 rows and check the error message
// Supabase/PostgREST usually gives a detailed error if a column is missing.
async function testSpecificColumns() {
    const tables = ['courses', 'user_course_progress'];
    for (const table of tables) {
        console.log(`\n--- Testing ${table} ---`);
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error selecting * from ${table}:`, error.message);
        } else {
            console.log(`Select * from ${table} succeeded.`);
        }
    }
}

testSpecificColumns();
