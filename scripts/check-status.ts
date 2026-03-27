
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { heyGenService } from '../lib/services/heygen-service';

const JOB_ID = '00471b702c394451b23f3211ff89a15a'; // Support generated video

async function checkStatus() {
    console.log(`Checking status for Job ID: ${JOB_ID}`);
    try {
        const result = await heyGenService.checkVideoStatus(JOB_ID);
        console.log('✅ Final Status Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error checking status:', error);
    }
}

checkStatus();
