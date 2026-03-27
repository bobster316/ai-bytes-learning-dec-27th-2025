require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not defined in .env.local');
        process.exit(1);
    }

    // Default to the specific migration file we just created
    // But allow passing a file as argument
    let migrationFile = 'supabase/migrations/20260112_course_completion_flow.sql';
    if (process.argv[2]) {
        migrationFile = process.argv[2];
    }

    const filePath = path.join(__dirname, '..', migrationFile);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${filePath}`);
        process.exit(1);
    }

    console.log(`Connecting to database...`);
    // Handle connection string - if 'transaction' mode (port 6543) or 'session' mode (5432)
    // pg driver handles mostly fine, but sometimes ssl is needed for Supabase
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase usually
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`📄 Executing migration: ${migrationFile}`);

        await client.query(sql);
        console.log('✅ Migration executed successfully.');

    } catch (err) {
        console.error('❌ Error executing migration:', err);
    } finally {
        await client.end();
    }
}

applyMigration();
