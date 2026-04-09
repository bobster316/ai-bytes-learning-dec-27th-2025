const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const PEXELS_KEY = process.env.PEXELS_API_KEY;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPexelsImage(query, page = 1) {
    if (!PEXELS_KEY) return null;
    try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + " cinematic technology 8k")}&per_page=1&page=${page}&orientation=landscape`;
        const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
        if (res.status === 429) {
            console.warn('Rate limit hit, waiting 5 seconds...');
            await sleep(5000);
            return fetchPexelsImage(query, page);
        }
        const data = await res.json();
        return data.photos && data.photos.length > 0 ? data.photos[0].src.large2x : null;
    } catch (e) {
        return null;
    }
}

async function enhanceAllCourses() {
    console.log('🚀 Starting NO-FAIL Cinematic Restoration (Pexels + Delay)...');

    const { data: courses, error } = await supabase.from('courses').select('id, title');
    if (error) return console.error('Error:', error);

    for (const course of courses) {
        console.log(`\n📦 Course: ${course.title}`);
        const { data: topics } = await supabase.from('course_topics').select('id').eq('course_id', course.id);
        const topicIds = (topics || []).map(t => t.id);
        const { data: lessons } = await supabase.from('course_lessons').select('*').in('topic_id', topicIds);

        if (!lessons) continue;

        for (const lesson of lessons) {
            console.log(`  └─ Lesson: ${lesson.title}`);
            try {
                // Generate 12 varied search terms
                const prompt = `Topic: ${lesson.title}. Generate 12 specific search keywords for premium stock photography that visualize this lesson's concepts. 
                STRICT JSON ARRAY: ["keyword1", "keyword2", ...]`;

                const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
                });

                const data = await geminiResp.json();
                const keywords = JSON.parse(data.candidates[0].content.parts[0].text);

                const imagesToInsert = [];
                for (let i = 0; i < Math.min(keywords.length, 12); i++) {
                    const kw = keywords[i];
                    console.log(`     - Fetching ${i + 1}/12: ${kw}`);
                    let url = await fetchPexelsImage(kw, i + 1);

                    if (!url) {
                        // Very last resort: a high-quality technology illustration from a different search
                        url = await fetchPexelsImage("artificial intelligence future", i + 1);
                    }

                    if (url) {
                        imagesToInsert.push({
                            lesson_id: lesson.id,
                            image_url: url,
                            alt_text: kw,
                            caption: kw.charAt(0).toUpperCase() + kw.slice(1),
                            order_index: i + 1,
                            source: 'Pexels Cinematic',
                            source_attribution: 'Pexels'
                        });
                    }
                    await sleep(1500); // 1.5s delay to stay under rate limits
                }

                if (imagesToInsert.length > 0) {
                    await supabase.from('lesson_images').delete().eq('lesson_id', lesson.id);
                    await supabase.from('lesson_images').insert(imagesToInsert);
                    console.log(`     ✅ Restored ${imagesToInsert.length} Cinematic Visuals`);
                }
            } catch (err) {
                console.error(`     ❌ Failed ${lesson.title}:`, err.message);
            }
        }
    }
}

enhanceAllCourses();
