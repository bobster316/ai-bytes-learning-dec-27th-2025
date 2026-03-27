import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { audioStorageService } from '../lib/services/audio-storage';
import { elevenLabsService } from '../lib/services/elevenlabs-service';

async function testAudioUpload() {
    console.log('============================================================');
    console.log('🧪 AUDIO UPLOAD TEST - VERBOSE');
    console.log('============================================================\n');

    try {
        // Step 1: Check bucket
        console.log('📦 Step 1: Checking bucket...');
        const bucketExists = await audioStorageService.checkBucketExists();
        if (!bucketExists) {
            throw new Error('Bucket does not exist');
        }
        console.log('✅ Bucket exists\n');

        // Step 2: Generate audio
        console.log('🎤 Step 2: Generating test audio...');
        const testScript = 'This is a test audio file for Supabase Storage integration.';
        const audioResult = await elevenLabsService.generateIntroAudio(testScript, 'course');
        console.log(`✅ Audio generated: ${audioResult.duration.toFixed(2)}s, ${audioResult.charactersUsed} chars\n`);

        // Step 3: Upload
        console.log('📤 Step 3: Uploading to Supabase...');
        const uploadResult = await audioStorageService.uploadAudio(
            audioResult.audioBuffer,
            'test-verbose.mp3'
        );
        console.log('✅ Upload successful!');
        console.log(`   URL: ${uploadResult.publicUrl}\n`);

        // Step 4: Verify URL
        console.log('🔍 Step 4: Verifying public URL...');
        console.log(`   Fetching: ${uploadResult.publicUrl}`);

        const response = await fetch(uploadResult.publicUrl);
        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            throw new Error(`URL returned status ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        console.log(`   Content-Type: ${contentType}`);
        console.log('✅ URL is accessible!\n');

        // Step 5: Cleanup
        console.log('🧹 Step 5: Cleaning up...');
        await audioStorageService.deleteAudio(uploadResult.filePath);
        console.log('✅ Test file deleted\n');

        // Success
        console.log('============================================================');
        console.log('✅ ALL TESTS PASSED');
        console.log('============================================================\n');

    } catch (error: any) {
        console.error('\n============================================================');
        console.error('❌ TEST FAILED');
        console.error('============================================================');
        console.error('Error:', error.message);
        if (error.stack) {
            console.error('\nStack:', error.stack);
        }
        console.error('============================================================\n');
        process.exit(1);
    }
}

testAudioUpload();
