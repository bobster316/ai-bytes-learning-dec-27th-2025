const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.log('Could not load .env.local');
}

async function resetDatabase() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔌 Connected to database...');

        // Truncate tables with CASCADE to handle foreign keys
        // We need to be careful with the order or just use CASCADE
        const query = `
            TRUNCATE TABLE 
                user_course_progress,
                user_lesson_progress,
                quiz_attempts,
                certificates,
                course_lessons,
                course_topics,
                course_quizzes,
                courses
            CASCADE;
        `;

        console.log('🗑️  Deleting all course data...');
        await client.query(query);
        console.log('✅ Database reset complete.');

    } catch (err) {
        console.error('❌ Error resetting database:', err);
    } finally {
        await client.end();
    }
}

resetDatabase();
