
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTable() {
    console.log('Fetching from quiz_questions...');
    const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .limit(1);

    if (error) {
        console.log('Error selecting from quiz_questions:', error.message);
    } else {
        console.log('Success! quiz_questions exists. Data:', data);
    }
}

checkTable();
