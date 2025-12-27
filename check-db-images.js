require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
    console.log("Checking lesson_images table...");
    const { data, error } = await supabase
        .from('lesson_images')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching images:", error);
    } else {
        console.log("Latest 5 images:");
        data.forEach(img => {
            console.log(`- ID: ${img.id}`);
            console.log(`  URL: ${img.image_url.substring(0, 50)}...`);
            console.log(`  Alt: ${img.alt_text}`);
        });
    }
}

checkImages();
