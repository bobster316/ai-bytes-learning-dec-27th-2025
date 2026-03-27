
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log("🔍 Checking 'course_quizzes' schema...");

    // Try to insert a dummy row just to see the error message which lists columns
    // actually, let's just inspect one row if possible, or assume column mismatch

    // We can't query information_schema easily with supabase-js client unless we use rpc.
    // Instead, let's try to select just 'id' first.

    const { data, error } = await supabase
        .from('course_quizzes')
        .select('id')
        .limit(1);

    if (error) {
        console.error("Error selecting id:", error);
    } else {
        console.log("Select ID success. Result:", data);
    }

    // Now try querying with topic_id
    const { data: d2, error: e2 } = await supabase
        .from('course_quizzes')
        .select('id, topic_id')
        .limit(1);

    if (e2) console.error("Error selecting topic_id:", e2);

    // Now try querying with course_id
    const { data: d3, error: e3 } = await supabase
        .from('course_quizzes')
        .select('id, course_id')
        .limit(1);

    if (e3) console.error("Error selecting course_id:", e3);
}

checkSchema();
