
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function listVoices() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        console.error('ELEVENLABS_API_KEY not found');
        return;
    }

    try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: {
                'xi-api-key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        const voices = data.voices;

        console.log(`Found ${voices.length} voices.`);

        const isabella = voices.find((v: any) => v.name.toLowerCase().includes('isabella'));
        if (isabella) {
            console.log('\n✅ FOUND ISABELLA:');
            console.log(JSON.stringify(isabella, null, 2));
        } else {
            console.log('\n❌ Isabella not found in your voice list.');
            console.log('Top 10 voices:');
            voices.slice(0, 10).forEach((v: any) => console.log(`- ${v.name} [ID: ${v.voice_id}]`));
        }
    } catch (error: any) {
        console.error('Failed to list voices:', error.message);
    }
}

listVoices();
