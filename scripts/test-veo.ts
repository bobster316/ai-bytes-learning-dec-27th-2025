import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { veoVideoService } from '../lib/ai/veo-video-service';

async function main() {
    console.log("Testing Veo Video Service...");
    //    console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Loaded" : "Missing");
    if (!veoVideoService.isAvailable()) {
        console.error("Service is not available (missing API key).");
        return;
    }

    try {
        const result = await veoVideoService.generateVideo(
            "Close-up of intricate glowing neural pathways in a translucent blue sphere, floating in a dark void",
            "Test caption"
        );
        console.log("Result:", result);
    } catch (e: any) {
        console.error("Caught error:", e.message || e);
    }
}

main();
