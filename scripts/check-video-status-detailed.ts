/**
 * Check HeyGen Video Status with Detailed Error Info
 * 
 * Run: npx tsx scripts/check-video-status-detailed.ts <video_id>
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function checkVideoStatusDetailed() {
    const videoId = process.argv[2] || 'af854bbabe0f47599f479f875eafb267';
    const apiKey = process.env.HEYGEN_API_KEY;

    console.log('Checking video:', videoId);

    try {
        const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey!
            }
        });

        const data = await response.json();
        console.log('\nFull Response:');
        console.log(JSON.stringify(data, null, 2));

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

checkVideoStatusDetailed();
