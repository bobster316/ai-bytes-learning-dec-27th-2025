
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { heyGenService } from '../lib/services/heygen-service';
import { elevenLabsService } from '../lib/services/elevenlabs-service';
import { audioStorageService } from '../lib/services/audio-storage';

async function testBellaVoice() {
    console.log('='.repeat(60));
    console.log('🧪 SARAH + BELLA VOICE TEST');
    console.log('='.repeat(60));

    try {
        const text = "Hi, I'm Sarah, and I'm now speaking with the Bella voice from ElevenLabs. This is a quick test to confirm that I sound exactly how you want me to. Let's get started with your learning journey!";

        console.log('\n🎤 Generating audio with Bella voice...');
        const audioResult = await elevenLabsService.generateIntroAudio(text, 'course');
        console.log(`✅ Audio generated: ${audioResult.duration.toFixed(2)}s`);

        console.log('\n📤 Uploading to Supabase...');
        const uploadResult = await audioStorageService.uploadAudio(
            audioResult.audioBuffer,
            `bella-voice-test-${Date.now()}.mp3`
        );
        console.log(`✅ Uploaded: ${uploadResult.publicUrl}`);

        console.log('\n🎬 Generating Video with HeyGen...');
        const videoResult = await heyGenService.generateVideo({
            audioUrl: uploadResult.publicUrl,
            avatarType: 'sarah',
            duration: audioResult.duration,
            title: 'Sarah-Bella Voice Test'
        });

        console.log('\n✅ Video generation started!');
        console.log(`   Video ID: ${videoResult.jobId}`);
        console.log(`   Status: ${videoResult.status}`);
        console.log('\nRendering will take 2-5 minutes.');
        console.log(`Check status with: npx tsx scripts/check-test-video.ts (update jobId)`);

    } catch (error: any) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

testBellaVoice();
