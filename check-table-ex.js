
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTable() {
    console.log('Fetching questions for quiz 569...');
    const { data, error } = await supabase
        .from('course_quiz_questions')
        .select('*')
        .eq('quiz_id', '569');

    if (error) {
        console.error('Select Error:', error.message);
    } else {
        console.log('Data length:', data ? data.length : 'null');
        if (data && data.length > 0) {
            console.log('First question:', data[0]);
        }
    }
}

checkTable();
