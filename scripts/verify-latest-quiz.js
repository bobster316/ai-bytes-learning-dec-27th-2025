
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyLatestQuiz() {
    console.log("🔍 Verifying latest course quiz data...");

    // 1. Get the most recent course
    const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

    if (courseError) {
        console.error("❌ Error fetching courses:", courseError.message);
        return;
    }

    if (!courses || courses.length === 0) {
        console.log("⚠️ No courses found in the database.");
        return;
    }

    const latestCourse = courses[0];
    console.log(`📘 Latest Course: "${latestCourse.title}" (ID: ${latestCourse.id})`);
    console.log(`📅 Created At: ${new Date(latestCourse.created_at).toLocaleString()}`);

    // 2. Get Topics for this course
    const { data: topics, error: topicError } = await supabase
        .from('course_topics')
        .select('id, title, order_index')
        .eq('course_id', latestCourse.id)
        .order('order_index');

    if (topicError) {
        console.error("❌ Error fetching topics:", topicError.message);
        return;
    }

    console.log(`📚 Topics found: ${topics.length}`);

    for (const topic of topics) {
        console.log(`\n  🔹 Topic ${topic.order_index + 1}: "${topic.title}"`);

        // 3. Get Quiz for this topic
        const { data: quizzes, error: quizError } = await supabase
            .from('course_quizzes')
            .select('id, title')
            .eq('topic_id', topic.id);

        if (quizError) {
            console.error("     ❌ Error fetching quiz:", quizError.message);
            continue;
        }

        if (!quizzes || quizzes.length === 0) {
            console.warn("     ⚠️ No quiz found for this topic.");
            continue;
        }

        const quiz = quizzes[0];
        console.log(`     📝 Quiz: "${quiz.title}"`);

        // 4. Count Questions
        const { count, error: countError } = await supabase
            .from('quiz_questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quiz.id);

        if (countError) {
            console.error("     ❌ Error counting questions:", countError.message);
        } else {
            console.log(`     🔢 Question Count: ${count}`);

            if (count === 5) {
                console.log("     ✅ VERIFIED: 5 Questions present.");
            } else {
                console.log(`     ❌ MISMATCH: Expected 5, found ${count}.`);
            }
        }
    }
}

verifyLatestQuiz().catch(console.error);
