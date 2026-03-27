import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function checkRawCredits() {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
        console.error('HEYGEN_API_KEY not found');
        return;
    }

    console.log('Fetching from HeyGen /v2/user/remaining_quota...');
    try {
        const response = await fetch('https://api.heygen.com/v2/user/remaining_quota', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey
            }
        });

        console.log(`HTTP Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('='.repeat(50));
        console.log('RAW API RESPONSE:');
        console.log(text);
        console.log('='.repeat(50));
    } catch (error) {
        console.error('Fetch error:', error.message);
    }
}

checkRawCredits();
