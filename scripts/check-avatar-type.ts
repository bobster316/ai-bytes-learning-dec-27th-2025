
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function checkType() {
    const avatarId = 'b2c2a13b0546422dbc65196020f2f845';
    const apiKey = process.env.HEYGEN_API_KEY!;
    const url = 'https://api.heygen.com/v2/video/generate';

    console.log(`🔍 Diagnosing ID: ${avatarId}`);

    // Test 1: As Instant Avatar
    console.log('--- Test 1: type = "avatar" ---');
    const payload1 = {
        video_inputs: [{
            character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' },
            voice: { type: 'text', input_text: 'Test', voice_id: '1bd001e7e50f421d891986aad5158bc8' }
        }],
        test: true
    };
    const res1 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
        body: JSON.stringify(payload1)
    });
    const data1 = await res1.json();
    console.log(`Status: ${res1.status}`);
    if (res1.ok) console.log('✅ VALID as Instant Avatar');
    else console.log(`❌ Invalid as Instant Avatar: ${JSON.stringify(data1.error)}`);

    // Test 2: As Talking Photo
    console.log('\n--- Test 2: type = "talking_photo" ---');
    const payload2 = {
        video_inputs: [{
            character: { type: 'talking_photo', talking_photo_id: avatarId },
            voice: { type: 'text', input_text: 'Test', voice_id: '1bd001e7e50f421d891986aad5158bc8' }
        }],
        test: true
    };
    const res2 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
        body: JSON.stringify(payload2)
    });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status}`);
    if (res2.ok) console.log('✅ VALID as Talking Photo');
    else console.log(`❌ Invalid as Talking Photo: ${JSON.stringify(data2.error)}`);
}

checkType();
