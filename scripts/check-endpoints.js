
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.MAGIC_HOUR_API_KEY;
if (!apiKey) {
    console.error('MAGIC_HOUR_API_KEY is not set in .env.local');
    // We'll proceed anyway with a dummy key to check for 401 vs 404
}

const baseUrl = 'https://api.magichour.ai/v1';
const endpoints = [
    '/text-to-video',
    '/lip-sync',
    '/animation',
    '/videos/generate/batch',
    '/files/upload-urls',
    '/talking-photo'
];

async function check() {
    console.log('--- Checking Magic Hour Endpoints ---');
    console.log(`API Key present: ${!!apiKey}`);

    for (const ep of endpoints) {
        try {
            const url = `${baseUrl}${ep}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey || 'dummy'}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ test: true })
            });
            console.log(`${ep}: ${res.status} ${res.statusText}`);
            if (res.status !== 404 && res.status !== 403 && res.status !== 401) {
                // If we get 400 or 200, we might want to see the body to know what's wrong/right
                const text = await res.text();
                console.log(`   Body: ${text.substring(0, 200)}...`);
            }
        } catch (e) {
            console.log(`${ep}: Error - ${e.message}`);
        }
    }
}

check();
