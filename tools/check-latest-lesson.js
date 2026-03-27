import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestLesson() {
    const { data, error } = await supabase
        .from('course_lessons')
        .select('id, title, content_blocks, content_markdown, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        fs.writeFileSync('lesson-blocks.json', JSON.stringify(data.content_blocks, null, 2));
        console.log("Wrote lesson blocks to lesson-blocks.json");
    }
}

checkLatestLesson();
