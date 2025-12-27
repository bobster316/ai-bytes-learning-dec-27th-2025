
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestGeneration() {
    console.log('Checking latest generation status...');

    const { data: generations, error } = await supabase
        .from('ai_generated_courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!generations || generations.length === 0) {
        console.log('No generation records found.');
        return;
    }

    const gen = generations[0];
    console.log('Latest Generation Record:');
    console.log('ID:', gen.id);
    console.log('Course ID:', gen.course_id);
    console.log('Prompt:', gen.original_prompt);
    console.log('Status:', gen.generation_status);
    console.log('Error Message:', gen.error_message);
    console.log('Created At:', gen.created_at);
    console.log('Started At:', gen.generation_started_at);
    console.log('Completed At:', gen.generation_completed_at);
}

checkLatestGeneration();
