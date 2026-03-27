const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function uploadToStorage(buffer, prompt) {
    try {
        const timestamp = Date.now();
        const slug = prompt.substring(0, 20).replace(/[^a-z0-9]/yi, '-').toLowerCase();
        const filename = `gemini-${timestamp}-${slug}.png`;
        const filePath = `generated/${filename}`;

        console.log(`Uploading ${filename}...`);

        const { error: uploadError } = await supabase.storage
            .from('course-images')
            .upload(filePath, buffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload failed:', uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from('course-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (e) {
        console.error('Upload exception:', e);
        return null;
    }
}

async function generateImage(title) {
    console.log(`Generating image for: "${title}"`);
    try {
        const prompt = `Create a high-impact, cinematic 3D render for the eLearning course: "${title}". Use weightless visual metaphors in a dark pro tech void. NO TEXT.`;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
            config: {
                temperature: 0.85
            }
        });

        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            const part = response.candidates[0].content.parts.find(p => p.inlineData);
            if (part && part.inlineData && part.inlineData.data) {
                const buffer = Buffer.from(part.inlineData.data, 'base64');
                const url = await uploadToStorage(buffer, title);
                return url;
            }
        }
    } catch (error) {
        console.error('Generation failed:', error);
    }
    return null;
}

async function updateFirstCourses() {
    console.log('Fetching first 3 courses...');
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url, created_at')
        .order('created_at', { ascending: true })
        .limit(3);

    if (error) {
        console.error('Error fetching courses:', error);
        return;
    }

    console.log(`Found ${courses.length} courses.`);

    for (const course of courses) {
        console.log(`\nProcessing Course: ${course.title} (${course.id})`);
        console.log(`Current Thumbnail: ${course.thumbnail_url}`);

        const newUrl = await generateImage(course.title);

        if (newUrl) {
            console.log(`New Thumbnail URL: ${newUrl}`);

            const { error: updateError } = await supabase
                .from('courses')
                .update({ thumbnail_url: newUrl })
                .eq('id', course.id);

            if (updateError) {
                console.error('Update failed:', updateError);
            } else {
                console.log('Update SUCCESS for course:', course.title);
            }
        } else {
            console.log('Skipping update due to generation failure.');
        }
    }
}

updateFirstCourses();
