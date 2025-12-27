
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    const tables = ['courses', 'course_topics', 'course_lessons', 'lesson_images'];

    for (const table of tables) {
        // Intentionally create a "column does not exist" error to get valid columns from the hint (if supported) or just select *
        const { data, error } = await supabase.from(table).select().limit(1);

        process.stdout.write(`\n--- TABLE: ${table} ---\n`);
        if (error) {
            process.stdout.write(`Error: ${error.message}\n`);
            if (error.hint) process.stdout.write(`Hint: ${error.hint}\n`);
        } else if (data && data.length > 0) {
            process.stdout.write(`Keys: ${JSON.stringify(Object.keys(data[0]))}\n`);
        } else {
            // Try inserting a dummy record to force "column X does not exist" if we knew one? 
            // Or just say empty.
            process.stdout.write("Status: Empty table (cannot infer keys via select)\n");
        }
    }
}

checkSchema();
