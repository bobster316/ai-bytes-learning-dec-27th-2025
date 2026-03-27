
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getUser() {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (users && users.users.length > 0) {
        console.log(`Email: ${users.users[0].email}`);
    } else {
        console.log('No users found');
    }
}
getUser();
