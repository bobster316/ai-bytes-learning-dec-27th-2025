
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCourses() {
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, description, category')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    const report = courses.map(c => ({
        title: c.title,
        desc: c.description,
        cat: c.category,
        hasMaster: /master/i.test(c.title + ' ' + c.description),
        hasHarness: /harness|leverage|unlock|unleash/i.test(c.title + ' ' + c.description)
    }));

    console.log(JSON.stringify(report, null, 2));
}

inspectCourses();
