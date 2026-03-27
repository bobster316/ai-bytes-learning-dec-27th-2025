import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Has Key:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucket() {
    try {
        console.log('\nChecking for "course-audio" bucket...');
        const { data, error } = await supabase.storage
            .from('course-audio')
            .list('', { limit: 1 });

        if (error) {
            console.error('❌ Bucket check failed:', error.message);
            console.log('\nThis means the "course-audio" bucket does NOT exist in project:', supabaseUrl);
            console.log('Please create it in the Supabase dashboard for this project.');
        } else {
            console.log('✅ Bucket "course-audio" exists and is accessible!');
            console.log('Files in bucket:', data?.length || 0);
        }
    } catch (err: any) {
        console.error('❌ Error:', err.message);
    }
}

testBucket();
