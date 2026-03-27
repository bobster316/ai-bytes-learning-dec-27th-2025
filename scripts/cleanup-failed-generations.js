
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupFailedGenerations() {
    console.log('Cleaning up failed and stale course generations...');

    // 1. Delete generations with status 'failed'
    const { data: failedGens, error: failedErr } = await supabase
        .from('ai_generated_courses')
        .delete()
        .eq('generation_status', 'failed');

    if (failedErr) {
        console.error('Error deleting failed generations:', failedErr);
    } else {
        console.log(`Deleted failed generation records.`);
    }

    // 2. Delete generations with status 'generating' that are older than 30 minutes (stale)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: staleGens, error: staleErr } = await supabase
        .from('ai_generated_courses')
        .delete()
        .eq('generation_status', 'generating')
        .lt('created_at', thirtyMinutesAgo);

    if (staleErr) {
        console.error('Error deleting stale generations:', staleErr);
    } else {
        console.log(`Deleted stale generation records.`);
    }

    console.log('Cleanup complete.');
}

cleanupFailedGenerations();
