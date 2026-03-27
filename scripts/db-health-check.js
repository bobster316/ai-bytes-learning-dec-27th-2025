
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName, expectedColumns) {
    process.stdout.write(`Checking ${tableName}... `);

    // Try to select a single row to check existence
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        console.log("❌ MISSING or ERROR");
        console.error(`  Error: ${error.message}`);
        return false;
    }

    // If we can read it, check columns if expectedColumns provided
    // (Naive check: try to select specific columns or insert a row with them would be better, 
    // but for now existence is key. We can't easily DESCRIBE table via API)
    console.log("✅ EXISTS");
    return true;
}

async function verifySchema() {
    console.log("=== SUPABASE HEALTH CHECK ===");
    console.log(`URL: ${supabaseUrl}`);

    const tables = [
        'courses',
        'course_topics',
        'course_lessons',
        'course_quizzes',
        'course_quiz_questions', // Appears to be the main questions table now
        'quiz_questions', // Backup questions table?
        'lesson_images',
        'user_course_progress',
        'user_lesson_progress',
        'quiz_attempts',
        'certificates',
        'subscriptions',
        'audit_logs',
        'cache_entries'
    ];

    let missing = [];

    for (const t of tables) {
        const exists = await checkTable(t);
        if (!exists) missing.push(t);
    }

    console.log("\n=== SUMMARY ===");
    if (missing.length === 0) {
        console.log("🎉 All Checked Tables Exist!");
    } else {
        console.log("⚠️  MISSING TABLES:", missing.join(', '));
    }
}

verifySchema();
