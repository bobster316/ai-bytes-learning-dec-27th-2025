
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
    'courses',
    'course_topics',
    'course_lessons',
    'lesson_images',
    'course_quizzes',
    'quiz_questions',
    'course_generation_progress'
];

async function backup() {
    const backupDir = path.join(process.cwd(), 'backup_20260224', 'supabase_data');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    for (const table of TABLES) {
        console.log(`Backing up table: ${table}...`);
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.error(`Error backing up ${table}:`, error.message);
            continue;
        }
        fs.writeFileSync(
            path.join(backupDir, `${table}.json`),
            JSON.stringify(data, null, 2)
        );
        console.log(`Successfully backed up ${table}.`);
    }
}

backup();
