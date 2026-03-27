const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Checking columns for 'courses' table...");

    // Select all columns for one row
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching one row:", error);
        return;
    }

    if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log("Available columns:", columns);

        const required = ['id', 'title', 'description', 'difficulty_level', 'price', 'estimated_duration_hours'];
        const missing = required.filter(col => !columns.includes(col));

        if (missing.length > 0) {
            console.error("MISSING REQUIRED COLUMNS:", missing);
        } else {
            console.log("All required columns are present.");
        }
    } else {
        console.log("No rows found to inspect columns.");
    }
}

checkColumns();
