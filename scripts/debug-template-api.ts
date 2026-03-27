
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function debug() {
    const templateId = '411231c2870e4df98f24351f3ab616d6';
    const apiKey = process.env.HEYGEN_API_KEY;

    const payload = {
        test: false,
        caption: false,
        title: 'Debug Antigravity',
        variables: {
            audio_url: {
                name: 'audio_url',
                type: 'voice',
                properties: {
                    audio_url: 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/test-heygen-integration.mp3',
                    voice_id: '915ecf673764496a9589d3de49098540'
                }
            }
        }
    };

    console.log('Target Template:', templateId);
    console.log('API Key:', apiKey?.substring(0, 10) + '...');

    const res = await fetch(`https://api.heygen.com/v2/template/${templateId}/generate`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey!
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('\nFULL RESPONSE:');
    console.log(JSON.stringify(data, null, 2));
}

debug();
