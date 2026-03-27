
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function backup() {
    console.log('--- STARTING DB BACKUP ---');
    const { data: courses } = await supabase.from('courses').select('*');
    fs.writeFileSync('courses_backup_final.json', JSON.stringify(courses, null, 2));
    console.log('Backup saved to courses_backup_final.json');
}

backup();
