
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectQuizDeep() {
    console.log("🔍 Inspecting Quiz Data Deeply...");

    // 1. Get a quiz ID (using the one we found earlier: 994, or fetch any)
    const quizId = 994;

    // 2. Fetch Quiz Metadata
    const { data: quiz, error: qError } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

    if (qError) { console.error("❌ Quiz Error:", qError); return; }
    console.log(`✅ Quiz Found: "${quiz.title}" (ID: ${quiz.id})`);

    // 3. Fetch Questions
    const { data: questions, error: quError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId);

    if (quError) { console.error("❌ Questions Error:", quError); return; }
    console.log(`📊 Found ${questions.length} questions.`);

    if (questions.length === 0) {
        console.warn("⚠️ WARNING: Quiz has NO questions!");
    }

    // 4. Fetch Options for FIRST Question
    if (questions.length > 0) {
        const q1 = questions[0];
        console.log(`   Question 1: "${q1.question_text}" (ID: ${q1.id})`);

        const { data: options, error: oError } = await supabase
            .from('quiz_options')
            .select('*')
            .eq('question_id', q1.id);

        if (oError) { console.error("❌ Options Error:", oError); return; }
        console.log(`   - Found ${options.length} options.`);
        options.forEach(o => console.log(`     [${o.is_correct ? 'X' : ' '}] ${o.text}`));
    }
}

inspectQuizDeep();
