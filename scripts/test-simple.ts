import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function simpleTest() {
    try {
        console.log('Loading services...');

        const { audioStorageService } = await import('../lib/services/audio-storage');
        console.log('✅ Audio storage service loaded');

        const { elevenLabsService } = await import('../lib/services/elevenlabs-service');
        console.log('✅ ElevenLabs service loaded');

        console.log('\nChecking bucket...');
        const bucketExists = await audioStorageService.checkBucketExists();
        console.log('Bucket exists:', bucketExists);

        if (!bucketExists) {
            console.error('❌ Bucket does not exist');
            process.exit(1);
        }

        console.log('\n✅ All checks passed!');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

simpleTest();
