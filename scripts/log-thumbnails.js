const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkThumbnails() {
    const { data: courses, error } = await supabase
        .from('courses')
        .select('title, thumbnail_url, created_at')
        .order('created_at', { ascending: true })
        .limit(3);

    const lines = [];
    if (courses) {
        lines.push('--- First 3 Courses ---');
        courses.forEach(c => {
            lines.push(`Title: ${c.title}`);
            lines.push(`Thumb: ${c.thumbnail_url}`);
            lines.push('---');
        });
    } else {
        lines.push(`Error: ${JSON.stringify(error)}`);
    }

    fs.writeFileSync('updated_thumbnails.txt', lines.join('\n'));
}

checkThumbnails();
