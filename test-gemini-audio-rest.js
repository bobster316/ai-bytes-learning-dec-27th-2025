
const fs = require('fs');
require("dotenv").config({ path: ".env.local" });

async function testGeminiAudioRest() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const body = {
        contents: [{
            parts: [{ text: "Hello! Please say 'This is a test' in a British accent." }]
        }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: "Aoede" // Female voice
                    }
                }
            }
        }
    };

    console.log("Sending REST request...");
    try {
        // const fetch = (await import('node-fetch')).default || global.fetch;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.candidates && data.candidates[0].content.parts[0].inlineData) {
            console.log("Audio found!");
            const audioData = data.candidates[0].content.parts[0].inlineData.data;
            const buffer = Buffer.from(audioData, 'base64');
            await fs.promises.writeFile('gemini_rest_audio.wav', buffer);
            console.log("Saved to gemini_rest_audio.wav");
        } else {
            console.log("No audio found.");
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testGeminiAudioRest();
