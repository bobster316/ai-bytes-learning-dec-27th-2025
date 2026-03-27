/**
 * Simple test to check if Supabase bucket exists
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { audioStorageService } from '../lib/services/audio-storage';

async function testBucket() {
    console.log('🪣 Checking if Supabase bucket exists...\n');

    try {
        const exists = await audioStorageService.checkBucketExists();

        if (exists) {
            console.log('✅ SUCCESS: Bucket is accessible\n');

            // Get stats
            const stats = await audioStorageService.getStorageStats();
            console.log('📊 Storage Stats:');
            console.log(`   Files: ${stats.fileCount}`);
            console.log(`   Total size: ${stats.totalSizeMB} MB\n`);

            process.exit(0);
        } else {
            console.error('❌ FAILED: Bucket does not exist or is not accessible\n');
            console.error('Please create the bucket in Supabase:');
            console.error('1. Go to https://supabase.com/dashboard');
            console.error('2. Select your project');
            console.error('3. Go to Storage');
            console.error('4. Create a PUBLIC bucket named "course-audio"\n');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

testBucket();
