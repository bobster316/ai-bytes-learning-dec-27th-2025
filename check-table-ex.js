
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable(tableName) {
    console.log(`Checking for 'learning_analytics' table...`);
    const { data, error } = await supabase
        .from('learning_analytics')
        .select('id')
        .limit(1);

    if (error) {
        console.log("Error accessing learning_analytics:", error.message);
    } else {
        console.log("learning_analytics table exists!");
    }
}

const table = process.argv[2] || 'courses';
checkTable(table);
