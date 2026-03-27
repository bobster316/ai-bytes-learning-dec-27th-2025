const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function purgeDuplicates() {
    console.log('🔍 Scanning for duplicate image URLs...');
    const { data: images } = await s.from('lesson_images').select('id, lesson_id, image_url');

    const seen = new Set();
    const toDelete = [];

    images.forEach(img => {
        const key = `${img.lesson_id}_${img.image_url}`;
        if (seen.has(key)) {
            toDelete.push(img.id);
        } else {
            seen.add(key);
        }
    });

    console.log(`Found ${toDelete.length} actual duplicates.`);
    if (toDelete.length > 0) {
        const { error } = await s.from('lesson_images').delete().in('id', toDelete);
        if (error) console.error('Error deleting duplicates:', error);
        else console.log('Successfully purged duplicates.');
    }
}

async function purgeRobots() {
    console.log('🤖 Purging all remaining Pollinations robots...');
    const { error } = await s.from('lesson_images').delete().ilike('image_url', '%pollinations%');
    if (error) console.error('Error purging robots:', error);
    else console.log('Robots purged.');
}

async function run() {
    await purgeRobots();
    await purgeDuplicates();
}

run();
