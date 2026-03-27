import { config } from 'dotenv';
import { resolve } from 'path';
import { heyGenService } from '../lib/services/heygen-service';
import { elevenLabsService } from '../lib/services/elevenlabs-service';
import { audioStorageService } from '../lib/services/audio-storage';

config({ path: resolve(process.cwd(), '.env.local') });

async function generateTestVideo() {
    const script = "I am fed up with all these tests";
    console.log(`🎤 Generating audio for: "${script}"`);

    try {
        const audioResult = await elevenLabsService.generateIntroAudio(script, 'course');
        console.log('✅ Audio generated');

        // Pre-flight credit check
        await heyGenService.preFlightCheck(audioResult.duration);

        const uploadResult = await audioStorageService.uploadAudio(
            audioResult.audioBuffer,
            'fed-up-test.mp3'
        );
        console.log(`✅ Audio uploaded: ${uploadResult.publicUrl}`);

        const videoResult = await heyGenService.generateVideo({
            audioUrl: uploadResult.publicUrl,
            avatarType: 'sarah',
            duration: audioResult.duration,
            title: 'Fed Up Test Video'
        });

        console.log('\n✅ Video generation started!');
        console.log(`🎬 Video ID: ${videoResult.jobId}`);
        console.log(`Status: ${videoResult.status}`);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

generateTestVideo();
