
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim();
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Checking 'courses'...");
    const { data: d1, error: e1 } = await supabase.from('courses').select('id, title').limit(1);
    if (e1) console.error("Error 'courses':", e1.message);
    else console.log("Success 'courses':", d1);
}

check();
