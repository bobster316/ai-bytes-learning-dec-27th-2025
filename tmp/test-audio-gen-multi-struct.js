
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function runTest() {
    const geminiKey = 'AIzaSyBb22WsVeNtG_oL1U4S4Fy12dTbZL5w2PE';
    console.log("Calling Gemini TTS (Multi-Speaker Structure Test)...");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const audioModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

    try {
        console.log("Test 3: multiSpeakerVoiceConfig directly under speechConfig");
        const res = await audioModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Host A: Hello. Host B: Hi there." }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Sadaltager" } }, speakerId: "Host A" },
                            { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }, speakerId: "Host B" }
                        ]
                    }
                }
            }
        });
        console.log("✅ Test 3 Success!");
    } catch (e) {
        console.log("❌ Test 3 Failed: " + (e.message || "Unknown error"));
        if (e.response && e.response.error) {
            console.log(JSON.stringify(e.response.error.details?.[0]?.fieldViolations, null, 2));
        }
    }
}

runTest();
