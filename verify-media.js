
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkImages() {
    // Get all images for the new course
    const { data: course } = await supabase.from('courses').select('id').order('created_at', { ascending: false }).limit(1).single();

    // Get all topics
    const { data: topics } = await supabase.from('course_topics').select('id').eq('course_id', course.id);
    const topicIds = topics.map(t => t.id);

    // Get all lessons
    const { data: lessons } = await supabase.from('course_lessons').select('id, title').in('topic_id', topicIds);
    const lessonIds = lessons.map(l => l.id);

    // Get all images
    const { data: images } = await supabase.from('lesson_images').select('image_url, alt_text, lesson_id').in('lesson_id', lessonIds);

    console.log(`Total Images found: ${images.length}`);

    // Check for duplicates
    const urlCounts = {};
    images.forEach(img => {
        // Strip query params for stricter check, or keep them if they differentiate signatures
        // Unsplash URLs often differ only by signature even for same image if not careful, 
        // but my code strips IDs to prevent usage. Ideally.
        // Let's check exact URL match first.
        urlCounts[img.image_url] = (urlCounts[img.image_url] || 0) + 1;
    });

    let dups = 0;
    Object.entries(urlCounts).forEach(([url, count]) => {
        if (count > 1) {
            console.log(`Duplicate found: ${url} (Count: ${count})`);
            dups++;
        }
    });

    if (dups === 0) {
        console.log("No duplicate images found!");
    } else {
        console.log(`Found ${dups} duplicates.`);
    }

    // Check relevance (heuristic: check alt text for "computer vision" or related keywords)
    const keywords = ['vision', 'computer', 'ai', 'neural', 'robot', 'code', 'data', 'processing', 'camera'];
    let relevantCount = 0;
    images.forEach(img => {
        const lowerAlt = (img.alt_text || '').toLowerCase();
        if (keywords.some(k => lowerAlt.includes(k))) {
            relevantCount++;
        }
    });

    console.log(`Relevance Score: ${relevantCount}/${images.length} contain keywords in Alt Text.`);
}

checkImages();
