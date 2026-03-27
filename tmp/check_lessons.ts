import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function extractLessons() {
    console.log("Fetching the 2 mostly recently created lessons...");
    const { data, error } = await supabase
        .from('course_lessons')
        .select('id, title, content_markdown')
        .order('id', { ascending: false })
        .limit(2);

    if (error) {
        console.error("Error:", error);
        return;
    }
    
    for (let i = 0; i < data.length; i++) {
        const lesson = data[i];
        const filepath = path.join(process.cwd(), 'tmp', `extracted_lesson_${i}.json`);
        fs.writeFileSync(filepath, lesson.content_markdown || '{}', 'utf-8');
        console.log(`Saved lesson ${i} (${lesson.title}) to ${filepath}`);
    }
}
extractLessons();
