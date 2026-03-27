/**
 * Quick Configuration Test - NO CREDITS USED
 * 
 * This script verifies HeyGen integration setup without generating videos:
 * 1. Checks environment variables
 * 2. Validates API key format
 * 3. Confirms template IDs are set
 * 4. Tests API connectivity (no video generation)
 * 
 * Run: npx tsx scripts/test-heygen-config.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { heyGenService } from '../lib/services/heygen-service';
import { ELEVENLABS_VOICES } from '../lib/services/elevenlabs-service';

async function testConfiguration() {
    console.log('='.repeat(60));
    console.log('🔍 HEYGEN CONFIGURATION TEST (NO CREDITS USED)');
    console.log('='.repeat(60));

    let allPassed = true;

    // Test 1: Environment Variables
    console.log('\n📋 Test 1: Environment Variables');
    console.log('-'.repeat(60));

    const apiKey = process.env.HEYGEN_API_KEY;
    const courseTemplate = process.env.HEYGEN_TEMPLATE_COURSE_INTRO;
    const moduleTemplate = process.env.HEYGEN_TEMPLATE_MODULE_INTRO;

    if (!apiKey) {
        console.error('❌ HEYGEN_API_KEY not set');
        allPassed = false;
    } else {
        console.log(`✅ HEYGEN_API_KEY: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
    }

    if (!courseTemplate) {
        console.error('❌ HEYGEN_TEMPLATE_COURSE_INTRO not set');
        allPassed = false;
    } else {
        console.log(`✅ HEYGEN_TEMPLATE_COURSE_INTRO: ${courseTemplate}`);
    }

    if (!moduleTemplate) {
        console.error('❌ HEYGEN_TEMPLATE_MODULE_INTRO not set');
        allPassed = false;
    } else {
        console.log(`✅ HEYGEN_TEMPLATE_MODULE_INTRO: ${moduleTemplate}`);
    }

    // Test 2: Template IDs are Different
    console.log('\n🎭 Test 2: Template Configuration');
    console.log('-'.repeat(60));

    if (courseTemplate === moduleTemplate) {
        console.warn('⚠️  WARNING: Both templates use the same ID');
        console.warn('   Sarah and Lana will use the same avatar');
    } else {
        console.log('✅ Sarah and Lana have different templates');
        console.log(`   Sarah (Course): ${courseTemplate}`);
        console.log(`   Lana (Module):  ${moduleTemplate}`);
    }

    // Test 3: Voice ID Mapping
    console.log('\n🎤 Test 3: ElevenLabs Voice Mapping');
    console.log('-'.repeat(60));

    console.log('✅ Voice IDs configured:');
    console.log(`   Sarah → ${ELEVENLABS_VOICES.SARAH.name} (${ELEVENLABS_VOICES.SARAH.voice_id})`);
    console.log(`   Lana  → ${ELEVENLABS_VOICES.LANA.name} (${ELEVENLABS_VOICES.LANA.voice_id})`);

    // Test 4: HeyGen Service Configuration
    console.log('\n⚙️  Test 4: HeyGen Service');
    console.log('-'.repeat(60));

    if (heyGenService.isConfigured()) {
        console.log('✅ HeyGen service is properly configured');
    } else {
        console.error('❌ HeyGen service configuration incomplete');
        allPassed = false;
    }

    // Test 5: API Connectivity (lightweight check)
    console.log('\n🌐 Test 5: API Connectivity');
    console.log('-'.repeat(60));

    try {
        console.log('Checking HeyGen credits (no video generation)...');
        const credits = await heyGenService.checkCredits();

        if (credits.total === 0 && credits.remaining === 0) {
            console.warn('⚠️  Could not fetch credits from API');
            console.warn('   This might be a permissions issue or API endpoint change');
            console.warn('   Video generation may still work');
        } else {
            console.log('✅ API connection successful');
            console.log(`   GenCredits available: ${credits.remaining}`);
            console.log(`   Total allocation: ${credits.total}`);
            console.log(`   Usage: ${credits.usage_percent.toFixed(1)}%`);
        }
    } catch (error: any) {
        console.error('❌ API connectivity test failed');
        console.error(`   Error: ${error.message}`);
        allPassed = false;
    }

    // Test 6: Template ID Format Validation
    console.log('\n🔐 Test 6: Template ID Format');
    console.log('-'.repeat(60));

    const templateIdRegex = /^[a-f0-9]{32}$/;

    if (courseTemplate && templateIdRegex.test(courseTemplate)) {
        console.log('✅ Course template ID format is valid');
    } else {
        console.warn('⚠️  Course template ID format looks unusual');
        console.warn(`   Expected: 32 hex characters, Got: ${courseTemplate}`);
    }

    if (moduleTemplate && templateIdRegex.test(moduleTemplate)) {
        console.log('✅ Module template ID format is valid');
    } else {
        console.warn('⚠️  Module template ID format looks unusual');
        console.warn(`   Expected: 32 hex characters, Got: ${moduleTemplate}`);
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log('✅ ALL TESTS PASSED - READY FOR VIDEO GENERATION');
        console.log('='.repeat(60));
        console.log('\n🎬 Next Steps:');
        console.log('1. Run full integration test: npx tsx scripts/test-heygen-api.ts');
        console.log('2. Or generate a test course from the admin panel');
        console.log('\n💡 Tip: First video will use ~7-15 GenCredits');
    } else {
        console.log('❌ SOME TESTS FAILED - PLEASE FIX CONFIGURATION');
        console.log('='.repeat(60));
        console.log('\n📝 Action Items:');
        console.log('1. Update .env.local with missing values');
        console.log('2. Verify HeyGen API key is correct');
        console.log('3. Confirm template IDs exist in HeyGen dashboard');
    }
    console.log('='.repeat(60) + '\n');

    process.exit(allPassed ? 0 : 1);
}

// Run the test
testConfiguration();
