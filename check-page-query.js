
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPageQuery() {
    const quizId = '569';
    console.log(`Checking page query for quiz ${quizId}...`);

    const { data: quiz, error } = await supabase
        .from('course_quizzes')
        .select(`
            *,
            questions:course_quiz_questions(*)
        `)
        .eq('id', quizId)
        .single();

    if (error) {
        console.error('Error fetching quiz:', error);
    } else {
        console.log('Quiz found:', quiz.title);
        console.log('Questions count:', quiz.questions ? quiz.questions.length : 0);
    }
}

checkPageQuery();
