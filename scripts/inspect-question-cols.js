
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectQuestionColumns() {
    const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("✅ Question Columns:", Object.keys(data[0]));
        console.log("📄 Sample Data:", JSON.stringify(data[0], null, 2));
    } else {
        console.log("⚠️ Table is empty, cannot inspect columns easily via select *");
    }
}

inspectQuestionColumns();
