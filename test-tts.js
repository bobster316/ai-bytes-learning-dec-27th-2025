
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testTTS() {
    console.log("Testing OpenAI TTS...");
    const speechFile = path.resolve("./speech.mp3");

    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "shimmer", // Trying shimmer (female)
            input: "Hello! This is a test of the specific realistic voice system.",
        });

        console.log("Response received.");
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.promises.writeFile(speechFile, buffer);
        console.log("Speech saved to speech.mp3");
    } catch (e) {
        console.error("TTS Error:", e);
    }
}

testTTS();
