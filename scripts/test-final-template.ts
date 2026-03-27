import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';
const TEMPLATE_ID = '411231c2870e4df98f24351f3ab616d6';
const AUDIO_URL = 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/1769806129443_test-heygen-api.mp3';

async function test(name: string, vars: any) {
    console.log(`\n--- Test: ${name} ---`);
    try {
        const response = await fetch(`${BASE_URL}/v2/video/generate`, {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_id: TEMPLATE_ID,
                variables: vars
            })
        });

        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Body:', text);
    } catch (e) {
        console.error('Err:', e);
    }
}

async function run() {
    // Variation A: Explicit type: audio, url property
    await test('Var A (type:audio, url)', {
        "audio_url": {
            "type": "audio",
            "url": AUDIO_URL
        }
    });

    // Variation B: Explicit type: audio, audio_url property
    await test('Var B (type:audio, audio_url)', {
        "audio_url": {
            "type": "audio",
            "audio_url": AUDIO_URL
        }
    });

    // Variation C: Explicit type: voice, audio_url property
    await test('Var C (type:voice, audio_url)', {
        "audio_url": {
            "type": "voice",
            "audio_url": AUDIO_URL
        }
    });
}

run();
