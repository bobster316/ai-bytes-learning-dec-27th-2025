/**
 * Test HeyGen Template API v2
 * 
 * Verifies the new "Template API" strategy for custom avatars.
 * 1. Generates audio (ElevenLabs)
 * 2. Uploads to Supabase
 * 3. Calls HeyGen Template API with audio_url variable
 * 
 * Run: npx tsx scripts/test-template-api.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { heyGenService } from '../lib/services/heygen-service';
import { elevenLabsService } from '../lib/services/elevenlabs-service';
import { audioStorageService } from '../lib/services/audio-storage';
import { ELEVENLABS_VOICES } from '../lib/services/elevenlabs-service';

// Sarah's Template ID (from chat)
const SARAH_TEMPLATE_ID = '7bff90ddff2d4df0a08c99f95e4b1fbc';

async function testTemplateAPI() {
    console.log('='.repeat(60));
    console.log('🧪 HEYGEN TEMPLATE API TEST (Custom Avatar Strategy)');
    console.log('='.repeat(60));

    try {
        // Step 1: Generate Audio
        console.log('\n🎤 Step 1: Generating audio with Sarah\'s Voice...');
        const text = "Hi, I'm Sarah. This video proves that we can use the Template API to animate my custom avatar with any audio you want. The integration is now working perfectly.";

        // Use Sarah's voice ID
        const voiceId = ELEVENLABS_VOICES.SARAH.voice_id;
        const audioBuffer = await elevenLabsService.generateSpeech(text, voiceId);

        // Estimate duration for logging (approx 150 chars/min)
        const duration = Math.max((text.length / 150) * 60, 5);
        console.log(`✅ Audio generated (${duration.toFixed(1)}s)`);

        // Step 2: Upload to Supabase
        console.log('\n📤 Step 2: Uploading to Supabase...');
        const uploadResult = await audioStorageService.uploadAudio(
            audioBuffer,
            `template-test-${Date.now()}.mp3`
        );
        console.log(`✅ Uploaded: ${uploadResult.publicUrl}`);

        // Step 3: Generate Video
        console.log('\n🎬 Step 3: Generating Video from Template...');
        console.log(`   Template ID: ${SARAH_TEMPLATE_ID}`);

        const result = await heyGenService.generateVideoFromTemplate(
            SARAH_TEMPLATE_ID,
            uploadResult.publicUrl,
            'Sarah Template API Test'
        );

        console.log('✅ Video generation started!');
        console.log(`   Video ID: ${result.jobId}`);
        console.log(`   Status: ${result.status}`);

        if (result.status === 'failed') {
            console.error(`\n❌ Video Generation Failed Immediately:`);
            console.error(`   Error: ${result.error}`);
            await audioStorageService.deleteAudio(uploadResult.filePath);
            process.exit(1);
        }

        // Step 4: Poll for status
        console.log('\n⏳ Step 4: Waiting for completion...');
        const maxWait = 600; // 10 minutes
        const startTime = Date.now();

        while ((Date.now() - startTime) / 1000 < maxWait) {
            const status = await heyGenService.checkVideoStatus(result.jobId);

            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            process.stdout.write(`   Status: ${status.status} (${elapsed}s)\r`);

            if (status.status === 'completed') {
                console.log('\n\n✅ VIDEO GENERATION SUCCESSFUL!');
                console.log(`   URL: ${status.videoUrl}`);
                console.log(`   Duration: ${status.duration}s`);

                // Cleanup
                await audioStorageService.deleteAudio(uploadResult.filePath);

                process.exit(0);
            } else if (status.status === 'failed') {
                console.error(`\n\n❌ Video Failed: ${status.error}`);
                await audioStorageService.deleteAudio(uploadResult.filePath);
                process.exit(1);
            }

            await new Promise(r => setTimeout(r, 5000));
        }

    } catch (error: any) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('API Response:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

testTemplateAPI();
