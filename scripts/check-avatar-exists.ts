/**
 * Check if a specific avatar exists and get its details
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function checkAvatarExists() {
    const avatarId = '928a4d33d7d2466c865a2fbea708e80a';
    const apiKey = process.env.HEYGEN_API_KEY;

    console.log('Checking avatar:', avatarId);
    console.log('');

    try {
        // Try to get avatar details
        const response = await fetch(`https://api.heygen.com/v2/avatars/${avatarId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey!
            }
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('\nResponse:');
        console.log(JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Avatar exists and is accessible!');
        } else {
            console.log('\n❌ Avatar not accessible via API');
            console.log('\nPossible reasons:');
            console.log('1. This is a custom/instant avatar (not accessible via public API)');
            console.log('2. Avatar is from a different HeyGen account');
            console.log('3. Avatar requires special permissions');
            console.log('\nSuggestion: Use a public stock avatar from the list instead');
        }

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

checkAvatarExists();
