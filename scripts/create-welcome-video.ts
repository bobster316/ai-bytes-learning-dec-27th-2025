
import { config } from 'dotenv';
import { resolve } from 'path';
import { heyGenService } from '../lib/services/heygen-service';
import { elevenLabsService } from '../lib/services/elevenlabs-service';
import { audioStorageService } from '../lib/services/audio-storage';

config({ path: resolve(process.cwd(), '.env.local') });

async function createWelcomeVideo() {
    console.log('================================================================');
    console.log('🎬 CREATING CUSTOM WELCOME VIDEO (Sarah v2)');
    console.log('================================================================');

    try {
        // 1. Generate Audio
        const text = "Welcome to AI Bytes Learning created by Rav";
        console.log(`\n🗣️  Generating Audio: "${text}"`);

        // Sarah's voice ID
        const voiceId = '0sGQQaD2G2X1s87kHM5b';
        const audioBuffer = await elevenLabsService.generateSpeech(text, voiceId);

        // 2. Upload Audio
        console.log('📤 Uploading audio to Supabase...');
        const filename = `welcome-rav-${Date.now()}.mp3`;
        const uploadResult = await audioStorageService.uploadAudio(audioBuffer, filename);
        const audioUrl = uploadResult.publicUrl;
        console.log(`   🔗 Audio URL: ${audioUrl}`);

        // 3. Generate Video
        console.log('\n🎥 Requesting Video Generation (16:9 Transparent)...');
        const result = await heyGenService.generateVideo({
            audioUrl: audioUrl,
            avatarType: 'sarah', // uses the new ID from .env.local
            duration: 5, // precise duration doesn't matter much for talking photo, it adapts to audio
            title: 'Welcome Rav - Sarah v2',
            aspectRatio: '16:9',
            background: 'transparent'
        });

        console.log(`   ✅ Job ID: ${result.jobId}`);

        console.log('\n================================================================');
        console.log('🚀 MONITORING STATUS...');
        console.log('================================================================');

        const id = result.jobId;

        // Poll loop
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
        console.error('\n❌ GENERATION FAILED:', error.message);
    }
}

createWelcomeVideo();
