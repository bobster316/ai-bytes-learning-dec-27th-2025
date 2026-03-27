
import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function enhanceAllCourses() {
    console.log('🚀 Starting Visual Enhancement for all courses...');

    const { data: courses, error } = await supabase.from('courses').select('id, title');
    if (error) {
        console.error('Error fetching courses:', error);
        return;
    }

    console.log(`Found ${courses.length} courses to enhance.`);

    for (const course of courses) {
        console.log(`\n📦 Enhancing Course: ${course.title} (${course.id})`);

        const { data: topics } = await supabase.from('course_topics').select('id').eq('course_id', course.id);
        const topicIds = (topics || []).map((t: any) => t.id);

        const { data: actualLessons } = await supabase
            .from('course_lessons')
            .select('*')
            .in('topic_id', topicIds);

        if (!actualLessons) continue;

        for (const lesson of actualLessons) {
            console.log(`  └─ Enhancing Lesson: ${lesson.title}`);

            const { count } = await supabase
                .from('lesson_images')
                .select('*', { count: 'exact', head: true })
                .eq('lesson_id', lesson.id);

            if (count && count >= 12) {
                console.log(`     (Already has ${count} images, skipping)`);
                continue;
            }

            console.log(`     (Has ${count || 0} images. Adding high-density visuals...)`);

            try {
                const prompt = `
                SYSTEM: You are a Visual Curriculum Designer.
                LESSON CONTENT:
                ${lesson.content_markdown}

                TASK:
                The above lesson content lacks visual illustration.
                Generate exactly 12 NEW, high-quality image prompts that match the specific sections of this text.
                
                MIX:
                - 4 Technical Diagrams (Blueprints, data flows, architectures)
                - 4 Illustrations (Conceptual metaphors)
                - 2 Infographics (Stats, checklists)
                - 2 Photorealistic Metaphors
                
                FORMAT: Return a JSON array of objects:
                [{
                    "prompt": "4K, photorealistic, cinematic lighting, [detailed description]",
                    "alt_text": "Brief description",
                    "caption": "Educational caption explaining how this relates to the text",
                    "order_index": number (distribute from 1 to 12)
                }]
                `;

                const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });

                const data = await geminiResp.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("No response from Gemini");

                const newImages = JSON.parse(text);

                const imagesToInsert = newImages.map((img: any) => ({
                    lesson_id: lesson.id,
                    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1600',
                    alt_text: img.alt_text,
                    caption: img.caption,
                    order_index: img.order_index,
                    source: 'AI Bytes Generator',
                    source_attribution: 'AI Bytes Learning'
                }));

                await supabase.from('lesson_images').delete().eq('lesson_id', lesson.id);
                await supabase.from('lesson_images').insert(imagesToInsert);

                console.log(`     ✅ Added 12 visuals for '${lesson.title}'.`);
            } catch (err) {
                console.error(`     ❌ Failed to enhance lesson ${lesson.title}:`, err);
            }
        }
    }
    console.log('\n✅ All courses have been processed.');
}

enhanceAllCourses().catch(console.error);
