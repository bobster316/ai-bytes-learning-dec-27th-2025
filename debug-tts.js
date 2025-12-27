
// Debug script
require("dotenv").config({ path: ".env.local" });

async function debugTTS() {
    console.log("Debugging TTS Configuration...");
    console.log("--------------------------------------------------");
    console.log(`ELEVENLABS_API_KEY Present: ${!!process.env.ELEVENLABS_API_KEY}`);
    if (process.env.ELEVENLABS_API_KEY) {
        console.log(`ELEVENLABS_API_KEY Length: ${process.env.ELEVENLABS_API_KEY.length}`);
    }
    console.log(`ELEVENLABS_VOICE_ID: ${process.env.ELEVENLABS_VOICE_ID}`);
    console.log(`OPENAI_API_KEY Present: ${!!process.env.OPENAI_API_KEY}`);
    console.log("--------------------------------------------------");

    console.log("Attempting generation...");
    try {
        // We need to use ttsService but it's TS source. 
        // Let's just replicate the logic here for a pure JS test to avoid compilation issues.
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = process.env.ELEVENLABS_VOICE_ID || "Xb7hH8MSUJpSbSDYk0k2";

        if (!apiKey) {
            console.error("❌ ABORT: Missing ElevenLabs API Key.");
            return;
        }

        // const fetch = (await import('node-fetch')).default || global.fetch;
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: "This is a diagnostic test of the ElevenLabs voice system.",
                model_id: "eleven_monolingual_v1",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
        });

        if (response.ok) {
            console.log("✅ Success! API returned 200 OK.");
            const buffer = await response.arrayBuffer();
            console.log(`Received Audio Bytes: ${buffer.byteLength}`);
        } else {
            console.error(`❌ API Failed: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error("Error Body:", errorText);
        }

    } catch (e) {
        console.error("❌ Exception:", e);
    }
}

debugTTS();
