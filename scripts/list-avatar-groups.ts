
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function listAvatarGroups() {
    const apiKey = process.env.HEYGEN_API_KEY;

    console.log(`Listing HeyGen Avatar Groups...\n`);

    try {
        const response = await fetch(`https://api.heygen.com/v2/avatar_groups`, {
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

listAvatarGroups();
