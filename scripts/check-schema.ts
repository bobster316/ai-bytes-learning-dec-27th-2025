
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkSchema() {
    console.log("Checking schema...");
    const { data, error } = await supabase.rpc('get_schema_info'); // Try RPC if exists? No.
    // Query information schema manually? Supersbase JS client limits this.
    // Instead, just select * from course_topics limit 1 and check keys

    const { data: topics, error: tErr } = await supabase.from('course_topics').select('*').limit(1);
    if (tErr) console.error("Topics Error:", tErr);
    else console.log("Topics Columns:", Object.keys(topics?.[0] || {}));

    const { data: courses, error: cErr } = await supabase.from('courses').select('*').limit(1);
    if (cErr) console.error("Courses Error:", cErr);
    else console.log("Courses Columns:", Object.keys(courses?.[0] || {}));
}

checkSchema();
