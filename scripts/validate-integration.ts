
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { elevenLabsService } from '../lib/services/elevenlabs-service';
import { audioStorageService } from '../lib/services/audio-storage';
import { heyGenService } from '../lib/services/heygen-service';

async function validateIntegration() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 AI BYTES - FULL INTEGRATION VALIDATION');
    console.log('='.repeat(60));

    try {
        // --- STEP 1: ElevenLabs Isabella Voice ---
        console.log('\n[1/5] 🎤 Testing ElevenLabs (Isabella Voice)...');
        const testScript = "Hello from the AI Bytes validation suite. I'm Sarah, and I'm currently testing my new Isabella voice. The quality and clarity of ElevenLabs is truly impressive. Ready for production!";
        const audioResult = await elevenLabsService.generateIntroAudio(testScript, 'course');
        console.log(`   ✅ Audio Generated: ${audioResult.duration.toFixed(2)}s`);
        console.log(`   ✅ Character Usage: ${audioResult.charactersUsed} chars`);

        // --- STEP 2: Supabase Storage ---
        console.log('\n[2/5] 📤 Testing Supabase Audio Storage...');
        const filename = `validation-test-${Date.now()}.mp3`;
        const uploadResult = await audioStorageService.uploadAudio(audioResult.audioBuffer, filename);
        console.log(`   ✅ Upload Successful!`);
        console.log(`   ✅ Public URL: ${uploadResult.publicUrl}`);

        // --- STEP 3: HeyGen Video Trigger ---
        console.log('\n[3/5] 🎬 Triggering HeyGen Video Rendering...');
        const videoResult = await heyGenService.generateVideo({
            audioUrl: uploadResult.publicUrl,
            avatarType: 'sarah',
            duration: audioResult.duration,
            title: 'Validation Test - Isabella Voice'
        });
        console.log(`   ✅ Job Created Successfully!`);
        console.log(`   ✅ Job ID: ${videoResult.jobId}`);

        // --- STEP 4: Polling for Completion ---
        console.log('\n[4/5] ⏳ Polling for Video Completion (this may take 2-5 min)...');
        let isComplete = false;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes at 5s interval

        while (!isComplete && attempts < maxAttempts) {
            attempts++;
            const statusResult = await heyGenService.checkVideoStatus(videoResult.jobId);

            if (statusResult.status === 'completed') {
                isComplete = true;
                console.log('\n[5/5] 🎉 VIDEO GENERATED SUCCESSFULLY!');
                console.log('='.repeat(60));
                console.log(`🔗 FINAL PLAYBACK URL: ${statusResult.videoUrl}`);
                console.log('='.repeat(60));
                console.log('\nValidation Complete. Isabella voice and Sarah avatar are 100% operational.');
            } else if (statusResult.status === 'failed') {
                throw new Error(`HeyGen Job Failed: ${statusResult.error || 'Unknown error'}`);
            } else {
                // Progress indicator
                process.stdout.write(`\r   Status: ${statusResult.status} (Attempt ${attempts}/${maxAttempts})... `);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        if (!isComplete) {
            console.log('\n⚠️ Polling timed out. The video is likely still rendering in HeyGen.');
            console.log(`Check manually later with: npx tsx scripts/check-test-video.ts`);
        }

    } catch (error: any) {
        console.error('\n' + '!'.repeat(60));
        console.error('❌ VALIDATION FAILED');
        console.error(`Error: ${error.message}`);
        console.error('!'.repeat(60) + '\n');
    }
}

validateIntegration();
