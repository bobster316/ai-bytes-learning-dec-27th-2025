
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function testDalle() {
    console.log('🔍 Testing DALL-E API...');
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    if (process.env.OPENAI_API_KEY) {
        console.log('API Key starts with:', process.env.OPENAI_API_KEY.substring(0, 8) + '...');
    }

    try {
        console.log('📡 Calling DALL-E...');

        // Set a timeout to prevent hanging
        const responsePromise = openai.images.generate({
            model: "dall-e-3",
            prompt: "Educational diagram showing a neural network with nodes and connections. Technical illustration style, not a photograph. Dark background with neon blue lines.",
            n: 1,
            size: "1024x1024"
        });

        // Race against a timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out after 60s')), 60000)
        );

        const response: any = await Promise.race([responsePromise, timeoutPromise]);

        console.log('✅ DALL-E SUCCESS!');
        console.log('🖼️  Image URL:', response.data[0].url);
        console.log('📝 Revised prompt:', response.data[0].revised_prompt);

    } catch (error: any) {
        console.error('❌ DALL-E FAILED');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        if (error.code) console.error('Error code:', error.code);
        if (error.response) console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
}

// Actually run the function
testDalle().then(() => {
    console.log('✨ Test complete');
    process.exit(0);
}).catch(err => {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
});
