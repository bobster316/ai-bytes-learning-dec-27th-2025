
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkLesson() {
    const { data, error } = await supabase
        .from('course_lessons')
        .select('content_blocks')
        .eq('id', '3567')
        .single();

    if (error) {
        console.error('Error fetching lesson:', error);
        return;
    }

    console.log('--- Lesson 3567 Blocks ---');
    data.content_blocks.forEach((block: any, i: number) => {
        console.log(`Block ${i}: Type=${block.type}, Title=${block.title}`);
    });
}

checkLesson();
