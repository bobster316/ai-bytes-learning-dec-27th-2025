
import { config } from 'dotenv';
import { resolve } from 'path';
import { heyGenService } from '../lib/services/heygen-service';
import { audioStorageService } from '../lib/services/audio-storage';
import { elevenLabsService } from '../lib/services/elevenlabs-service';

config({ path: resolve(process.cwd(), '.env.local') });

async function testFinalFix() {
    console.log('================================================================');
    console.log('🎥 FINAL TEST: Verified Avatar + Verified Background URL');
    console.log('================================================================');

    try {
        // 1. Validated Assets
        const avatarId = '2d1ecd25e72a4831883ea15d5ce42565'; // Blue Screen Avatar

        // This is the URL we JUST proved is accessible (Step 932)
        const bgUrl = 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/backgrounds/debug-bg-1769889744888.jpg';

        console.log(`👤 Avatar ID: ${avatarId}`);
        console.log(`🖼️ Background: ${bgUrl}`);

        // 2. Generate Audio
        const text = "This is the final test. I am the cleaned avatar, and I should be standing in the server room.";
        console.log(`\n🗣️  Generating Audio...`);
        const audioBuffer = await elevenLabsService.generateSpeech(text, '0sGQQaD2G2X1s87kHM5b');
        const { publicUrl: audioUrl } = await audioStorageService.uploadAudio(audioBuffer, `final-fix-audio-${Date.now()}.mp3`);

        // 3. Generate Video
        console.log('\n🎥 Requesting Video Generation...');
        const result = await heyGenService.generateVideo({
            audioUrl: audioUrl,
            avatarType: 'sarah', // This will map to the ID in .env, which we updated to the correct one
            duration: 5,
            title: 'Final Fix - Verified Assets',
            aspectRatio: '16:9',
            background: bgUrl // Direct URL passing
        });

        console.log(`   ✅ Job ID: ${result.jobId}`);

        // 4. Monitor
        const id = result.jobId;
        for (let i = 0; i < 15; i++) {
            console.log(`\n--- Check ${i + 1} ---`);
            const status = await heyGenService.checkVideoStatus(id);
            console.log(`Job ${id}: ${status.status}`);

            if (status.status === 'completed') {
                console.log(`\n🎉 SUCCESS! Video Ready:`);
                console.log(`🔗 URL: ${status.videoUrl}`);
                break;
            }
            await new Promise(r => setTimeout(r, 10000));
        }

    } catch (error: any) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

testFinalFix();
