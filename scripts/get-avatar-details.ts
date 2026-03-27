
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function getAvatarDetails(id: string) {
    const apiKey = process.env.HEYGEN_API_KEY;
    const headers = { 'X-Api-Key': apiKey!, 'Accept': 'application/json' };

    try {
        console.log(`Fetching details for avatar: ${id}`);
        const res = await fetch(`https://api.heygen.com/v2/avatars/${id}`, { headers });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e.message);
    }
}
getAvatarDetails('Adriana_Business_Front_public');
