
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTables() {
    // There is no direct "list tables" in Supabase client, but we can try to query common ones or use a trick.
    // Let's try to query 'modules' and 'lessons' and 'topics' and 'lessons_v2' etc.
    const tables = ['courses', 'modules', 'lessons', 'topics', 'lessons_v2', 'course_content', 'sections'];
    for (const t of tables) {
        const { data, error } = await supabase.from(t).select('count').limit(1);
        if (!error) console.log(`Table '${t}' exists.`);
        else console.log(`Table '${t}' error: ${error.message}`);
    }
}

listTables();
