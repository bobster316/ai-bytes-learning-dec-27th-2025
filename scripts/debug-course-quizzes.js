
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkQuizzes() {
    console.log("🔍 Checking Quizzes...");

    // 1. Get the most recent course
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!courses || courses.length === 0) {
        console.log("❌ No courses found.");
        return;
    }

    const course = courses[0];
    console.log(`📘 Latest Course: ${course.title} (ID: ${course.id})`);

    // 2. Get Topics for this course
    const { data: topics } = await supabase
        .from('course_topics')
        .select('id, title, order_index')
        .eq('course_id', course.id)
        .order('order_index');

    console.log(`📂 Found ${topics?.length || 0} topics/modules.`);

    // 3. Get Quizzes for this course
    const { data: quizzes, error } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('course_id', course.id);

    if (error) {
        console.error("❌ Error fetching quizzes:", error);
        return;
    }

    console.log(`📝 Found ${quizzes?.length || 0} quizzes.`);

    quizzes.forEach(q => {
        console.log(`   - Quiz: "${q.title}" (ID: ${q.id})`);
        console.log(`     Topic ID: ${q.topic_id}`);
        const parentTopic = topics.find(t => t.id === q.topic_id);
        console.log(`     Parent Topic: ${parentTopic ? parentTopic.title : 'UNKNOWN/NULL'}`);
    });
}

checkQuizzes();
