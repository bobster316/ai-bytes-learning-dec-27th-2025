
import { config } from 'dotenv';
import { resolve } from 'path';
import { heyGenService } from '../lib/services/heygen-service';
import { elevenLabsService } from '../lib/services/elevenlabs-service';
import { audioStorageService } from '../lib/services/audio-storage';

config({ path: resolve(process.cwd(), '.env.local') });

async function testTransparency() {
    console.log('================================================================');
    console.log('🖼️  TEST: Avatar Transparency on Background Image');
    console.log('================================================================');

    try {
        // 1. Generate Voice
        const text = "Checking transparency. You should see the office background behind me, not a white box.";
        console.log(`\n🗣️  Generating Audio...`);
        const audioBuffer = await elevenLabsService.generateSpeech(text, '0sGQQaD2G2X1s87kHM5b');

        // 2. Upload Audio
        console.log('📤 Uploading audio...');
        const uploadResult = await audioStorageService.uploadAudio(audioBuffer, `transparency-check-${Date.now()}.mp3`);
        const audioUrl = uploadResult.publicUrl;

        // 3. Generate Video with 'office' background
        // The service logic maps 'office' to the specific PNG URL we want.
        // And it maps the new ID (from .env) to a 'talking_photo' with fit: 'cover'.
        console.log('\n🎥 Requesting Video Generation (Background: Office)...');

        const result = await heyGenService.generateVideo({
            audioUrl: audioUrl,
            avatarType: 'sarah',
            duration: 5,
            title: 'Transparency Check - Office BG',
            aspectRatio: '16:9',
            background: 'office' // This triggers the background image logic
        });

        console.log(`   ✅ Job ID: ${result.jobId}`);

        // 4. Monitor
        console.log('\n================================================================');
        console.log('🚀 MONITORING STATUS...');
        console.log('================================================================');

        const id = result.jobId;
        for (let i = 0; i < 10; i++) {
            console.log(`\n--- Check ${i + 1} ---`);
            const status = await heyGenService.checkVideoStatus(id);
            console.log(`Job ${id}: ${status.status}`);

            if (status.status === 'completed') {
                console.log(`\n🎉 SUCCESS! Video Ready:`);
                console.log(`🔗 URL: ${status.videoUrl}`);
                break;
            } else if (status.status === 'failed') {
                console.log(`\n❌ FAILED. Check dashboard.`);
                break;
            }
            await new Promise(r => setTimeout(r, 10000));
        }

    } catch (error: any) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

testTransparency();
