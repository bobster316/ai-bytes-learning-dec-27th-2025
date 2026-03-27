
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check818() {
    console.log("Checking Course 818...");
    const { data: lessons, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('title', 'Introduction to AI Verification') // Lesson 1 name for Verification course
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    if (!lessons || lessons.length === 0) {
        // Try fuzzy search or just get latest
        const { data: latest } = await supabase.from('course_lessons').select('id, title, content_blocks').order('id', { ascending: false }).limit(5);
        console.log("No exact match. Latest lessons:", latest);
        return;
    }

    const lesson = lessons[0];
    console.log("Lesson ID:", lesson.id);
    console.log("Title:", lesson.title);
    console.log("Content Blocks (Type):", typeof lesson.content_blocks);
    console.log("Content Blocks (Peek):", JSON.stringify(lesson.content_blocks).substring(0, 500));
    console.log("Content Markdown (Peek):", lesson.content_markdown?.substring(0, 500));
}

check818();
