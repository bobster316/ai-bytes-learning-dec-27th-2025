
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function runTest() {
    const geminiKey = 'AIzaSyBb22WsVeNtG_oL1U4S4Fy12dTbZL5w2PE';
    console.log("Calling Gemini TTS (Minimal)...");
    const genAI = new GoogleGenerativeAI(geminiKey);
    const audioModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

    try {
        const audioResult = await audioModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Hello, world." }] }],
            generationConfig: {
                responseModalities: ["AUDIO"]
                // No speechConfig
            }
        });

        const audioResponse = await audioResult.response;
        console.log("✅ SUCCESS!");
    } catch (e) {
        console.error("❌ ERROR:");
        console.error(JSON.stringify(e, null, 2));
    }
}

runTest();
