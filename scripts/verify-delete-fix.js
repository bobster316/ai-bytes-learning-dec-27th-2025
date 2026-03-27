
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("1. Fetching first course to delete...");

    // Get ANY course
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title')
        .limit(1);

    if (error) {
        console.error("Failed to list courses:", error);
        return;
    }

    if (!courses || courses.length === 0) {
        console.log("No courses found to delete.");
        return;
    }

    const targetCourse = courses[0];
    console.log(`   Found course: ${targetCourse.id} - "${targetCourse.title}"`);

    console.log("2. Attempting API deletion...");
    try {
        const response = await fetch('http://localhost:3000/api/course/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [targetCourse.id] })
        });

        const text = await response.text();
        console.log(`   API Status: ${response.status}`);
        console.log(`   API Response: ${text}`);

    } catch (e) {
        console.error("API Call Exception:", e);
    }
}

main();
