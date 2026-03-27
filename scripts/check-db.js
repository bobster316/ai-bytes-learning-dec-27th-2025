const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: lessons, error: lessonError } = await supabase
        .from('course_lessons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (lessonError) {
        console.error('Error fetching lessons:', lessonError);
        return;
    }

    if (lessons.length === 0) {
        console.log('No lessons found.');
        return;
    }

    for (const lesson of lessons) {
        console.log('\n--- Lesson:', lesson.title, '| ID:', lesson.id, '---');
        console.log('Created at:', lesson.created_at);
        console.log('Has content_blocks:', !!lesson.content_blocks);
        console.log('Is content_blocks array?', Array.isArray(lesson.content_blocks));
        if (Array.isArray(lesson.content_blocks)) {
            console.log('Blocks length:', lesson.content_blocks.length);
            if (lesson.content_blocks.length > 0) {
                console.log('First block type:', lesson.content_blocks[0]?.type);
            }
        } else {
            console.log('content_blocks is null or not array');
        }
    }
}

main();
