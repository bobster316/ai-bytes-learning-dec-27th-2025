
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function standardizeLessons() {
    console.log('--- STARTING LESSON STANDARDIZATION ---');

    const { data: lessons, error } = await supabase
        .from('course_lessons')
        .select('id, title, content_html, content_markdown');

    if (error || !lessons) {
        console.error('Error fetching lessons', error);
        return;
    }

    console.log(`Found ${lessons.length} lessons to check.`);

    for (const lesson of lessons) {
        let content;
        try {
            content = JSON.parse(lesson.content_html || '{}');
        } catch (e) {
            console.log(`Skipping [${lesson.id}] - Content is not JSON.`);
            continue;
        }

        // Check if it already has the new features
        const hasGlossary = content.glossary && content.glossary.length > 0;
        const hasBolding = (lesson.content_markdown || '').includes('**');

        if (hasGlossary && hasBolding) {
            console.log(`Skipping [${lesson.id}] - Already standardized.`);
            continue;
        }

        console.log(`Standardizing [${lesson.id}]: ${lesson.title}...`);

        const standardizePrompt = `
        You are an Elite Educational Editor at AI Bytes Learning.
        STANDARDIZE this lesson content to meet our "High-Velocity Byte" (15-minute) standards.
        
        RULES:
        1. BOLDING: Highlight every key AI term and core concept using **bold styling**.
        2. STRUCTURE: Ensure paragraphs are exactly 2-3 sentences. Add blank lines between paragraphs.
        3. GLOSSARY: Create a 5-item glossary for this lesson {term, definition}.
        4. DEPTH: Keep the depth professional but the analogies simple.
        
        ORIGINAL CONTENT (JSON):
        ${JSON.stringify(content)}
        
        RETURN ONLY THE UPDATED CONTENT AS VALID JSON:
        (Keep all original fields like instructorInsight, handsOnChallenge, etc. Add/Update glossary and bold the text in introduction/sections/etc.)
        `;

        try {
            const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: standardizePrompt }] }],
                    generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
                })
            });

            if (!response.ok) throw new Error(`API Error ${response.status}`);

            const rawResult = await response.json();
            const standardizedContent = JSON.parse(rawResult.candidates[0].content.parts[0].text);

            await supabase
                .from('course_lessons')
                .update({
                    content_html: JSON.stringify(standardizedContent),
                    content_markdown: standardizedContent.introduction + "\n\n" + (standardizedContent.sections || []).map(s => `### ${s.title}\n\n${s.content}`).join("\n\n")
                })
                .eq('id', lesson.id);

            console.log(`✅ Standardized [${lesson.id}].`);
        } catch (e) {
            console.error(`❌ Failed [${lesson.id}]:`, e.message);
        }

        // Sleep to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('--- STANDARDIZATION COMPLETE ---');
}

standardizeLessons();
