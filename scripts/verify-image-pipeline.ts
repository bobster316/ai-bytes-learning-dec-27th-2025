
import dotenv from 'dotenv';
import path from 'path';

// Force load env BEFORE importing service that uses it
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { imageService } from '../lib/ai/image-service';

async function verifyPipeline() {
    console.log("🚀 Starting Pipeline Verification...");

    // Test Case 1: Diagram
    console.log("\n--- TEST CASE 1: Technical Diagram ---");
    const diagramPrompt = "Neural network architecture diagram";
    const diagramResults = await imageService.fetchImages([diagramPrompt]);
    console.log("Result URL:", diagramResults[0]?.url);

    // Test Case 2: Photo (to ensure we didn't break normal photos)
    console.log("\n--- TEST CASE 2: Stock Photo ---");
    const photoPrompt = "Happy students learning code";
    const photoResults = await imageService.fetchImages([photoPrompt]);
    console.log("Result URL:", photoResults[0]?.url);
}

verifyPipeline().catch(console.error);
