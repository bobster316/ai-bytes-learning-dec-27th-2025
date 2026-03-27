
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function runTest() {
    const geminiKey = 'AIzaSyBb22WsVeNtG_oL1U4S4Fy12dTbZL5w2PE';
    console.log("Calling Gemini TTS (Single Speaker)...");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const audioModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

    try {
        const audioResult = await audioModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Hello, this is a test of the Gemini TTS system. I am a single speaker." }] }],
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: "Puck"
                        }
                    }
                }
            }
        });

        const audioResponse = await audioResult.response;
        console.log("Response received!");
        const audioPart = audioResponse.candidates[0].content.parts.find((p) => p.inlineData?.mimeType?.startsWith('audio/'));
        if (audioPart) {
            console.log("✅ SUCCESS: Received audio data of length", audioPart.inlineData.data.length);
        } else {
            console.log("❌ FAILED: No audio part in response candidates[0].content.parts:");
            console.log(JSON.stringify(audioResponse.candidates[0].content.parts, null, 2));
        }
    } catch (e) {
        console.error("❌ ERROR during generation:");
        console.error(JSON.stringify(e, null, 2));
        if (e.response && e.response.error) {
            console.error("errorDetails:", JSON.stringify(e.response.error.details, null, 2));
        }
    }
}

runTest();
