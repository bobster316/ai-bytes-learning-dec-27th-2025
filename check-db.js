
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCourses() {
    const { data, count, error } = await supabase
        .from('courses')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error fetching courses:', error);
    } else {
        console.log(`Found ${count} courses.`);
        data.forEach(c => {
            console.log(`ID: ${c.id}, Title: ${c.title}, Published: ${c.published}`);
        });
    }
}

checkCourses();
