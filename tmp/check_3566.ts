
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check3566() {
    console.log("Checking Lesson 3566 (Course 821)...");
    const { data: lesson, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', 3566)
        .single();

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    if (!lesson) {
        console.log("Lesson 3566 not found.");
        return;
    }

    console.log("Lesson ID:", lesson.id);
    console.log("Title:", lesson.title);
    console.log("Blocks Count:", lesson.content_blocks?.length);
    console.log("Blocks (Full):", JSON.stringify(lesson.content_blocks, null, 2));
}

check3566();
