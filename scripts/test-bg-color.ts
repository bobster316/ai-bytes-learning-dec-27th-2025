
import { config } from 'dotenv';
import { resolve } from 'path';
import { heyGenService } from '../lib/services/heygen-service';
import { audioStorageService } from '../lib/services/audio-storage';
import { elevenLabsService } from '../lib/services/elevenlabs-service';

config({ path: resolve(process.cwd(), '.env.local') });

async function testColorBg() {
    console.log('================================================================');
    console.log('🔴 TEST: Solid Red Background');
    console.log('================================================================');

    try {
        const text = "Checking if the background turns red.";
        const audioBuffer = await elevenLabsService.generateSpeech(text, '0sGQQaD2G2X1s87kHM5b');
        const { publicUrl: audioUrl } = await audioStorageService.uploadAudio(audioBuffer, `test-red-${Date.now()}.mp3`);

        const result = await heyGenService.generateVideo({
            audioUrl: audioUrl,
            avatarType: 'sarah',
            duration: 5,
            title: 'Test Color BG - Red',
            aspectRatio: '16:9',
            background: '#FF0000'
        });

        console.log(`   ✅ Job ID: ${result.jobId}`);

    } catch (error: any) {
        console.error(error);
    }
}

testColorBg();
