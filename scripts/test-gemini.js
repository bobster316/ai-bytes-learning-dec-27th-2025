const { GoogleGenAI: GenAI_Old } = require("@google/generative-ai");
const { GoogleGenAI: GenAI_New } = require("@google/genai");
require('dotenv').config({ path: '.env.local' });

async function testGemini() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.log("Checking API Key...");
    if (!apiKey) {
        console.error("❌ NEXT_PUBLIC_GEMINI_API_KEY is missing in .env.local");
        return;
    }
    console.log("✅ API Key found (starts with: " + apiKey.substring(0, 8) + "...)");

    console.log("1. Testing Standard API (Text Generation)...");
    try {
        const clientOld = new GenAI_Old(apiKey);
        const model = clientOld.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent("Hello.");
        console.log("✅ Text Generation Success:", result.response.text().substring(0, 50) + "...");
    } catch (e) {
        console.error("❌ Standard API Failed:", e.message);
    }

    console.log("2. Testing Live API Client Initialization...");
    try {
        const clientNew = new GenAI_New({ apiKey });
        // Just check if we can access the live property
        if (clientNew.live) {
            console.log("✅ Live Client Initialized Successfully.");
        } else {
            console.error("❌ Live Client property missing.");
        }
    } catch (e) {
        console.error("❌ Live Client Verification Failed:", e.message);
    }
}

testGemini();
