
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setPassword() {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    if (!users.length) return;
    const user = users[0];
    console.log(`Setting password for ${user.email}`);
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: 'password123' });
    if (error) console.error(error);
    else console.log('Password updated to password123');
}
setPassword();
