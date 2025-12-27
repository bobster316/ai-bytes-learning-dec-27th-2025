
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkQuizzes() {
    // Get topics for course 364
    const { data: topics } = await supabase.from('course_topics').select('id, title').eq('course_id', 364);
    console.log('Topics:', topics);

    if (topics && topics.length > 0) {
        for (const topic of topics) {
            const { data: quizzes, error } = await supabase
                .from('course_quizzes')
                .select('*')
                .eq('topic_id', topic.id);

            if (error) console.error(error);
            console.log(`Quizzes for topic ${topic.title} (${topic.id}):`, quizzes);

            if (quizzes && quizzes.length > 0) {
                const quizId = quizzes[0].id;
                console.log(`Checking questions for quiz ${quizId}...`);
                const { data: questions } = await supabase.from('course_quiz_questions').select('*').eq('quiz_id', quizId);
                console.log(`Questions:`, questions?.length);
            }
        }
    }
}

checkQuizzes();
