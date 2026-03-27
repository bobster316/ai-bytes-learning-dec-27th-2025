
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSchema() {
    console.log('--- Database Schema Fix ---');

    // Check if video_url already exists
    const { data: topicData, error: topicErr } = await supabase.from('course_topics').select('*').limit(1);
    if (topicErr) {
        console.error('Error checking course_topics:', topicErr.message);
    } else if (topicData && topicData.length > 0 && 'video_url' in topicData[0]) {
        console.log('✅ video_url already exists in course_topics.');
    } else {
        console.log('⚠️ video_url is missing from course_topics.');
        console.log('Attempting to apply migration via RPC if available...');

        // This is a common pattern for executing SQL if the 'exec_sql' RPC is set up
        const sql = `ALTER TABLE course_topics ADD COLUMN IF NOT EXISTS video_url TEXT;`;

        try {
            const { error: rpcErr } = await supabase.rpc('exec_sql', { query: sql });
            if (rpcErr) {
                console.log('❌ RPC exec_sql failed or not found:', rpcErr.message);
                console.log('\nPlease run this manually in the Supabase SQL Editor:');
                console.log(sql);
            } else {
                console.log('✅ SQL executed successfully via RPC.');
            }
        } catch (e) {
            console.log('❌ RPC execution error:', e.message);
        }
    }

    // Also check for quality columns in course_lessons
    const { data: lessonData, error: lessonErr } = await supabase.from('course_lessons').select('*').limit(1);
    if (!lessonErr && lessonData && lessonData.length > 0) {
        const hasQuality = 'quality_score' in lessonData[0];
        if (hasQuality) {
            console.log('✅ Quality columns exist in course_lessons.');
        } else {
            console.log('⚠️ Quality columns missing in course_lessons.');
            const sql = `ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS quality_score INTEGER;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS quality_breakdown JSONB;`;
            console.log('\nPlease run this manually in the Supabase SQL Editor:');
            console.log(sql);
        }
    }
}

fixSchema();
