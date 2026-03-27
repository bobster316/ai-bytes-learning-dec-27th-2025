
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getQuizUrl() {
    // 1. Get latest course
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(1);

    const course = courses[0];
    console.log(`Course: ${course.title} (ID: ${course.id})`);

    // 2. Get topics
    const { data: topics } = await supabase
        .from('course_topics')
        .select('id')
        .eq('course_id', course.id);

    const topicIds = topics.map(t => t.id);

    // 3. Get quizzes for these topics
    const { data: quizzes } = await supabase
        .from('course_quizzes')
        .select('id, title, topic_id')
        .in('topic_id', topicIds);

    if (quizzes && quizzes.length > 0) {
        console.log("✅ FOUND QUIZZES:");
        quizzes.forEach(q => {
            console.log(`   - ${q.title}`);
            console.log(`     Topic ID: ${q.topic_id}`);
            console.log(`     Quiz ID:  ${q.id}`);
            console.log(`     TEST URL: http://localhost:3000/courses/${course.id}/quizzes/${q.id}`);
        });
    } else {
        console.log("❌ No quizzes found for this course.");
    }
}

getQuizUrl();
