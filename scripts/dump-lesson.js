const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: lesson, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', 3332)
        .single();

    if (error) {
        console.error('Error fetching lesson:', error);
        return;
    }

    fs.writeFileSync('tmp-lesson-3332.json', JSON.stringify(lesson.content_blocks, null, 2));
    console.log('Saved lesson blocks to tmp-lesson-3332.json');
}

main();
