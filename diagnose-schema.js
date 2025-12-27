
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseSchema() {
    console.log('Diagnosing schema for "courses" table...');

    // We can query information_schema if we have permission with service role
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'courses' });

    if (error) {
        console.log('RPC failed, trying direct query on information_schema...');
        const { data: cols, error: err2 } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'courses');

        if (err2) {
            console.error('Direct query failed:', err2);

            // Fallback: try to select one row and see keys
            console.log('Attempting to fetch one row from courses...');
            const { data: rows, error: err3 } = await supabase.from('courses').select('*').limit(1);
            if (err3) {
                console.error('Fetch failed:', err3);
            } else if (rows && rows.length > 0) {
                console.log('Columns found in first row:', Object.keys(rows[0]));
            } else {
                console.log('No rows found in courses.');
            }
        } else {
            console.log('Columns:', cols);
        }
    } else {
        console.log('RPC result:', data);
    }
}

diagnoseSchema();
