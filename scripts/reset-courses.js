
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function wipeCourses() {
    console.log('🗑️ Wiping all courses and related data...');

    try {
        // Delete from ai_generated_courses first (if foreign keys don't confuse things, but generally dependent tables first is safer if no cascade, but usually we cascade delete from courses)
        // Actually, usually deleting 'courses' cascades to everything else.
        // Let's check if we can just delete from courses.

        // First, let's delete ai_generated_courses just in case
        const { error: err1 } = await supabase.from('ai_generated_courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err1) console.error('Error deleting ai_generated_courses:', err1);
        else console.log('✅ ai_generated_courses cleared.');

        // Delete courses
        const { error: err2 } = await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err2) console.error('Error deleting courses:', err2);
        else console.log('✅ courses cleared.');

        console.log('✨ Clean slate achieved.');
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

wipeCourses();
