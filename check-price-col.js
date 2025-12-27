
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumn() {
    console.log("Checking columns...");
    const { data, error } = await supabase.from('courses').select('price').limit(1);
    if (error) {
        console.log("Error details:", JSON.stringify(error, null, 2));
    } else {
        console.log("Success! Price column exists.");
    }
}

checkColumn();
