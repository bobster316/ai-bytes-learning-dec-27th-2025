const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runNanoRestoration() {
    console.log('🚀 Starting "NANO BANANA" Cinematic Restoration Sweep...');

    // 1. Purge the Robots first
    console.log('🧹 Purging any remaining Pollinations robots...');
    await supabase.from('lesson_images').delete().ilike('image_url', '%pollinations%');

    // 2. Target the most recent 10 courses for immediate impact
    const { data: courses } = await supabase.from('courses')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(1);

    for (const course of courses) {
        console.log(`\n📦 Restoration: ${course.title}`);

        const { data: topics } = await supabase.from('course_topics').select('id').eq('course_id', course.id);
        const topicIds = (topics || []).map(t => t.id);
        const { data: lessons } = await supabase.from('course_lessons').select('*').in('topic_id', topicIds);

        if (!lessons) continue;

        for (const lesson of lessons) {
            console.log(`  └─ Lesson: ${lesson.title}`);
            const images = [];

            // Generate 12 varied prompts via Gemini Text
            const promptGenerator = `Topic: ${lesson.title}. Text: ${lesson.content_markdown?.slice(0, 1000)}. 
            Generate exactly 12 UNIQUE, descriptive image prompts for cinematic technology 3D renders. 
            STRICT JSON ARRAY: ["prompt1", "prompt2", ...]`;

            const textResult = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: promptGenerator }] }]
            });
            const textResponse = textResult.candidates[0].content.parts[0].text;
            const keywords = JSON.parse(textResponse.replace(/```json|```/g, '').trim());

            for (let i = 0; i < keywords.length; i++) {
                const kw = keywords[i];
                console.log(`     - Generating Visual ${i + 1}/12: ${kw.substring(0, 30)}...`);

                try {
                    // NANO BANANA GENERATION
                    const response = await genAI.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: `HIGH-END CINEMATIC 3D RENDER. SUBJECT: ${kw}. STYLE: Dark premium void background, volumetric lighting, cyan and gold accents, 8k resolution, photorealistic details. NO TEXT.`,
                        config: {
                            temperature: 0.8,
                            randomSeed: Math.floor(Math.random() * 1000000)
                        }
                    });

                    if (response.candidates && response.candidates[0].content?.parts[0]?.inlineData) {
                        const base64 = response.candidates[0].content.parts[0].inlineData.data;
                        const mimeType = response.candidates[0].content.parts[0].inlineData.mimeType || 'image/png';
                        const dataUri = `data:${mimeType};base64,${base64}`;

                        images.push({
                            lesson_id: lesson.id,
                            image_url: dataUri,
                            alt_text: kw,
                            caption: kw,
                            order_index: i + 1,
                            source: 'Nano Banana Engine',
                            source_attribution: 'Google Gemini'
                        });
                    }

                    await sleep(2000); // Throttling for stability (API limits)
                } catch (err) {
                    console.error(`     ⚠️ Failed one image, skipping:`, err.message);
                }
            }

            if (images.length > 0) {
                await supabase.from('lesson_images').delete().eq('lesson_id', lesson.id);
                await supabase.from('lesson_images').insert(images);
                console.log(`     ✅ Restored with 12 Nano Banana visuals.`);
            }
        }
    }
    console.log('\n✨ NANO BANANA RESTORATION COMPLETE.');
}

runNanoRestoration();
