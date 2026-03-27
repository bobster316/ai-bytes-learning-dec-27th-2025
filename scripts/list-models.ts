
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log(`Listing models from: ${url}`);

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Available Models:');
            data.models.forEach((m: any) => {
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log(`❌ Failed to list models: ${response.status} ${response.statusText}`);
            console.log(await response.text());
        }
    } catch (e: any) {
        console.error(`❌ Error: ${e.message}`);
    }
}

listModels();
