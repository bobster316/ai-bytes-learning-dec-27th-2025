import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';
const TEMPLATE_ID = '411231c2870e4df98f24351f3ab616d6';
const AUDIO_URL = 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/1769806129443_test-heygen-api.mp3';

async function testVariation(name: string, variables: any) {
    console.log(`\n--- Testing Variation: ${name} ---`);
    console.log('Payload:', JSON.stringify(variables, null, 2));

    try {
        const response = await fetch(`${BASE_URL}/v2/video/generate`, {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_id: TEMPLATE_ID,
                variables: variables,
                test: true // Use test mode to avoid spending credits if possible
            })
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

async function runTests() {
    // Variation 1: Direct URL in keys
    await testVariation('Direct URL', {
        "audio_url": AUDIO_URL
    });

    // Variation 2: Object with type: audio
    await testVariation('Object type: audio', {
        "audio_url": {
            "type": "audio",
            "audio_url": AUDIO_URL
        }
    });

    // Variation 3: Object with properties.url
    await testVariation('Object properties.url', {
        "audio_url": {
            "properties": {
                "url": AUDIO_URL
            }
        }
    });
}

runTests();
