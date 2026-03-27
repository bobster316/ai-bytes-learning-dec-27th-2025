const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumns() {
    const coursesCols = ['id', 'title', 'description', 'category', 'difficulty_level', 'price', 'estimated_duration_hours', 'learning_objectives', 'published'];

    console.log("--- Testing Courses Columns ---");
    for (const col of coursesCols) {
        const { error } = await supabase.from('courses').select(col).limit(0);
        if (error) {
            console.error(`Column [${col}] FAILED:`, error.message);
        } else {
            console.log(`Column [${col}] is present.`);
        }
    }

    console.log("\n--- Testing Progression Columns ---");
    // select=*,courses(id,title,difficulty_level,price,category,estimated_duration_hours)
    // Testing the join part specifically
    const { error: joinError } = await supabase
        .from('user_course_progress')
        .select('*, courses(id,title,difficulty_level,price,category,estimated_duration_hours)')
        .limit(0);

    if (joinError) {
        console.error("Join Query FAILED:", joinError.message);
    } else {
        console.log("Join Query succeeded.");
    }
}

testColumns();
