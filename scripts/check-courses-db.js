const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCourses() {
    console.log("Checking courses table...");

    const { data: allCourses, error: allError } = await supabase
        .from('courses')
        .select('id, title, published');

    if (allError) {
        console.error("Error fetching all courses:", allError);
        return;
    }

    console.log(`Total courses found: ${allCourses.length}`);

    const publishedCourses = allCourses.filter(c => c.published);
    console.log(`Published courses found: ${publishedCourses.length}`);

    if (publishedCourses.length === 0) {
        console.warn("⚠️ NO PUBLISHED COURSES FOUND! The AI will have empty context.");
    } else {
        console.log("Published courses titles:", publishedCourses.map(c => c.title));
    }
}

checkCourses();
