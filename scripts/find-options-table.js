
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findOptionsTable() {
    const candidates = [
        'quiz_question_options',
        'question_options',
        'course_question_options',
        'quiz_answers',
        'answers',
        'options'
    ];

    for (const table of candidates) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`✅ Table EXISTS: ${table}`);
        } else {
            // console.log(`❌ ${table}: ${error.message}`);
        }
    }
}

findOptionsTable();
