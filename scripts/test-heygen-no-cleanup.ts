/**
 * Test HeyGen API - No Cleanup Version
 * 
 * Same as test-heygen-api.ts but keeps the audio file so HeyGen can download it.
 * 
 * Run: npx tsx scripts/test-heygen-no-cleanup.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { heyGenService } from '../lib/services/heygen-service';
import { elevenLabsService } from '../lib/services/elevenlabs-service';
import { audioStorageService } from '../lib/services/audio-storage';

async function testHeyGenAPI() {
    console.log('='.repeat(60));
    console.log('🧪 HEYGEN API TEST (NO CLEANUP)');
    console.log('='.repeat(60));

    try {
        console.log('\n⚙️  Step 1: Checking HeyGen configuration...');
        if (!heyGenService.isConfigured()) {
            console.error('❌ HeyGen is not properly configured');
            process.exit(1);
        }
        console.log('✅ HeyGen is configured');

        console.log('\n🎤 Step 2: Generating test audio with ElevenLabs...');
        const testScript = 'Welcome to AI Bytes Learning! This is a test video to verify that our HeyGen integration is working correctly with proper lip-sync. If you can see this video, the integration is successful!';

        const audioResult = await elevenLabsService.generateIntroAudio(testScript, 'course');
        console.log(`✅ Audio generated: ${audioResult.duration.toFixed(2)}s`);

        console.log('\n📤 Step 3: Uploading audio to Supabase Storage...');
        const uploadResult = await audioStorageService.uploadAudio(
            audioResult.audioBuffer,
            'heygen-test-video.mp3'
        );
        console.log('✅ Audio uploaded successfully');
        console.log(`   Public URL: ${uploadResult.publicUrl}`);

        console.log('\n🎬 Step 4: Generating video with HeyGen...');
        const videoResult = await heyGenService.generateVideo({
            audioUrl: uploadResult.publicUrl,
            avatarType: 'sarah',
            duration: audioResult.duration,
            title: 'HeyGen Integration Test - Sarah Avatar'
        });

        console.log('✅ Video generation started!');
        console.log(`   Video ID: ${videoResult.jobId}`);
        console.log(`   Status: ${videoResult.status}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ TEST COMPLETED');
        console.log('='.repeat(60));
        console.log(`\nVideo ID: ${videoResult.jobId}`);
        console.log('Audio file preserved at:', uploadResult.publicUrl);
        console.log('\nNext steps:');
        console.log('1. Wait 2-5 minutes for video to render');
        console.log('2. Check status: npx tsx scripts/check-video-status.ts ' + videoResult.jobId);
        console.log('3. Video will be available at HeyGen dashboard');
        console.log('='.repeat(60) + '\n');

    } catch (error: any) {
        console.error('\n❌ TEST FAILED');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testHeyGenAPI();
