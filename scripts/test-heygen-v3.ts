/**
 * Test HeyGen V3 API with existing V3 templates
 * This should work even without V4 templates according to support
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testV3API() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const templateId = process.env.HEYGEN_TEMPLATE_COURSE_INTRO;

    console.log('🧪 Testing HeyGen V3 API with V3 Template\n');
    console.log('Template ID:', templateId);
    console.log('API Endpoint: /v3/template/{id}/generate');
    console.log('');

    // Test with just audio_url (no voice_id for now)
    const testPayload = {
        variables: {
            audio_url: 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/1737618829088_test-heygen-integration.mp3'
        }
    };

    console.log('Request payload:', JSON.stringify(testPayload, null, 2));
    console.log('');

    try {
        console.log('Calling HeyGen V3 API...');
        const response = await fetch(`https://api.heygen.com/v3/template/${templateId}/generate`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey!
            },
            body: JSON.stringify(testPayload)
        });

        const responseText = await response.text();

        console.log('\nResponse status:', response.status);
        console.log('Response body:', responseText);

        if (!response.ok) {
            console.error('\n❌ API call failed');
            try {
                const errorData = JSON.parse(responseText);
                console.error('Error:', JSON.stringify(errorData, null, 2));
            } catch {
                console.error('Raw error:', responseText);
            }

            console.log('\n💡 Next steps:');
            console.log('1. Create new templates in V4 editor');
            console.log('2. Add audio_url and voice_id variables');
            console.log('3. Update template IDs in .env.local');

            process.exit(1);
        }

        console.log('\n✅ V3 API call successful!');
        const data = JSON.parse(responseText);
        console.log('Video ID:', data.data?.video_id || data.video_id);
        console.log('\nThis means V3 API works! Now create V4 templates to add voice_id support.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

testV3API();
