
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log('Checking voice_conversations table...');
    const { count: convoCount, error: convoError } = await supabase
        .from('voice_conversations')
        .select('*', { count: 'exact', head: true });

    if (convoError) {
        console.error('Error checking voice_conversations:', convoError.message);
    } else {
        console.log(`voice_conversations count: ${convoCount}`);
    }

    console.log('\nChecking course_content_vectors table...');
    const { count: vectorCount, error: vectorError } = await supabase
        .from('course_content_vectors')
        .select('*', { count: 'exact', head: true });

    if (vectorError) {
        console.error('Error checking course_content_vectors:', vectorError.message);
    } else {
        console.log(`course_content_vectors count: ${vectorCount}`);
    }

    // Check for unique constraints or sample data
    const { data, error } = await supabase.from('course_content_vectors').select('lesson_id').limit(1);
    if (data && data.length > 0) {
        console.log('\nSample vector exists.');
    }
}

check();
