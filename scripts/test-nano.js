const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testNanoBanan() {
    try {
        console.log('Testing Nano Banana (gemini-2.5-flash-image)...');

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: 'A cinematic 3D render of a golden banana floating in a dark tech void. 8k, photorealistic.'
        });

        console.log('Response received. Processing...');

        if (response && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
            const part = response.candidates[0].content.parts.find(p => p.inlineData);
            if (part && part.inlineData && part.inlineData.data) {
                const buffer = Buffer.from(part.inlineData.data, 'base64');
                console.log('Success! Image generated. Size:', buffer.length);

                // Test Upload
                const { createClient } = require('@supabase/supabase-js');
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

                if (supabaseUrl && supabaseKey) {
                    const supabase = createClient(supabaseUrl, supabaseKey);
                    console.log('Uploading to Supabase...');

                    const filename = `test-nano-${Date.now()}.png`;
                    const { data, error } = await supabase.storage
                        .from('course-images')
                        .upload(`generated/${filename}`, buffer, {
                            contentType: 'image/png',
                            upsert: false
                        });

                    if (error) {
                        console.error('Upload failed:', error);
                    } else {
                        const { data: publicData } = supabase.storage
                            .from('course-images')
                            .getPublicUrl(`generated/${filename}`);

                        console.log('Upload successful!');
                        console.log('Public URL:', publicData.publicUrl);
                    }
                } else {
                    console.log('Skipping upload test - missing credentials');
                }

            } else {
                console.log('No image data found in response.');
                console.log(JSON.stringify(response, null, 2));
            }
        } else {
            console.log('Unexpected response structure.');
            console.log(JSON.stringify(response, null, 2));
        }

    } catch (e) {
        console.error('Error testing models:', e.message);
    }
}

testNanoBanan();
