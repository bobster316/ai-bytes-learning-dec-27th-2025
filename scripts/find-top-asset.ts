import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';

async function listRecentAssets() {
    if (!API_KEY) {
        console.error('HEYGEN_API_KEY not found');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/v1/talking_photo.list`, {
            method: 'GET',
            headers: {
                'X-Api-Key': API_KEY,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        const photos = data.data.talking_photos || [];

        console.log(`Retrieved ${photos.length} talking photos.`);

        // Take the top 5 most recent if possible
        photos.slice(0, 5).forEach((p: any) => {
            console.log(`--- Photo ---`);
            console.log(`ID: ${p.id}`);
            console.log(`Image: ${p.image_url.split('?')[0]}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

listRecentAssets();
