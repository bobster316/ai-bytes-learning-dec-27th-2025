import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testHeyGenAPI() {
    console.log('Testing HeyGen API directly...\n');

    const apiKey = process.env.HEYGEN_API_KEY;
    const templateId = process.env.HEYGEN_TEMPLATE_COURSE_INTRO;

    console.log(`API Key: ${apiKey?.substring(0, 20)}...`);
    console.log(`Template ID: ${templateId}\n`);

    // Test 1: Check user/credits
    console.log('Test 1: Checking credits...');
    try {
        const response = await fetch('https://api.heygen.com/v1/user', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey!
            }
        });

        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error: any) {
        console.error('Error:', error.message);
    }

    // Test 2: Generate video
    console.log('\nTest 2: Generating video...');
    try {
        const testAudioUrl = 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/test.mp3';

        const response = await fetch(`https://api.heygen.com/v2/template/${templateId}/generate`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Api-Key': apiKey!
            },
            body: JSON.stringify({
                variables: {
                    audio_url: testAudioUrl
                }
            })
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log('Response:', text);

        if (response.ok) {
            const data = JSON.parse(text);
            console.log('\n✅ Video generation started!');
            console.log('Video ID:', data.data?.video_id || data.video_id);
        }
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

testHeyGenAPI();
