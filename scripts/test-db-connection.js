
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
    console.log('Testing DB Access...');
    const start = Date.now();

    // Try a simple count
    const { count, error } = await supabase
        .from('courses')
        .select('id', { count: 'exact', head: true });

    const duration = Date.now() - start;

    if (error) {
        console.error('DB Connection Failed:', error.message);
        if (error.code) console.error('Error Code:', error.code);
    } else {
        console.log(`DB Connection Success! Response time: ${duration}ms. Total Courses: ${count}`);
    }
}

testConnection();
