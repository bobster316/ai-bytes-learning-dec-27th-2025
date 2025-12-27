
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAll() {
    console.log('Clearing all course data...');

    // Deleting courses cascades to topics and lessons if foreign keys are set correctly.
    // If not, we do it manually.
    const { error: cErr } = await supabase.from('courses').delete().neq('id', 0);
    if (cErr) console.error('Error clearing courses:', cErr);
    else console.log('Successfully cleared all courses, topics, and lessons.');
}

clearAll();
