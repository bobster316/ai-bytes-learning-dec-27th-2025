
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

async function checkSchema() {
    console.log('🔍 Checking Database Schema for Engagement & QA Layers...');

    const checks = [
        { table: 'flashcards', desc: 'Phase 5: Flashcards table' },
        { table: 'user_card_progress', desc: 'Phase 5: User card progress table' },
        { table: 'user_profiles', desc: 'Phase 5: User profiles table' },
        { table: 'badges', desc: 'Phase 5: Badges table' },
        { table: 'course_lessons', column: 'quality_score', desc: 'QA: quality_score column' },
        { table: 'course_lessons', column: 'quality_breakdown', desc: 'QA: quality_breakdown column' },
        { table: 'course_topics', column: 'video_url', desc: 'Video: video_url column' },
        { table: 'courses', column: 'intro_video_url', desc: 'Video: intro_video_url column' }
    ];

    for (const check of checks) {
        if (check.column) {
            const { error } = await supabase.from(check.table).select(check.column).limit(1);
            if (error) {
                console.log(`❌ ${check.desc} - MISSING (Error: ${error.message})`);
            } else {
                console.log(`✅ ${check.desc} - EXISTS`);
            }
        } else {
            const { error } = await supabase.from(check.table).select('id').limit(1);
            if (error) {
                console.log(`❌ ${check.desc} - MISSING (Error: ${error.message})`);
            } else {
                console.log(`✅ ${check.desc} - EXISTS`);
            }
        }
    }
}

checkSchema();
