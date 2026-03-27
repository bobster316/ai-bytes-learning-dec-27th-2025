/**
 * Test Script: Audio Upload to Supabase Storage
 * 
 * Tests the audio storage service by:
 * 1. Checking if the bucket exists
 * 2. Uploading a test audio file
 * 3. Verifying the public URL is accessible
 * 4. Cleaning up the test file
 * 
 * Run: npx tsx scripts/test-audio-upload.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { audioStorageService } from '../lib/services/audio-storage';
import { elevenLabsService } from '../lib/services/elevenlabs-service';

async function testAudioUpload() {
    console.log('='.repeat(60));
    console.log('🧪 AUDIO UPLOAD TEST');
    console.log('='.repeat(60));

    try {
        // Step 1: Check bucket exists
        console.log('\n📦 Step 1: Checking if storage bucket exists...');
        const bucketExists = await audioStorageService.checkBucketExists();

        if (!bucketExists) {
            console.error('❌ Bucket does not exist or is not accessible');
            console.error('   Please create the "course-audio" bucket in Supabase Dashboard');
            console.error('   Settings: Public bucket, CORS enabled');
            process.exit(1);
        }

        console.log('✅ Bucket is accessible');

        // Step 2: Generate test audio with ElevenLabs
        console.log('\n🎤 Step 2: Generating test audio with ElevenLabs...');
        const testScript = 'This is a test audio file for verifying Supabase Storage integration with HeyGen Template API.';

        const audioResult = await elevenLabsService.generateIntroAudio(testScript, 'course');
        console.log(`✅ Audio generated: ${audioResult.duration.toFixed(2)}s, ${audioResult.charactersUsed} chars`);

        // Step 3: Upload to Supabase Storage
        console.log('\n📤 Step 3: Uploading audio to Supabase Storage...');
        const uploadResult = await audioStorageService.uploadAudio(
            audioResult.audioBuffer,
            'test-audio-upload.mp3'
        );

        console.log('✅ Upload successful!');
        console.log(`   Public URL: ${uploadResult.publicUrl}`);
        console.log(`   File Path: ${uploadResult.filePath}`);

        // Step 4: Verify URL is accessible
        console.log('\n🔍 Step 4: Verifying public URL is accessible...');
        const response = await fetch(uploadResult.publicUrl);

        if (!response.ok) {
            throw new Error(`URL returned status ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');

        console.log('✅ URL is accessible!');
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Content-Length: ${contentLength} bytes`);

        // Step 5: Get storage stats
        console.log('\n📊 Step 5: Getting storage statistics...');
        const stats = await audioStorageService.getStorageStats();
        console.log(`   Files in bucket: ${stats.fileCount}`);
        console.log(`   Total size: ${stats.totalSizeMB} MB`);

        // Step 6: Cleanup test file
        console.log('\n🧹 Step 6: Cleaning up test file...');
        await audioStorageService.deleteAudio(uploadResult.filePath);
        console.log('✅ Test file deleted');

        // Success summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL TESTS PASSED');
        console.log('='.repeat(60));
        console.log('Audio storage service is working correctly!');
        console.log('Ready to integrate with HeyGen Template API.');
        console.log('='.repeat(60) + '\n');

    } catch (error: any) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ TEST FAILED');
        console.error('='.repeat(60));
        console.error('Error:', error.message);
        if (error.stack) {
            console.error('\nStack trace:', error.stack);
        }
        console.error('='.repeat(60) + '\n');
        process.exit(1);
    }
}

// Run the test
testAudioUpload();
