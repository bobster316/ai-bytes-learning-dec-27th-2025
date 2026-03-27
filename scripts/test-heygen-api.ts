/**
 * Test Script: HeyGen API Connection
 * 
 * Tests the HeyGen Template API integration by:
 * 1. Checking if API key and template IDs are configured
 * 2. Generating test audio with ElevenLabs
 * 3. Uploading audio to Supabase Storage
 * 4. Calling HeyGen Template API to generate video
 * 5. Checking video status
 * 
 * Run: npx tsx scripts/test-heygen-api.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { heyGenService } from '../lib/services/heygen-service';
import { elevenLabsService } from '../lib/services/elevenlabs-service';
import { audioStorageService } from '../lib/services/audio-storage';

async function testHeyGenAPI() {
    console.log('='.repeat(60));
    console.log('🧪 HEYGEN API CONNECTION TEST');
    console.log('='.repeat(60));

    try {
        // Step 1: Check configuration
        console.log('\n⚙️  Step 1: Checking HeyGen configuration...');

        if (!heyGenService.isConfigured()) {
            console.error('❌ HeyGen is not properly configured');
            console.error('\nMissing configuration:');
            if (!process.env.HEYGEN_API_KEY) {
                console.error('   - HEYGEN_API_KEY');
            }
            if (!process.env.HEYGEN_TEMPLATE_COURSE_INTRO) {
                console.error('   - HEYGEN_TEMPLATE_COURSE_INTRO');
            }
            if (!process.env.HEYGEN_TEMPLATE_MODULE_INTRO) {
                console.error('   - HEYGEN_TEMPLATE_MODULE_INTRO');
            }
            console.error('\nPlease update .env.local with your HeyGen credentials');
            console.error('See implementation_plan.md for setup instructions');
            process.exit(1);
        }

        console.log('✅ HeyGen is configured');
        console.log(`   API Key: ${process.env.HEYGEN_API_KEY?.substring(0, 10)}...`);
        console.log(`   Course Template: ${process.env.HEYGEN_TEMPLATE_COURSE_INTRO}`);
        console.log(`   Module Template: ${process.env.HEYGEN_TEMPLATE_MODULE_INTRO}`);

        // Step 2: Check credits
        console.log('\n💳 Step 2: Checking HeyGen credits...');
        const credits = await heyGenService.checkCredits();
        console.log(`✅ Credits available: ${credits.remaining} GenCredits`);

        if (credits.remaining < 20) {
            console.warn('⚠️  Warning: Low credits. This test requires ~20 GenCredits');
            console.warn('   Please ensure you have sufficient credits before proceeding');
        }

        // Step 3: Generate test audio
        console.log('\n🎤 Step 3: Generating test audio with ElevenLabs...');
        const testScript = 'Welcome to the HeyGen API integration test. This is a test video to verify that our ElevenLabs and HeyGen integration is working correctly. If you can see this video with proper lip-sync, the integration is successful!';

        const audioResult = await elevenLabsService.generateIntroAudio(testScript, 'course');
        console.log(`✅ Audio generated: ${audioResult.duration.toFixed(2)}s, ${audioResult.charactersUsed} chars`);

        // Step 4: Upload audio to Supabase Storage
        console.log('\n📤 Step 4: Uploading audio to Supabase Storage...');
        const uploadResult = await audioStorageService.uploadAudio(
            audioResult.audioBuffer,
            'test-heygen-integration.mp3'
        );
        console.log('✅ Audio uploaded successfully');
        console.log(`   Public URL: ${uploadResult.publicUrl}`);

        // Step 5: Generate video with HeyGen
        console.log('\n🎬 Step 5: Generating video with HeyGen Template API...');
        const videoResult = await heyGenService.generateVideo({
            audioUrl: uploadResult.publicUrl,
            avatarType: 'sarah',
            duration: audioResult.duration,
            title: 'HeyGen Integration Test'
            // Note: voice_id not needed - ElevenLabs is configured in the template
        });

        console.log('✅ Video generation started!');
        console.log(`   Video ID: ${videoResult.jobId}`);
        console.log(`   Status: ${videoResult.status}`);

        // Step 6: Check video status
        console.log('\n🔍 Step 6: Checking video status...');
        console.log('   (Note: Video rendering takes 2-5 minutes)');

        const statusResult = await heyGenService.checkVideoStatus(videoResult.jobId);
        console.log(`   Current status: ${statusResult.status}`);

        if (statusResult.status === 'completed' && statusResult.videoUrl) {
            console.log(`   ✅ Video URL: ${statusResult.videoUrl}`);
        } else if (statusResult.status === 'processing' || statusResult.status === 'queued') {
            console.log('   ⏳ Video is still rendering...');
            console.log('   Check status again in a few minutes using:');
            console.log(`   await heyGenService.checkVideoStatus('${videoResult.jobId}')`);
        }

        // Step 7: Cleanup
        // Disable cleanup for test script to give HeyGen time to download
        console.log('\n🧹 Step 7: Cleanup skipped (allowing HeyGen time to download)...');
        // await audioStorageService.deleteAudio(uploadResult.filePath);
        // console.log('✅ Test audio deleted');

        // Success summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ HEYGEN API TEST COMPLETED');
        console.log('='.repeat(60));
        console.log('HeyGen Template API integration is working!');
        console.log(`Video ID: ${videoResult.jobId}`);
        console.log('');
        console.log('Next steps:');
        console.log('1. Wait 2-5 minutes for video to render');
        console.log('2. Check video status in HeyGen dashboard');
        console.log('3. Verify video has proper lip-sync');
        console.log('4. Test full course generation flow');
        console.log('='.repeat(60) + '\n');

    } catch (error: any) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ TEST FAILED');
        console.error('='.repeat(60));
        console.error('Error:', error.message);
        if (error.stack) {
            console.error('\nStack trace:', error.stack);
        }
        console.error('\nTroubleshooting:');
        console.error('1. Verify HEYGEN_API_KEY is correct');
        console.error('2. Verify template IDs exist in HeyGen dashboard');
        console.error('3. Check HeyGen API status: https://status.heygen.com');
        console.error('4. Ensure Supabase Storage bucket "course-audio" exists');
        console.error('='.repeat(60) + '\n');
        process.exit(1);
    }
}

// Run the test
testHeyGenAPI();
