import { config } from 'dotenv';
import { resolve } from 'path';
import { heyGenService } from '../lib/services/heygen-service';

config({ path: resolve(process.cwd(), '.env.local') });

async function checkCredits() {
    try {
        const credits = await heyGenService.checkCredits();
        console.log('\n🔍 Raw Credits Object:', JSON.stringify(credits, null, 2));
        await heyGenService.printCreditsReport();
    } catch (error) {
        console.error('Error checking credits:', error.message);
    }
}

checkCredits();
