
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: courses } = await supabase.from('courses').select('*');
    if (!courses.length) {
        console.log("No courses yet.");
        return;
    }
    const course = courses[0];
    console.log(`Course Found: ${course.title} (ID: ${course.id})`);

    const { count: topicCount } = await supabase.from('course_topics').select('*', { count: 'exact', head: true }).eq('course_id', course.id);
    const { count: lessonCount } = await supabase.from('course_lessons').select('*', { count: 'exact', head: true }).in('topic_id', (await supabase.from('course_topics').select('id').eq('course_id', course.id)).data.map(t => t.id));

    console.log(`Topics: ${topicCount}, Lessons: ${lessonCount}`);

    if (lessonCount > 0) {
        // Check first lesson for video_url
        const { data: lessons } = await supabase.from('course_lessons').select('title, video_url').eq('order_index', 0).limit(1);
        if (lessons && lessons[0]) {
            console.log(`First Lesson Video URL: ${lessons[0].video_url}`);
        }
    }
}

check();
