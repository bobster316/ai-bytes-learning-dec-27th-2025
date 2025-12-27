
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLessonImages() {
    const lessonId = '2178';
    console.log(`Checking images for lesson ${lessonId}...`);

    const { data, error } = await supabase
        .from('lesson_images')
        .select('*')
        .eq('lesson_id', lessonId);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} images.`);
        data.forEach(img => {
            console.log(`- Index: ${img.order_index}, URL: ${img.image_url.substring(0, 50)}...`);
        });
    }
}

checkLessonImages();
