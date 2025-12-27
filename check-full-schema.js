
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    const tables = ['courses', 'course_topics', 'course_lessons', 'lesson_images', 'course_quizzes', 'course_quiz_questions'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        console.log(`\nTable: ${table}`);
        if (error) console.error("Error:", error.message);
        else console.log("Keys:", data && data[0] ? Object.keys(data[0]) : "No records - keys unknown via select");
    }
}

checkSchema();
