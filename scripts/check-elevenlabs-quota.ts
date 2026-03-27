/**
 * Simple ElevenLabs Quota Check
 * Quick test to verify API connectivity and check usage
 */

import 'dotenv/config';

async function checkElevenLabsQuota() {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
        console.error('❌ ELEVENLABS_API_KEY not found in environment');
        process.exit(1);
    }

    console.log('✅ API Key found');
    console.log('🔍 Checking ElevenLabs quota...\n');

    try {
        const response = await fetch('https://api.elevenlabs.io/v1/user', {
            method: 'GET',
            headers: {
                'xi-api-key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const subscription = data.subscription || {};

        const character_count = subscription.character_count || 0;
        const character_limit = subscription.character_limit || 0;
        const characters_remaining = character_limit - character_count;
        const usage_percent = character_limit > 0 ? (character_count / character_limit) * 100 : 0;

        console.log('='.repeat(60));
        console.log('📊 ELEVENLABS USAGE REPORT');
        console.log('='.repeat(60));
        console.log(`\n📋 Subscription: ${subscription.tier || 'Unknown'}`);
        console.log(`   Character limit: ${character_limit.toLocaleString()}`);
        console.log(`   Characters used: ${character_count.toLocaleString()}`);
        console.log(`   Characters remaining: ${characters_remaining.toLocaleString()}`);
        console.log(`   Usage: ${usage_percent.toFixed(1)}%`);

        const barLength = 40;
        const filled = Math.round((usage_percent / 100) * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
        console.log(`   [${bar}] ${usage_percent.toFixed(1)}%`);

        const videos_remaining = Math.floor(characters_remaining / 150);
        console.log(`\n🎬 Estimated videos remaining: ~${videos_remaining}`);

        if (subscription.next_character_count_reset_unix) {
            const resetDate = new Date(subscription.next_character_count_reset_unix * 1000);
            console.log(`🔄 Quota resets: ${resetDate.toLocaleString()}`);
        }

        console.log('='.repeat(60));
        console.log('\n✅ ElevenLabs API is working correctly!\n');

    } catch (error) {
        console.error('\n❌ Error checking quota:', error);
        process.exit(1);
    }
}

checkElevenLabsQuota();
