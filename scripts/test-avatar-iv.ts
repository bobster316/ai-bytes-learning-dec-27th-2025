/**
 * Test Avatar IV (Instant Avatar) Integration with Sarah's Photo
 * 
 * This test:
 * 1. Uploads Sarah's photo to HeyGen
 * 2. Generates a test video using Avatar IV API
 * 3. Polls for completion
 * 4. Returns the video URL
 * 
 * Run: npx tsx scripts/test-avatar-iv.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { heyGenService } from '../lib/services/heygen-service';
import { ELEVENLABS_VOICES } from '../lib/services/elevenlabs-service';

async function testAvatarIV() {
    console.log('='.repeat(60));
    console.log('🧪 AVATAR IV (INSTANT AVATAR) TEST');
    console.log('='.repeat(60));
    console.log('');

    try {
        // Configuration
        const sarahPhotoPath = resolve(process.cwd(), 'public/ai_avatar/sarah.png');
        const testScript = `
            Welcome to AI Bytes Learning! I'm Sarah, your course host. 
            This video was generated using HeyGen's Avatar IV technology, 
            which creates a realistic talking avatar from just a single photo. 
            The integration is now working perfectly with custom instant avatars!
        `.trim();

        // Use Rachel voice (Sarah's voice from ElevenLabs)
        const voiceId = ELEVENLABS_VOICES.SARAH.voice_id;

        console.log('📋 Test Configuration:');
        console.log(`   Photo: ${sarahPhotoPath}`);
        console.log(`   Voice: ${ELEVENLABS_VOICES.SARAH.name} (${voiceId})`);
        console.log(`   Script length: ${testScript.length} characters`);
        console.log('');

        // Step 1: Generate video using Avatar IV
        console.log('🎬 Step 1: Generating Avatar IV video...');
        const result = await heyGenService.generateVideoFromPhoto(
            sarahPhotoPath,
            testScript,
            voiceId,
            {
                title: 'Sarah Avatar IV Test - AI Bytes Learning',
                customMotionPrompt: 'Professional and friendly course instructor presenting with natural gestures',
                enhanceMotionPrompt: true
            }
        );

        if (result.status === 'failed') {
            console.error('❌ Video generation failed:', result.error);
            process.exit(1);
        }

        console.log('✅ Video generation started!');
        console.log(`   Video ID: ${result.jobId}`);
        console.log('');

        // Step 2: Poll for completion
        console.log('⏳ Step 2: Waiting for video to complete...');
        console.log('   This may take 2-5 minutes for Avatar IV videos...');
        console.log('');

        const maxWait = 600; // 10 minutes
        const pollInterval = 10; // 10 seconds
        const startTime = Date.now();

        while ((Date.now() - startTime) / 1000 < maxWait) {
            const status = await heyGenService.getVideoStatus(result.jobId);

            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            process.stdout.write(`   Status: ${status.status} (${elapsed}s elapsed)\r`);

            if (status.status === 'completed') {
                console.log('');
                console.log('');
                console.log('='.repeat(60));
                console.log('✅ AVATAR IV TEST SUCCESSFUL!');
                console.log('='.repeat(60));
                console.log('');
                console.log('📹 Video Details:');
                console.log(`   Video ID: ${result.jobId}`);
                console.log(`   Video URL: ${status.videoUrl}`);
                console.log(`   Duration: ${status.duration}s`);
                console.log('');
                console.log('🎉 Sarah\'s custom instant avatar is now working!');
                console.log('');
                console.log('Next steps:');
                console.log('1. View the video at the URL above');
                console.log('2. Update course generation to use Avatar IV for Sarah');
                console.log('3. Test full course generation workflow');
                console.log('');
                console.log('='.repeat(60));
                process.exit(0);
            } else if (status.status === 'failed') {
                console.log('');
                console.log('');
                console.error('❌ Video generation failed:', status.error);
                process.exit(1);
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
        }

        console.log('');
        console.error('❌ Timeout: Video generation took too long');
        process.exit(1);

    } catch (error: any) {
        console.error('');
        console.error('❌ TEST FAILED');
        console.error('Error:', error.message);
        if (error.stack) {
            console.error('');
            console.error('Stack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

testAvatarIV();
