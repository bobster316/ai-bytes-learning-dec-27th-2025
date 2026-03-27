
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function findIsabella() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return;

    try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': apiKey }
        });
        const data = await response.json();
        const isabella = data.voices.find((v: any) => v.name.toLowerCase().includes('isabella'));
        if (isabella) {
            console.log(`ISABELLA_ID: ${isabella.voice_id}`);
        }
    } catch (error) { }
}
findIsabella();
