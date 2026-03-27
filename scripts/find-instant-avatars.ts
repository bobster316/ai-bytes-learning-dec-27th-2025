/**
 * Try to access instant avatars using different API approaches
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

async function tryInstantAvatarEndpoints() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const endpoints = [
        { name: 'V2 Avatars (Standard)', url: 'https://api.heygen.com/v2/avatars' },
        { name: 'V1 Avatars', url: 'https://api.heygen.com/v1/avatar.list' },
        { name: 'V2 Instant Avatars', url: 'https://api.heygen.com/v2/avatars/instant' },
        { name: 'V2 Custom Avatars', url: 'https://api.heygen.com/v2/avatars/custom' },
        { name: 'V2 My Avatars', url: 'https://api.heygen.com/v2/avatars/my' },
    ];

    console.log('='.repeat(60));
    console.log('🔍 TESTING DIFFERENT AVATAR ENDPOINTS');
    console.log('='.repeat(60));
    console.log('');

    for (const endpoint of endpoints) {
        console.log(`Testing: ${endpoint.name}`);
        console.log(`URL: ${endpoint.url}`);

        try {
            const response = await fetch(endpoint.url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Api-Key': apiKey!
                }
            });

            console.log(`Status: ${response.status} ${response.statusText}`);

            if (response.ok) {
                const data = await response.json();
                const avatars = data.data?.avatars || data.avatars || data.data || [];

                if (Array.isArray(avatars)) {
                    console.log(`✅ Found ${avatars.length} avatars`);

                    // Look for Sarah or Lana
                    const customAvatars = avatars.filter((a: any) =>
                        a.avatar_name?.toLowerCase().includes('sarah') ||
                        a.avatar_name?.toLowerCase().includes('lana') ||
                        a.avatar_id === '928a4d33d7d2466c865a2fbea708e80a'
                    );

                    if (customAvatars.length > 0) {
                        console.log(`🎉 FOUND CUSTOM AVATARS!`);
                        customAvatars.forEach((a: any) => {
                            console.log(`  - ${a.avatar_name}: ${a.avatar_id}`);
                        });

                        // Save the full response
                        const filename = `avatars-${endpoint.name.toLowerCase().replace(/\s+/g, '-')}.json`;
                        writeFileSync(filename, JSON.stringify(avatars, null, 2));
                        console.log(`  Saved to: ${filename}`);
                    } else {
                        console.log(`  No Sarah/Lana avatars in this endpoint`);
                    }
                } else {
                    console.log(`  Response format: ${JSON.stringify(data).substring(0, 100)}...`);
                }
            } else {
                const errorText = await response.text();
                console.log(`❌ Error: ${errorText.substring(0, 100)}`);
            }
        } catch (error: any) {
            console.log(`❌ Request failed: ${error.message}`);
        }

        console.log('');
    }

    console.log('='.repeat(60));
    console.log('If no custom avatars found, they may require:');
    console.log('1. Different API permissions');
    console.log('2. Enterprise/Pro plan access');
    console.log('3. Special authentication method');
    console.log('='.repeat(60));
}

tryInstantAvatarEndpoints();
