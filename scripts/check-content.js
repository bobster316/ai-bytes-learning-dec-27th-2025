
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContent() {
    console.log("🔍 Checking Lesson Content...");

    // Get latest course
    const { data: courses } = await supabase.from('courses').select('*').order('created_at', { ascending: false }).limit(1);
    if (!courses || !courses[0]) return;

    const course = courses[0];
    console.log(`Course: ${course.title} (${course.id})`);

    // Get lessons
    const { data: lessons } = await supabase.from('course_lessons')
        .select('id, title, content_markdown')
        .in('topic_id', (await supabase.from('course_topics').select('id').eq('course_id', course.id)).data.map(t => t.id));

    lessons.forEach(l => {
        const len = l.content_markdown ? l.content_markdown.length : 0;
        console.log(`- Lesson: ${l.title} | Content Length: ${len}`);
        if (len > 0 && len < 100) console.log(`  Content: ${l.content_markdown}`);
    });
}
checkContent();
