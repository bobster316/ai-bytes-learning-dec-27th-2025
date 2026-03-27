
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkThumbnail() {
    const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .ilike('title', '%Business%')
        .limit(1);

    if (!courses || courses.length === 0) return;

    const { data: topics } = await supabase
        .from('course_topics')
        .select('title, thumbnail_url, video_url')
        .eq('course_id', courses[0].id)
        .limit(1);

    if (topics && topics.length > 0) {
        console.log(`Thumbnail: ${topics[0].thumbnail_url}`);
    }
}

checkThumbnail();
