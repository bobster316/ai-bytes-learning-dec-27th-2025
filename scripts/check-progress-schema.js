const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const outputFile = path.join(__dirname, 'schema_check_output.txt');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(outputFile, (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n');
};

// Clear previous output
fs.writeFileSync(outputFile, '');

if (!supabaseUrl || !supabaseKey) {
    log('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    log('Checking user_progress...');
    const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .limit(1);

    if (progressError) {
        log('Error checking user_progress: ' + progressError.message);
    } else {
        log('user_progress table exists. Sample:');
        log(progress);
    }

    log('Checking enrollments...');
    const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .limit(1);

    if (enrollmentsError) {
        log('Error checking enrollments: ' + enrollmentsError.message);
    } else {
        log('enrollments table exists. Sample:');
        log(enrollments);
    }
}

checkTables();
