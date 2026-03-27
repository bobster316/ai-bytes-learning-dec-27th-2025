import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLesson() {
    const { data, error } = await supabase
        .from('course_lessons')
        .select('id, title, content_blocks, content_markdown')
        .eq('id', 3319)
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Details for Lesson 3319:");
        console.log(JSON.stringify(data, null, 2));
    }
}

checkLesson();
