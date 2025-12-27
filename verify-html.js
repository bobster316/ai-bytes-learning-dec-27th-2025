
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkHtml() {
    // Get the latest course
    const { data: course } = await supabase.from('courses').select('id, title').order('created_at', { ascending: false }).limit(1).single();

    // Get the first lesson
    const { data: lesson } = await supabase.from('course_lessons').select('title, content_html, video_url').eq('course_id', course.id).eq('order_index', 0).order('order_index').limit(1).single();

    // Actually, lessons are linked to topics, so we need to find the topic first.
    // Let's just find the first lesson of the first topic.
    const { data: topic } = await supabase.from('course_topics').select('id').eq('course_id', course.id).eq('order_index', 0).single();
    if (!topic) {
        console.log("No topic found");
        return;
    }

    const { data: firstLesson } = await supabase.from('course_lessons').select('title, content_html, video_url').eq('topic_id', topic.id).eq('order_index', 0).single();

    if (!firstLesson) {
        console.log("No lesson found");
        return;
    }

    console.log(`Course: ${course.title}`);
    console.log(`Lesson: ${firstLesson.title}`);
    console.log(`Video URL in DB: ${firstLesson.video_url}`);

    // Check if HTML contains the video tag or at least the logic
    // The renderer puts <video src="..."> if video_url is present.
    // Let's verify the content_html string.
    if (firstLesson.content_html.includes('<video')) {
        console.log("HTML Verification: <video> tag found in content_html.");
    } else {
        console.log("HTML Verification: <video> tag NOT found. Renderer might verify logic at runtime or content_html is stale.");
        // Note: content_html is generated at creation time in the route, so it should be there.
    }
}

checkHtml();
