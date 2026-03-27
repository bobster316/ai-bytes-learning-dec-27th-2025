
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: courses } = await supabase.from('courses').select('*').limit(20);
    const report = courses.map(c => ({
        id: c.id,
        title: c.title,
        desc: c.description,
        cat: c.category,
        isRobotic: /master|harness|leverage|unlock|unleash|demystify|complex/i.test(c.title + ' ' + c.description)
    }));
    fs.writeFileSync('course_audit.json', JSON.stringify(report, null, 2));
    console.log('Audit complete.');
}
run();
