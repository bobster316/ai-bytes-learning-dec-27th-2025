const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key (Service):', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' : 'MISSING');
console.log('Key (Anon):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'MISSING');

// Use available key
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    console.error('Missing credentials.');
    process.exit(1);
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    key
);

function getMediaId(url) {
    if (!url) return 'missing';
    if (url.includes('pexels.com')) {
        const match = url.match(/\/photos\/(\d+)\//);
        if (match) return match[1];
    }
    if (url.includes('unsplash.com')) {
        const match = url.match(/photo-([a-zA-Z0-9-]+)/);
        if (match) return match[1];
    }
    return url.split('?')[0];
}

(async () => {
    const { data: courses } = await supabase.from('courses').select('id, title, image_url');
    console.log('Total courses:', courses.length);

    // Check for duplicates
    const idMap = {};
    const duplicates = [];

    courses.forEach(c => {
        if (!c.image_url) return;

        const mediaId = getMediaId(c.image_url);

        if (idMap[mediaId]) {
            duplicates.push({
                keep: idMap[mediaId],
                duplicate: c,
                param: mediaId
            });
        } else {
            idMap[mediaId] = c;
        }
    });

    console.log('Found duplicates based on ID:', duplicates.length);
    for (const d of duplicates) {
        console.log(`Duplicate found: "${d.duplicate.title}" (ID: ${d.duplicate.id}) shares image with "${d.keep.title}"`);

        // Generate a new unique seed image
        const seed = Math.floor(Math.random() * 10000000);
        const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(d.duplicate.title)}%20abstract%20technology?width=1280&height=720&nologo=true&seed=${seed}`;

        console.log(`Updating "${d.duplicate.title}" to new unique URL: ${newUrl}`);

        const { error } = await supabase
            .from('courses')
            .update({ image_url: newUrl })
            .eq('id', d.duplicate.id);

        if (error) console.error('Error updating:', error);
        else console.log('Update successful.');
    }
})();
