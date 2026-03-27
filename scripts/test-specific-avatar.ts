/**
 * Test specific avatar ID to show exact error
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testSpecificAvatar() {
    const avatarId = '928a4d33d7d2466c865a2fbea708e80a';
    const apiKey = process.env.HEYGEN_API_KEY;
    const testAudioUrl = 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/1769608996428_heygen-test-video.mp3';

    console.log('='.repeat(60));
    console.log('Testing Avatar ID:', avatarId);
    console.log('='.repeat(60));
    console.log('');

    try {
        const response = await fetch('https://api.heygen.com/v2/video/generate', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey!
            },
            body: JSON.stringify({
                title: 'Avatar Test',
                video_inputs: [{
                    character: {
                        type: 'avatar',
                        avatar_id: avatarId,
                        avatar_style: 'normal'
                    },
                    voice: {
                        type: 'audio',
                        audio_url: testAudioUrl
                    }
                }],
                dimension: {
                    width: 1280,
                    height: 720
                },
                aspect_ratio: '16:9'
            })
        });

        console.log('HTTP Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('');

        const data = await response.json();

        console.log('Full API Response:');
        console.log(JSON.stringify(data, null, 2));
        console.log('');

        if (!response.ok) {
            console.log('='.repeat(60));
            console.log('❌ ERROR DETAILS:');
            console.log('='.repeat(60));
            if (data.error) {
                console.log('Error Code:', data.error.code);
                console.log('Error Message:', data.error.message);
            }
            console.log('');
            console.log('This avatar ID is not accessible via the HeyGen API.');
            console.log('It may be a custom instant avatar or from a different account.');
        } else {
            console.log('✅ Avatar works!');
        }

    } catch (error: any) {
        console.error('Request failed:', error.message);
    }
}

testSpecificAvatar();
