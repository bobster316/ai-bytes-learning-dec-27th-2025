import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';

async function listTalkingPhotos() {
    if (!API_KEY) {
        console.error('HEYGEN_API_KEY not found');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/v2/talking_photos`, {
            method: 'GET',
            headers: {
                'X-Api-Key': API_KEY,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Talking Photos:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

listTalkingPhotos();
