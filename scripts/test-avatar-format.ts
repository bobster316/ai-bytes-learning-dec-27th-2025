
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { heyGenService } from '../lib/services/heygen-service';
import { elevenLabsService } from '../lib/services/elevenlabs-service';
import { audioStorageService } from '../lib/services/audio-storage';

async function testAvatarFormat() {
    console.log('================================================================');
    console.log('🧪 TEST: AI AVATAR FORMAT & INTEGRATION (Isabella/Sarah)');
    console.log('================================================================');

    try {
        console.log('🎤 Generating fresh audio...');
        // Use a simple test phrase
        const text = "Hi, I am Sarah. This is a test of the transparent background format with the logo overlay.";
        // Sarah's voice ID
        const voiceId = '0sGQQaD2G2X1s87kHM5b';
        const audioBuffer = await elevenLabsService.generateSpeech(text, voiceId);

        console.log('📤 Uploading audio...');
        const uploadResult = await audioStorageService.uploadAudio(
            audioBuffer,
            `format-test-${Date.now()}.mp3`
        );
        const testAudio = uploadResult.publicUrl;
        console.log(`\n🎧 Using Fresh Audio: ${testAudio}`);

        // Test Case: 16:9 Transparent (Green Screen) - Only testing the target case now
        console.log('\n[1] Testing 16:9 Transparent/Green Screen');
        const resultTransparent = await heyGenService.generateVideo({
            audioUrl: testAudio,
            avatarType: 'sarah',
            duration: 10, // Approximate
            title: 'Format Test 16:9 (Transparent Fresh)',
            aspectRatio: '16:9',
            background: 'transparent'
        });
        console.log(`    ✅ Job ID: ${resultTransparent.jobId}`);

        console.log('\n================================================================');
        console.log('🚀 MONITORING STATUS...');
        console.log('================================================================');

        const id = resultTransparent.jobId;

        // Simple poll loop
        for (let i = 0; i < 5; i++) {
            console.log(`\n--- Check ${i + 1} ---`);
            const status = await heyGenService.checkVideoStatus(id);
            console.log(`Job ${id}: ${status.status} ${status.videoUrl ? `\n   🔗 URL: ${status.videoUrl}` : ''}`);

            if (status.status === 'completed' || status.status === 'failed') break;

            await new Promise(r => setTimeout(r, 10000));
        }

    } catch (error: any) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

testAvatarFormat();
