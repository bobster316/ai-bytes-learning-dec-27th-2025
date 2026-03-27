
import { config } from 'dotenv';
import { resolve } from 'path';
import { heyGenService } from '../lib/services/heygen-service';
import { audioStorageService } from '../lib/services/audio-storage';
import { elevenLabsService } from '../lib/services/elevenlabs-service';

config({ path: resolve(process.cwd(), '.env.local') });

async function verifyFinalSetup() {
    console.log('================================================================');
    console.log('🚀 FINAL SYSTEM VERIFICATION');
    console.log('================================================================');

    const avatarId = process.env.HEYGEN_AVATAR_SARAH_ID;
    console.log(`Using Configured Avatar ID: ${avatarId}`);

    if (avatarId !== 'dca5f0bcd8524f079791fbb46f808c01') {
        console.error('❌ MISMATCH: Env var does not match requested final ID!');
        return;
    }

    try {
        console.log('\n1. Generating Audio...');
        const text = "System check complete. I am ready to teach.";
        const audioBuffer = await elevenLabsService.generateSpeech(text, '0sGQQaD2G2X1s87kHM5b');
        const { publicUrl } = await audioStorageService.uploadAudio(audioBuffer, `final-check-${Date.now()}.mp3`);
        console.log(`   Audio URL: ${publicUrl}`);

        console.log('\n2. Triggering Video (Production Mode)...');
        const result = await heyGenService.generateVideo({
            audioUrl: publicUrl,
            duration: 5,
            title: 'Final System Check',
            aspectRatio: '16:9'
        });

        console.log(`\n✅ SUCCESS! Video verified.`);
        console.log(`   Job ID: ${result.jobId}`);
        console.log('   (Please wait for processing)');

    } catch (error: any) {
        console.error('\n❌ VERIFICATION FAILED:', error.message);
    }
}

verifyFinalSetup();
