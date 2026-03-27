
require('dotenv').config({ path: '.env.local' });
const { googleTTSClient } = require('../lib/google/tts-client');
const { magicHourClient } = require('../lib/magichour/client');

// Mocking TS exports if running in pure JS, might need adjustments if lib files are TS
// Since lib files ARE TS, we can't require them directly in Node without compilation.
// Quick fix: Write a pure JS test script that duplicates the logic for testing purposes, 
// OR run via ts-node if available. Package.json has typescript.
// Let's try to make a specific test file that imports from the source if we can run it.
// Checking package.json... "scripts": "next dev"... no ts-node explicitly listed in devDependencies?
// Actually we can use `npx tsx scripts/test-voice-flow.ts` if `tsx` is available (often is in modern stacks)
// or just `npx ts-node scripts/test-voice-flow.ts`.

// Let's write it as TS and try running with npx tsx.
import { googleTTSClient } from '../lib/google/tts-client';
import { magicHourClient } from '../lib/magichour/client';

const SARAH_ID = "api-assets/cmkhhx2bz004e4l0z4083oja5/bc25cfe7-32f7-4b94-81dd-29419e480d03-image-0.png";

async function testFlow() {
    console.log("--- Testing Voice Integration Flow ---");

    try {
        // 1. TTS
        console.log("1. Generating TTS Audio (Neural2)...");
        const text = "This is a test of the automated voice integration system. Verification complete.";
        const audioBuffer = await googleTTSClient.generateSpeech(text, 'en-US-Neural2-F');
        console.log(`   Audio generated! Size: ${audioBuffer.length} bytes`);

        // 2. Upload
        console.log("2. Uploading Audio to Magic Hour...");
        const audioId = await magicHourClient.uploadFile(audioBuffer, 'mp3');
        console.log(`   Audio uploaded! ID: ${audioId}`);

        // 3. Lip Sync
        console.log("3. Triggering Lip Sync...");
        const res = await magicHourClient.generateLipSync(SARAH_ID, audioId);
        console.log(`   Job Started! Video ID: ${res.id}`);
        console.log(`   Status: ${res.status}`);

    } catch (e) {
        console.error("❌ Test Failed:", e);
    }
}

testFlow();
