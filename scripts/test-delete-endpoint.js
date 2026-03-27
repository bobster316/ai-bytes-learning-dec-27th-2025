
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
    console.log("1. Creating dummy course for deletion test...");

    // Create a dummy course
    const { data: course, error } = await supabase
        .from('courses')
        .insert({
            title: 'DELETE_TEST_' + Date.now(),
            description: 'Temporary course for delete test',
            difficulty_level: 'Beginner',
            published: false,
            // Add required fields safely
            learning_objectives: ['Test'],
            thumbnail_prompt: 'Test'
        })
        .select()
        .single();

    if (error) {
        console.error("Failed to create dummy course:", error);
        process.exit(1);
    }

    console.log(`   Created course: ${course.id} (${course.title})`);

    console.log("2. Calling API to delete course...");

    try {
        const response = await fetch('http://localhost:3000/api/course/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [course.id] })
        });

        const status = response.status;
        const text = await response.text();

        console.log(`   API Status: ${status}`);
        console.log(`   API Response: ${text}`);

        if (response.ok) {
            console.log("SUCCESS: Course deleted via API.");
        } else {
            console.error("FAILURE: API returned error.");
        }

        // Verify it's gone
        const { data: check } = await supabase.from('courses').select('id').eq('id', course.id).single();
        if (!check) {
            console.log("   Verification: Course is GONE from DB.");
        } else {
            console.error("   Verification: Course STILL EXISTS in DB!");
        }

    } catch (e) {
        console.error("Exception calling API:", e);
    }
}

main();
