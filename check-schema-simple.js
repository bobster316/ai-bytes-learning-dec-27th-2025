
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    // Intentionally querying non-existent column to force error with hints, or just selecting all
    const { data, error } = await supabase.from('courses').select('*').limit(1);

    if (error) {
        console.error("Select error:", error);
    } else {
        console.log("Course Record Keys:", data && data[0] ? Object.keys(data[0]) : "No records found, cannot infer keys easily without records");
    }
}

checkSchema();
