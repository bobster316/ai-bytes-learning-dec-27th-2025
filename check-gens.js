
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkGenerations() {
    const { data: gens, error } = await supabase
        .from('ai_generated_courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Latest Generations:');
    gens.forEach(g => {
        console.log(`- ID: ${g.id}, Status: ${g.generation_status}, Progress: ${g.percent_complete}%, Error: ${g.error_message}`);
    });
}

checkGenerations();
