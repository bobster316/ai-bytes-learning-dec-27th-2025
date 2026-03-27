
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testAvatarGroupList() {
    const apiKey = process.env.HEYGEN_API_KEY;

    console.log(`Testing HeyGen avatar_group.list API...\n`);

    try {
        const response = await fetch(`https://api.heygen.com/v2/avatar_group.list`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey!
            }
        });

        const text = await response.text();
        console.log('Status code:', response.status);
        try {
            const data = JSON.parse(text);
            console.log('Response:', JSON.stringify(data, null, 2));
        } catch {
            console.log('Raw response (not JSON):', text.substring(0, 500));
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAvatarGroupList();
