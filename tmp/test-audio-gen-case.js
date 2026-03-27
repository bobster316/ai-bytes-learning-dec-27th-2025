
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function runTest() {
    const geminiKey = 'AIzaSyBb22WsVeNtG_oL1U4S4Fy12dTbZL5w2PE';
    console.log("Calling Gemini TTS (Voice Config Test)...");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const audioModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

    try {
        console.log("Test 1: speechConfig with camelCase");
        const res1 = await audioModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Hello from Puck." }] }],
            generationConfig: {
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
        console.log("✅ Test 1 Success!");
    } catch (e) {
        console.log("❌ Test 1 Failed: " + (e.message || "Unknown error"));
        if (e.response && e.response.error) console.log(JSON.stringify(e.response.error.details?.[0]?.fieldViolations, null, 2));
    }

    try {
        console.log("Test 2: speech_config with snake_case");
        const res2 = await audioModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Hello from Puck snake case." }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speech_config: {
                    voice_config: {
                        prebuilt_voice_config: {
                            voice_name: "Puck"
                        }
                    }
                }
            }
        });
        console.log("✅ Test 2 Success!");
    } catch (e) {
        console.log("❌ Test 2 Failed: " + (e.message || "Unknown error"));
        if (e.response && e.response.error) console.log(JSON.stringify(e.response.error.details?.[0]?.fieldViolations, null, 2));
    }
}

runTest();
