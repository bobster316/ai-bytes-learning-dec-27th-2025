
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkQuestions() {
    const quizId = '569';
    const { data: questions, error } = await supabase
        .from('course_quiz_questions')
        .select('*')
        .eq('quiz_id', quizId);

    if (error) {
        console.error(error);
    } else {
        console.log('Questions found:', questions.length);
        console.log(questions);
    }
}

checkQuestions();
