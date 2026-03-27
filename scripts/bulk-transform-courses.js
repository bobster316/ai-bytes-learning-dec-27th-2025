
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function bulkTransform() {
    console.log('--- STARTING BULK TRANSFORMATION ---');

    // 1. Fetch lessons that are likely rambling (> 1200 words)
    // For safety, we'll process 10 at a time
    const { data: lessons, error } = await supabase
        .from('course_lessons')
        .select('id, title, content_html, content_markdown')
        .limit(10);

    if (error || !lessons) {
        console.error('Error fetching lessons', error);
        return;
    }

    for (const lesson of lessons) {
        const wordCount = (lesson.content_html || '').replace(/<[^>]*>/g, '').split(/\s+/).length;

        if (wordCount < 1100) {
            console.log(`Skipping [${lesson.id}] - Already efficient (${wordCount} words).`);
            continue;
        }

        console.log(`Transforming [${lesson.id}]: ${lesson.title} (${wordCount} words)...`);

        const compressionPrompt = `
        You are the Lead Editor at AI Bytes Learning. 
        DEEP TRANSFORM this lesson into a "High-Velocity Byte".
        
        RULES:
        1. TARGET: 800-900 words. (MAX 1000).
        2. STYLE: No fluff, everyday metaphors, high-impact.
        3. STRUCTURE: Intro (Hook+Analogy), 3 Sections (Concept+Analogy+UseCase), Checklist recap.
        4. VISUALS: Exactly 4 markers: ![IMAGE: Hook Metaphor], ![IMAGE: Concept Diagram], ![IMAGE: Real-world Proof], ![IMAGE: Recap Infographic].
        
        ORIGINAL:
        ${lesson.content_markdown || lesson.content_html}
        
        RETURN ONLY VALID JSON:
        { "title": "...", "content_markdown": "...", "summary": ["..."] }
        `;

        try {
            const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: compressionPrompt }] }],
                    generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
                })
            });

            if (!response.ok) throw new Error(`API Error ${response.status}`);

            const rawResult = await response.json();
            const transformedData = JSON.parse(rawResult.candidates[0].content.parts[0].text);

            await supabase
                .from('course_lessons')
                .update({
                    title: transformedData.title,
                    content_markdown: transformedData.content_markdown,
                    key_takeaways: transformedData.summary
                })
                .eq('id', lesson.id);

            console.log(`✅ Success: ${wordCount} -> ${transformedData.content_markdown.split(/\s+/).length} words.`);
        } catch (e) {
            console.error(`❌ Failed [${lesson.id}]:`, e.message);
        }
    }

    console.log('--- BULK TRANSFORMATION COMPLETE ---');
}

bulkTransform();
