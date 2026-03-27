import { geminiImageService } from '../lib/ai/gemini-image-service';
import dotenv from 'dotenv';
import path from 'path';

// Force load the .env.local file from the root directory FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testGeneration() {
    console.log("Testing generation with Gemini 3.1 Flash Image Preview...");
    console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "Yes (length: " + process.env.GEMINI_API_KEY.length + ")" : "No");

    // We have to re-initialize or hack the service if it captured the env vars before dotenv loaded
    if (!geminiImageService.isAvailable() && process.env.GEMINI_API_KEY) {
        console.log("Re-initializing service with newly loaded API key...");
        // Hack: The service constructor ran before dotenv. config. 
        // We'll just create a new instance for testing.
        const { GoogleGenAI } = await import("@google/genai");
        (geminiImageService as any).client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
            const { createClient } = await import("@supabase/supabase-js");
            (geminiImageService as any).supabase = createClient(supabaseUrl, supabaseKey);
        }
    }

    try {
        const result = await geminiImageService.generateImage("A photorealistic cat wearing a tiny astronaut helmet floating in space, high quality 8k render.");

        if (result) {
            console.log("\n✅ Generation successful!");
            console.log("Image URL:", result.url);
            console.log("Alt Text:", result.alt);
        } else {
            console.log("\n❌ Generation returned null.");
        }
    } catch (e) {
        console.error("\n❌ Error during generation:", e);
    }
}

testGeneration();
