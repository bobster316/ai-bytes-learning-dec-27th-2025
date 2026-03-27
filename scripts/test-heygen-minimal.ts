/**
 * Minimal HeyGen API Test - Debug 400 Error
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testHeyGenAPI() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const templateId = process.env.HEYGEN_TEMPLATE_COURSE_INTRO;

    console.log('Testing HeyGen API...\n');
    console.log('API Key:', apiKey?.substring(0, 15) + '...');
    console.log('Template ID:', templateId);
    console.log('');

    // Test with minimal payload
    const testPayload = {
        variables: {
            audio_url: 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/test.mp3',
            voice_id: '21m00Tcm4TlvDq8ikWAM'
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
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
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

        console.log('\n✅ API call successful!');
        const data = JSON.parse(responseText);
        console.log('Video ID:', data.data?.video_id || data.video_id);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testHeyGenAPI();
