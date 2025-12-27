
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { voiceService } from "./lib/ai/voice-ai-service";

async function test() {
    console.log("Testing Voice Logic...");
    console.log("Gemini Key Present:", !!process.env.GEMINI_API_KEY);

    try {
        const response = await voiceService.processMessage("What is machine learning?", { courseId: 353 });
        console.log("Result:", response);
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
