/**
 * Get custom/uploaded avatars (not just public ones)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function getCustomAvatars() {
    const apiKey = process.env.HEYGEN_API_KEY;

    console.log('📋 Fetching YOUR custom avatars...\n');

    try {
        // Try to get user's custom avatars
        const response = await fetch('https://api.heygen.com/v1/avatar.list', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey!
            }
        });

        if (!response.ok) {
            console.log('Trying v2 endpoint...');
            // Try v2 endpoint
            const response2 = await fetch('https://api.heygen.com/v2/avatars?type=custom', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Api-Key': apiKey!
                }
            });

            if (!response2.ok) {
                const errorText = await response2.text();
                console.error('❌ Failed to fetch custom avatars');
                console.error('Response:', errorText);
                process.exit(1);
            }

            const data = await response2.json();
            console.log('Response:', JSON.stringify(data, null, 2));
            return;
        }

        const data = await response.json();

        console.log('✅ Custom avatars retrieved!\n');
        console.log('Full response:', JSON.stringify(data, null, 2));

        if (data.data?.avatars) {
            console.log(`\nFound ${data.data.avatars.length} custom avatars:\n`);

            data.data.avatars.forEach((avatar: any, index: number) => {
                console.log(`${index + 1}. ${avatar.avatar_name || avatar.name}`);
                console.log(`   ID: ${avatar.avatar_id}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

getCustomAvatars();
