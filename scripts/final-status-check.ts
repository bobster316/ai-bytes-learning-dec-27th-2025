
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function check() {
    const ids = ['fffcdaf5d4734400be72cebd6d4748d9'];
    const apiKey = process.env.HEYGEN_API_KEY;

    for (const id of ids) {
        try {
            const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${id}`, {
                headers: { 'X-Api-Key': apiKey! }
            });
            const data = await res.json();
            console.log(`\nID: ${id}`);
            console.log(`Status: ${data.data?.status || 'unknown'}`);
            console.log(`URL: ${data.data?.video_url || 'not available'}`);
        } catch (e) {
            console.error(`Error checking ${id}:`, e.message);
        }
    }
}

check();
