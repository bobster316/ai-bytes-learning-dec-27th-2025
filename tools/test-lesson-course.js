import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data: lesson } = await supabase.from('course_lessons').select('topic_id').eq('id', 3399).single();
    console.log("Topic ID:", lesson?.topic_id);
    if (lesson?.topic_id) {
        const { data: topic } = await supabase.from('course_topics').select('course_id').eq('id', lesson.topic_id).single();
        console.log("Course ID:", topic?.course_id);
    }
}
run();
