import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';
const TEMPLATE_ID = '411231c2870e4df98f24351f3ab616d6';
const AUDIO_URL = 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/1769806129443_test-heygen-api.mp3';

async function diagnose(name: string, url: string, method: string, body: any) {
    console.log(`\n--- Diagnosing: ${name} ---`);
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'X-Api-Key': API_KEY || '',
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : null
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Full Response:', JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error('Error during diagnose:', e.message);
    }
}

async function run() {
    // Test 1: Unified API with Template ID
    await diagnose('Unified API v2/video/generate', `${BASE_URL}/v2/video/generate`, 'POST', {
        template_id: TEMPLATE_ID,
        variables: {
            "audio_url": { "type": "audio", "audio_url": AUDIO_URL }
        }
    });

    // Test 2: Legacy Template API (endpoint pattern 1)
    await diagnose('Legendary V2 Template API 1', `${BASE_URL}/v2/template/${TEMPLATE_ID}/generate`, 'POST', {
        variables: [
            { "key": "audio_url", "type": "audio", "audio_url": AUDIO_URL }
        ]
    });

    // Test 3: Legacy Template API (endpoint pattern 2)
    await diagnose('Legendary V2 Template API 2', `${BASE_URL}/v2/templates/${TEMPLATE_ID}/generate`, 'POST', {
        variables: [
            { "key": "audio_url", "type": "audio", "audio_url": AUDIO_URL }
        ]
    });
}

run();
