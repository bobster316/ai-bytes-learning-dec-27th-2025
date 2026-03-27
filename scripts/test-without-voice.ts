/**
 * Test HeyGen API WITHOUT voice_id to see if that's the issue
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testWithoutVoiceId() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const templateId = process.env.HEYGEN_TEMPLATE_COURSE_INTRO;

    console.log('Testing HeyGen API WITHOUT voice_id...\n');
    console.log('Template ID:', templateId);
    console.log('');

    // Test WITHOUT voice_id
    const testPayload = {
        variables: {
            audio_url: 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/1737618829088_test-heygen-integration.mp3'
        }
    };

    console.log('Request payload:', JSON.stringify(testPayload, null, 2));
    console.log('');

    try {
        const response = await fetch(`https://api.heygen.com/v2/template/${templateId}/generate`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey!
            },
            body: JSON.stringify(testPayload)
        });

        const responseText = await response.text();

        console.log('Response status:', response.status);
        console.log('Response body:', responseText);

        if (!response.ok) {
            console.error('\n❌ API call failed');
            try {
                const errorData = JSON.parse(responseText);
                console.error('Error data:', JSON.stringify(errorData, null, 2));
            } catch {
                console.error('Raw error:', responseText);
            }
            process.exit(1);
        }

        console.log('\n✅ API call successful WITHOUT voice_id!');
        const data = JSON.parse(responseText);
        console.log('Video ID:', data.data?.video_id || data.video_id);
        console.log('\nThis means the voice_id variable is not configured in your HeyGen template.');
        console.log('You need to add it in the HeyGen template editor as mentioned in the support message.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

testWithoutVoiceId();
