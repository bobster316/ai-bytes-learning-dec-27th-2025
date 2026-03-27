
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testAvatarGroup() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const groupId = 'Adriana'; // Attempting to use Adriana as a group ID

    console.log(`Testing HeyGen Avatar Group API for Group: ${groupId}...\n`);

    try {
        const response = await fetch(`https://api.heygen.com/v2/avatars/${groupId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey!
            }
        });

        const data = await response.json();
        console.log('Status code:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAvatarGroup();
