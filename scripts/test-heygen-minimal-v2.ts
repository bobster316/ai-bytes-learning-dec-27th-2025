/**
 * Minimal test to debug HeyGen API format
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testMinimal() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const templateId = process.env.HEYGEN_TEMPLATE_COURSE_INTRO;

    console.log('Testing HeyGen API with minimal payload...\n');
    console.log('Template ID:', templateId);
    console.log('');

    // Use an existing audio file from Supabase
    const audioUrl = 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/1737618829088_test-heygen-integration.mp3';

    const payload = {
        title: 'Test Video',
        caption: false,
        variables: {
            audio_url: {
                name: 'audio_url',
                type: 'audio',
                properties: {
                    url: audioUrl,
                    asset_id: null
                }
            }
        }
    };

    console.log('Request payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    try {
        const response = await fetch(`https://api.heygen.com/v2/template/${templateId}/generate`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey!
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        console.log('Response status:', response.status);
        console.log('Response body:', responseText);
        console.log('');

        if (!response.ok) {
            console.error('❌ API call failed');
            try {
                const errorData = JSON.parse(responseText);
                console.error('Error:', JSON.stringify(errorData, null, 2));
            } catch {
                console.error('Raw error:', responseText);
            }
            process.exit(1);
        }

        console.log('✅ SUCCESS!');
        const data = JSON.parse(responseText);
        console.log('Video ID:', data.data?.video_id || data.video_id);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testMinimal();
