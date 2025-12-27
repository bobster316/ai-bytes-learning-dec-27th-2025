
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require("dotenv").config({ path: ".env.local" });

async function testGeminiAudio() {
    console.log("Testing Gemini Audio Generation...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    // trying gemini-2.0-flash-exp which definitely has audio support. 
    // 'gemini-2.0-flash' (non-exp) might also work.

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Hello! Please say 'This is a test of the Gemini audio capabilities' in a British accent." }] }],
            generationConfig: {
                // @ts-ignore
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: "Fenrir" // "Aoede" is female, "Charon" male, "Fenrir" male, "Kore" female, "Puck" male. 
                            // Let's try "Aoede" or "Kore" for female. 
                        }
                    }
                }
            }
        });

        console.log("Response received.");
        const response = result.response;
        // console.log(JSON.stringify(response, null, 2));

        // Handling audio data
        // The structure might be in candidates[0].content.parts[0].inlineData
        const candidate = response.candidates[0];
        const part = candidate.content.parts[0];

        if (part.inlineData && part.inlineData.mimeType.startsWith('audio')) {
            console.log("Audio found!");
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            await fs.promises.writeFile('gemini_audio.wav', buffer);
            console.log("Saved to gemini_audio.wav");
        } else {
            console.log("No audio data found in response.");
            console.log(JSON.stringify(part, null, 2));
        }

    } catch (e) {
        console.error("Gemini Audio Error:", e);
    }
}

testGeminiAudio();
