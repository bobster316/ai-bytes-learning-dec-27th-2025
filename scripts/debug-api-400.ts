import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';
const TEMPLATE_ID = '411231c2870e4df98f24351f3ab616d6';
const AUDIO_URL = 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/1769806129443_test-heygen-api.mp3';

async function test() {
    const payload = {
        template_id: TEMPLATE_ID,
        variables: {
            "audio_url": {
                "type": "audio",
                "audio_url": AUDIO_URL
            }
        }
    };

    console.log('Sending Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(`${BASE_URL}/v2/video/generate`, {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('Status Code:', response.status);
        const data = await response.json();
        console.log('Response Body:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

test();
