const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listFiles() {
    console.log('Listing files in course-images/generated...');
    try {
        const { data, error } = await supabase.storage
            .from('course-images')
            .list('generated', { limit: 5, sortBy: { column: 'created_at', order: 'desc' } });

        if (error) {
            console.error('Error listing files:', error);
        } else {
            console.log('Files:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

listFiles();
