
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCourses() {
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .limit(5);

    if (error) { console.error(error); return; }
    console.log(JSON.stringify(courses, null, 2));
}

checkCourses();
