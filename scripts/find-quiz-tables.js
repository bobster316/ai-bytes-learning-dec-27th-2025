
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    console.log("🔍 Listing Tables...");

    // We can't list tables via API easily without permissions or SQL editor.
    // Instead, I will brute-force test common variations.

    const candidates = [
        'quiz_questions', 'course_quiz_questions', 'questions',
        'quiz_options', 'course_quiz_options', 'options', 'course_options',
        'quiz_answers', 'course_quiz_answers'
    ];

    for (const table of candidates) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (!error) {
            console.log(`✅ Table EXISTS: ${table}`);
        } else {
            // console.log(`❌ ${table}: ${error.message}`);
        }
    }
}

listTables();
