
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function transformLesson() {
    console.log('--- STARTING PILOT TRANSFORMATION ---');

    console.log('Fetching lesson 3205...');
    const { data: lesson, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', 3205)
        .single();

    if (error || !lesson) {
        console.error('Lesson not found', error);
        return;
    }

    console.log(`Target Lesson: ${lesson.title}`);
    const originalWordCount = lesson.content_html ? lesson.content_html.replace(/<[^>]*>/g, '').split(/\s+/).length : (lesson.content_markdown ? lesson.content_markdown.split(/\s+/).length : 0);
    console.log(`Original Word Count: ${originalWordCount}`);

    const compressionPrompt = `
    You are the Lead Editor at AI Bytes Learning. 
    Your task is to DEEP TRANSFORM this rambling, long-form lesson into a "High-Velocity Byte".
    
    DNA RULES:
    1. TARGET LENGTH: 800-1000 words. (Do NOT exceed 1000).
    2. PEDAGOGY: Use everyday metaphors (first principles). No academic jargon.
    3. TONE: Engaging, high-impact, professional but accessible.
    4. STRUCTURE: 
       - Introduction (The Hook + Analogy)
       - 3 Simple Sections (Concept -> Analogy -> Use Case)
       - "If You Forget Everything Else" (One sentence summary)
       - Practical "Try This" Action.
    5. VISUALS: Identify exactly 4 moments for markers: ![IMAGE: Hook Metaphor], ![IMAGE: Concept Diagram], ![IMAGE: Real-world Proof], ![IMAGE: Recap Infographic].
    
    ORIGINAL CONTENT:
    ${lesson.content_markdown || lesson.content_html}
    
    RETURN ONLY A VALID JSON OBJECT (no markdown blocks around it):
    {
      "title": "Clear, Punchy Title",
      "content_markdown": "Full High-Velocity Markdown content",
      "summary": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
      "image_prompts": [
        { "type": "Metaphor", "prompt": "Prompt text", "caption": "Caption" },
        { "type": "Diagram", "prompt": "Prompt text", "caption": "Caption" },
        { "type": "Proof", "prompt": "Prompt text", "caption": "Caption" },
        { "type": "Infographic", "prompt": "Prompt text", "caption": "Caption" }
      ]
    }
    `;

    try {
        console.log('Compressing via Gemini 2.0 Flash (Direct Fetch)...');
        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: compressionPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json",
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`API Error ${response.status}: ${errBody}`);
        }

        const rawResult = await response.json();
        const responseText = rawResult.candidates[0].content.parts[0].text;

        const transformedData = JSON.parse(responseText);

        const newWordCount = transformedData.content_markdown.split(/\s+/).length;
        console.log(`Transformed Word Count: ${newWordCount}`);

        // 3. Update Database 
        console.log('Updating database...');
        const { error: updateError } = await supabase
            .from('course_lessons')
            .update({
                title: transformedData.title,
                content_markdown: transformedData.content_markdown,
                key_takeaways: transformedData.summary
            })
            .eq('id', lesson.id);

        if (updateError) {
            console.error('Update failed:', updateError);
        } else {
            console.log('✅ Transformation Complete.');
            console.log(`REDUCTION: ${originalWordCount} -> ${newWordCount} words.`);
        }
    } catch (e) {
        console.error('AI Transformation failed:', e);
    }
}

transformLesson();
