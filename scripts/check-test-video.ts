
import { heyGenService } from '../lib/services/heygen-service';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function checkStatus(jobId: string) {
    console.log(`Checking status for Job ID: ${jobId}...`);
    try {
        const status = await heyGenService.checkVideoStatus(jobId);
        console.log(JSON.stringify(status, null, 2));
    } catch (e) {
        console.error('Error checking status:', e.message);
    }
}

const jobId = '700eeaa63d034cd98a0149b82d6ec432';
checkStatus(jobId);
