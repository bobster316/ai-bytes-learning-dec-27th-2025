
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function listCustomAssets() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const headers = {
        'Accept': 'application/json',
        'X-Api-Key': apiKey!
    };

    const endpoints = [
        { name: 'Avatar Groups', url: 'https://api.heygen.com/v2/avatar_group.list' },
        { name: 'Talking Photos', url: 'https://api.heygen.com/v2/talking_photos' },
        { name: 'Custom Avatars', url: 'https://api.heygen.com/v2/avatars?type=custom' },
        { name: 'V1 Avatar List', url: 'https://api.heygen.com/v1/avatar.list' }
    ];

    console.log('🚀 Comprehensive HeyGen Asset Listing...\n');

    for (const endpoint of endpoints) {
        console.log(`--- Checking ${endpoint.name} ---`);
        try {
            const response = await fetch(endpoint.url, { headers });
            const text = await response.text();

            if (!response.ok) {
                console.log(`❌ Error ${response.status}: ${text.substring(0, 100)}...`);
                continue;
            }

            try {
                const data = JSON.parse(text);
                console.log(`✅ Success!`);

                // Extract items based on known structures
                let items: any[] = [];
                if (data.data?.groups) items = data.data.groups;
                else if (data.data?.talking_photos) items = data.data.talking_photos;
                else if (data.data?.avatars) items = data.data.avatars;
                else if (data.avatars) items = data.avatars;

                if (items.length === 0) {
                    console.log('   (Empty list)');
                } else {
                    items.forEach((item: any, i: number) => {
                        const id = item.id || item.avatar_id || item.talking_photo_id;
                        const name = item.name || item.talking_photo_name || item.avatar_name;
                        console.log(`   ${i + 1}. ${name} [ID: ${id}]`);
                    });
                }
            } catch (err) {
                console.log(`❌ Parse Error: ${text.substring(0, 500)}...`);
            }
        } catch (error) {
            console.log(`❌ Fetch Error: ${error.message}`);
        }
        console.log('');
    }
}

listCustomAssets();
