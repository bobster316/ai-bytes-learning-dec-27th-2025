/**
 * Check HeyGen Video Status
 * 
 * Checks the status of a specific video and displays the video URL when ready.
 * 
 * Run: npx tsx scripts/check-video-status.ts <video_id>
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { heyGenService } from '../lib/services/heygen-service';

async function checkVideoStatus() {
    const videoId = process.argv[2] || 'af854bbabe0f47599f479f875eafb267';

    console.log('='.repeat(60));
    console.log('🔍 CHECKING HEYGEN VIDEO STATUS');
    console.log('='.repeat(60));
    console.log(`\nVideo ID: ${videoId}\n`);

    try {
        const result = await heyGenService.checkVideoStatus(videoId);

        console.log('Status:', result.status);

        if (result.status === 'completed' && result.videoUrl) {
            console.log('\n✅ VIDEO READY!');
            console.log('='.repeat(60));
            console.log(`\n🎬 Video URL:\n${result.videoUrl}\n`);
            console.log('='.repeat(60));
        } else if (result.status === 'processing' || result.status === 'queued') {
            console.log('\n⏳ Video is still rendering...');
            console.log('Please wait a few more minutes and try again.');
        } else if (result.status === 'failed') {
            console.log('\n❌ Video generation failed');
            if (result.error) {
                console.log(`Error: ${result.error}`);
            }
        }

        console.log('');

    } catch (error: any) {
        console.error('\n❌ Failed to check video status');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkVideoStatus();
