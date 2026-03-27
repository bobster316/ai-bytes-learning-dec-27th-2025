
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCount() {
    console.log('Testing select count...');
    const { data, error } = await supabase
        .from('courses')
        .select('id, title, course_topics(count)')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
        if (error.details) console.error('Details:', error.details);
        if (error.hint) console.error('Hint:', error.hint);
    } else {
        console.log('Success! Data:', JSON.stringify(data, null, 2));
    }
}

checkCount();
