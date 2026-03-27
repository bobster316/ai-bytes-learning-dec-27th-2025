
import { config } from 'dotenv';
import { resolve } from 'path';
import { elevenLabsService, ELEVENLABS_VOICES } from '../lib/services/elevenlabs-service';
import { audioStorageService } from '../lib/services/audio-storage';
import { heyGenService } from '../lib/services/heygen-service';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function generateSarahWelcome() {
    const text = "welcome to the congress party of insia and the next M L A of Amargarh Jassi Khangura";
    const voiceId = ELEVENLABS_VOICES.SARAH.voice_id;

    console.log('--- CUSTOM SARAH TEST GENERATION ---');
    console.log(`Text: "${text}"`);

    try {
        // 1. Generate Audio
        console.log('\n🎤 Step 1: Generating High-Quality Audio (ElevenLabs)...');
        const audioBuffer = await elevenLabsService.generateSpeech(text, voiceId);
        console.log('✅ Audio generated successfully.');

        // 2. Upload to Storage
        console.log('\n📤 Step 2: Uploading Audio to Storage...');
        const filename = `sarah-jassi-welcome-${Date.now()}.mp3`;
        const uploadResult = await audioStorageService.uploadAudio(audioBuffer, filename);
        console.log(`✅ Audio uploaded: ${uploadResult.publicUrl}`);

        // 3. Trigger HeyGen
        console.log('\n🎬 Step 3: Triggering HeyGen Video (Scene API)...');
        const heygenResult = await heyGenService.generateVideo({
            audioUrl: uploadResult.publicUrl,
            avatarType: 'sarah',
            duration: 10, // Approximately 10 seconds for this short phrase
            title: 'Sarah Jassi Welcome',
            aspectRatio: '16:9',
            background: '#00FF00' // Green screen for flexibility
        });

        console.log('\n✨ SUCCESS! Video Generation Triggered.');
        console.log(`📊 Job ID: ${heygenResult.jobId}`);
        console.log('⏳ Please wait for processing. You can check the status using the Job ID.');

    } catch (error: any) {
        console.error('\n❌ FAILED TO GENERATE VIDEO:', error.message);
        if (error.stack) console.error(error.stack);
    }
}

generateSarahWelcome();
