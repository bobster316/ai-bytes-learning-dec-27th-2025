import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';

async function findID() {
    if (!API_KEY) {
        console.error('HEYGEN_API_KEY not found');
        return;
    }

    const headers = {
        'X-Api-Key': API_KEY,
        'Accept': 'application/json'
    };

    try {
        // Method 1: List all Talking Photos (v2)
        console.log('--- Method 1: v2/talking_photos ---');
        const res1 = await fetch(`${BASE_URL}/v2/talking_photos`, headers);
        const data1 = await res1.json();
        const photos = data1.data?.talking_photos || [];
        console.log(`Found ${photos.length} photos.`);
        photos.forEach((p: any) => console.log(`ID: ${p.id}, Image: ${p.image_url?.split('?')[0]}`));

        // Method 2: List User Avatars (v2)
        console.log('\n--- Method 2: v2/avatars ---');
        const res2 = await fetch(`${BASE_URL}/v2/avatars`, headers);
        const data2 = await res2.json();
        const avatars = data2.data?.avatars || [];
        console.log(`Found ${avatars.length} avatars.`);
        avatars.filter((a: any) => a.type === 'talking_photo').forEach((a: any) => {
            console.log(`ID: ${a.avatar_id}, Name: ${a.avatar_name}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

findID();
