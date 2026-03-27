import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';

async function logEndpoint(name: string, path: string) {
    console.log(`\n=== Endpoint: ${name} (${path}) ===`);
    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            method: 'GET',
            headers: {
                'X-Api-Key': API_KEY || '',
                'Accept': 'application/json'
            }
        });
        console.log('Status:', response.status);
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            console.log('Data:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Raw Text (Not JSON):', text.substring(0, 500));
        }
    } catch (error: any) {
        console.error('Fetch Error:', error.message);
    }
}

async function run() {
    await logEndpoint('Talking Photos (V2)', '/v2/talking_photos');
    await logEndpoint('Avatars (V2)', '/v2/avatars');
    await logEndpoint('Templates (V2)', '/v2/templates');
}

run();
