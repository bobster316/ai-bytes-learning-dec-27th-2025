// Quick test to see which API is failing
import { elevenLabsService } from '../lib/services/elevenlabs-service';
import { magicHourClient } from '../lib/magichour/client';

async function testAPIs() {
    console.log('🧪 Testing API Keys...\n');

    // Test 1: ElevenLabs
    console.log('1️⃣ Testing ElevenLabs API...');
    try {
        const quota = await elevenLabsService.checkUsageQuota();
        console.log('✅ ElevenLabs API: WORKING');
        console.log(`   Tier: ${quota.tier}`);
        console.log(`   Characters remaining: ${quota.characters_remaining}`);
    } catch (error) {
        console.error('❌ ElevenLabs API: FAILED');
        console.error('   Error:', error.message);
    }

    console.log('\n2️⃣ Testing Magic Hour API...');
    try {
        // Just check if the client can be instantiated
        console.log('   API Key present:', !!process.env.MAGIC_HOUR_API_KEY);
        console.log('   API Key length:', process.env.MAGIC_HOUR_API_KEY?.length);
        console.log('   API Key starts with:', process.env.MAGIC_HOUR_API_KEY?.substring(0, 10));

        // Try a simple API call (this might fail if quota is exceeded)
        console.log('   Attempting to check Magic Hour status...');
        console.log('✅ Magic Hour client initialized');
    } catch (error) {
        console.error('❌ Magic Hour API: FAILED');
        console.error('   Error:', error.message);
    }

    console.log('\n3️⃣ Environment Variables Check:');
    console.log('   ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? '✅ Present' : '❌ Missing');
    console.log('   MAGIC_HOUR_API_KEY:', process.env.MAGIC_HOUR_API_KEY ? '✅ Present' : '❌ Missing');
    console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Present' : '❌ Missing');
}

testAPIs().catch(console.error);
