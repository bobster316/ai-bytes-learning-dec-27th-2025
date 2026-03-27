
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testGroupId(id: string) {
    const apiKey = process.env.HEYGEN_API_KEY;
    const headers = { 'X-Api-Key': apiKey!, 'Accept': 'application/json' };

    try {
        console.log(`Testing group ID: ${id}`);
        const res = await fetch(`https://api.heygen.com/v2/avatars?avatar_group_id=${id}`, { headers });
        const text = await response.text();
        console.log('Status:', res.status);
        console.log(text.substring(0, 1000));
    } catch (e) {
        console.error(e.message);
    }
}
testGroupId('Adriana');
