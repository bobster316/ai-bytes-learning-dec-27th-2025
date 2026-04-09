
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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
            const response = await fetch(`${OPENROUTER_URL}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-v3.2',
                    messages: [{ role: "user", content: compressionPrompt }],
                    temperature: 0.7,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) throw new Error(`API Error ${response.status}`);

            const rawResult = await response.json();
            const transformedData = JSON.parse(rawResult.choices[0].message.content);

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
