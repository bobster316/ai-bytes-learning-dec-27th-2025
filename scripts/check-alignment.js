
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAlignment() {
    const { data: lessons, error } = await supabase
        .from('course_lessons')
        .select('id, title, content_html')
        .limit(5);

    if (error) { console.error(error); return; }

    console.log('--- CONTENT ALIGNMENT AUDIT ---');
    lessons.forEach(l => {
        const wordCount = l.content_html.replace(/<[^>]*>/g, '').split(/\s+/).length;
        const isRambling = wordCount > 1500;
        console.log(`LESSON: ${l.title}`);
        console.log(`WORD COUNT: ${wordCount}`);
        console.log(`STATUS: ${isRambling ? '⚠️ RAMBLING (Incompatible with 15m Byte Promise)' : '✅ ALIGNED'}`);
        console.log('-------------------------------');
    });
}

checkAlignment();
