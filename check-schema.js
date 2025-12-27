
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_table_info', { t_name: 'courses' });
    // If RPC doesn't exist, we can try a simple select
    const { data: cols, error: cErr } = await supabase.from('courses').select('*').limit(1);

    if (cErr) {
        console.log('Error selecting from courses:', cErr.message);
    } else {
        console.log('Courses table exists. Sample data keys:', Object.keys(cols[0] || {}));
    }

    const { data: lCols, error: lErr } = await supabase.from('course_lessons').select('*').limit(1);
    if (!lErr) {
        console.log('Course lessons table keys:', Object.keys(lCols[0] || {}));
    }
}

checkSchema();
