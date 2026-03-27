/**
 * Test Script: ElevenLabs Audio Generation
 * 
 * Tests the ElevenLabs service integration:
 * - API connectivity
 * - Usage quota checking
 * - Audio generation
 * - Voice quality
 */

import { elevenLabsService, ELEVENLABS_VOICES } from '../lib/services/elevenlabs-service';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function testElevenLabs() {
    console.log('🧪 Testing ElevenLabs Integration\n');
    console.log('='.repeat(70));

    try {
        // Test 1: Check Usage Quota
        console.log('\n📊 Test 1: Checking Usage Quota...');
        await elevenLabsService.printUsageReport();

        // Test 2: Generate Test Audio (Sarah - Course Host)
        console.log('\n🎤 Test 2: Generating Test Audio (Sarah)...');
        const sarahScript = `Welcome to AI Bytes Learning. I'm Sarah, and I'll be your guide through this exciting journey into artificial intelligence. In this course, you'll learn cutting-edge concepts that will transform your understanding of AI.`;

        const sarahResult = await elevenLabsService.generateIntroAudio(sarahScript, 'course');

        console.log(`✅ Audio generated successfully!`);
        console.log(`   Duration: ${sarahResult.duration.toFixed(2)}s`);
        console.log(`   Characters used: ${sarahResult.charactersUsed}`);

        // Save audio file
        const outputDir = join(process.cwd(), 'test-output', 'elevenlabs');
        mkdirSync(outputDir, { recursive: true });

        const sarahPath = join(outputDir, 'sarah_test.mp3');
        writeFileSync(sarahPath, sarahResult.audioBuffer);
        console.log(`   Saved to: ${sarahPath}`);

        // Test 3: Generate Test Audio (Lana - Topic Expert)
        console.log('\n🎤 Test 3: Generating Test Audio (Lana)...');
        const lanaScript = `Module 1: Introduction to Neural Networks. In this module, we'll explore the fundamental building blocks of deep learning. You'll understand how artificial neurons work and how they combine to create powerful learning systems.`;

        const lanaResult = await elevenLabsService.generateIntroAudio(lanaScript, 'module');

        console.log(`✅ Audio generated successfully!`);
        console.log(`   Duration: ${lanaResult.duration.toFixed(2)}s`);
        console.log(`   Characters used: ${lanaResult.charactersUsed}`);

        const lanaPath = join(outputDir, 'lana_test.mp3');
        writeFileSync(lanaPath, lanaResult.audioBuffer);
        console.log(`   Saved to: ${lanaPath}`);

        // Test 4: Check Quota After Generation
        console.log('\n📊 Test 4: Checking Updated Quota...');
        const finalQuota = await elevenLabsService.checkUsageQuota();
        console.log(`   Characters used this session: ${sarahResult.charactersUsed + lanaResult.charactersUsed}`);
        console.log(`   Total characters used: ${finalQuota.character_count.toLocaleString()}`);
        console.log(`   Remaining: ${finalQuota.characters_remaining.toLocaleString()}`);

        // Test 5: Quota Sufficiency Check
        console.log('\n⚠️  Test 5: Testing Quota Warnings...');
        const quotaCheck = await elevenLabsService.checkQuotaSufficient(1000);
        console.log(`   Sufficient for 1000 chars: ${quotaCheck.sufficient ? '✅ Yes' : '❌ No'}`);
        if (quotaCheck.warning) {
            console.log(`   Warning: ${quotaCheck.warning}`);
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ All tests passed!');
        console.log('\n📁 Test audio files saved to:', outputDir);
        console.log('\n💡 Next steps:');
        console.log('   1. Listen to the generated audio files');
        console.log('   2. Verify British English accent');
        console.log('   3. Check voice quality and clarity');
        console.log('   4. Confirm character count matches expectations');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests
testElevenLabs().then(() => {
    console.log('\n✅ Test script completed successfully\n');
    process.exit(0);
}).catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
});
