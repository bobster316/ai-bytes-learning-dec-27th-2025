const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkFirst() {
    const { data, error } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url, created_at')
        .order('created_at', { ascending: true })
        .limit(1);

    if (data && data.length > 0) {
        const c = data[0];
        console.log(`TITLE: ${c.title}`);
        console.log(`URL: ${c.thumbnail_url}`);
    } else {
        console.log('No data');
    }
}
checkFirst();
