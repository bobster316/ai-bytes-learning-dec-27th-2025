
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function listGroups() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const headers = { 'X-Api-Key': apiKey!, 'Accept': 'application/json' };

    try {
        const res = await fetch('https://api.heygen.com/v2/avatar_group.list', { headers });
        const data = await res.json();
        const groups = data.data?.groups || [];

        console.log(`Found ${groups.length} custom groups:`);
        for (const g of groups) {
            console.log(`- ${g.name} [ID: ${g.id}]`);
        }
    } catch (e) {
        console.error(e.message);
    }
}
listGroups();
