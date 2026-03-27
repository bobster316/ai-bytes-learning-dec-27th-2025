const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkThumbnails() {
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url, created_at')
        .order('created_at', { ascending: true })
        .limit(3);

    if (courses) {
        console.log('--- First 3 Courses ---');
        courses.forEach(c => {
            console.log(`[${c.title}]`);
            console.log(`   ID: ${c.id}`);
            console.log(`   Thumb: ${c.thumbnail_url}`);
            console.log('---');
        });
    } else {
        console.log('No courses found or error:', error);
    }
}

checkThumbnails();
