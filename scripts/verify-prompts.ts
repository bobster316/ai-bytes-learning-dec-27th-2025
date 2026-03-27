
import { ConceptExplainerAgent } from '../lib/ai/agent-system';
import { geminiImageService } from '../lib/ai/gemini-image-service';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Mock dependencies if needed, or just let them run if they don't hit DB.
// agent-system.ts imports types.

async function verify() {
    console.log("🔍 Verifying Prompt Fixes...");

    // 1. Verify Image Service Context Injection
    console.log("\n--- TRACE 1: Image Service Prompt Injection ---");
    // We can't easily spy on private methods, but we can check the public generateImage behavior 
    // OR just use the class if we export the method or test via access.
    // Actually, typescript private is soft. we can cast to any.
    const service = geminiImageService as any;
    const testPrompt = "PHOTOREALISTIC: A happy family using a computer.";

    // We will just invoke the buildEducationalPrompt method directly if we can, 
    // or just spy on console.log if that's where we see it. 
    // Better: modify the file to export it? No.
    // Let's just trust our code review for the *injection*, but we can test the OUTPUT of the prompt if we could see it.
    // Wait, I can just call `buildEducationalPrompt` by casting to any.

    if (service.buildEducationalPrompt) {
        const injected = service.buildEducationalPrompt(testPrompt);
        console.log("Original:", testPrompt);
        console.log("Injected:", injected);

        if (injected.includes("Context: Advanced Artificial Intelligence") && injected.includes("NEGATIVE PROMPT: Smiling people")) {
            console.log("✅ Image Service Fix: CONFIRMED");
        } else {
            console.error("❌ Image Service Fix: FAILED");
        }
    } else {
        console.log("⚠️ Could not access buildEducationalPrompt (likely private/compiled). Skipping direct unit test.");
    }

    // 2. Verify Agent Ban on 'Demystifying'
    console.log("\n--- TRACE 2: Concept Agent Output Verification ---");
    const agent = new ConceptExplainerAgent();
    // We want to force it to TRY to say Demystifying. 
    // It's hard to force LLM to say specific word, but we can check the SYSTEM PROMPT contains the ban.
    // Accessing protected/private `makeRequest` or similar? 
    // Actually, since I modified the source code, I know the prompt is there.
    // The real test is if it works. 
    // Let's run a generation for "Demystifying AI" as a topic title and see if it cleans it up.

    const mockLesson = {
        lessonTitle: "Demystifying AI Magic", // Baiting the AI
        lessonOrder: 1,
        learningObjectives: ["Understand AI"],
        estimatedDifficulty: 1,
        estimatedDuration: 15
    };

    console.log("Generating content for lesson: 'Demystifying AI Magic' (Baiting the AI)...");
    try {
        // This costs API tokens, but it's worth it for verification.
        const result = await agent.generate(mockLesson as any, "Intro Module", {} as any);
        const text = JSON.stringify(result);

        if (text.toLowerCase().includes("demystify")) {
            console.error("❌ FAILED: Found 'demystify' in output!");
            console.log("Snippet:", text.substring(0, 200));
        } else {
            console.log("✅ SUCCESS: 'Demystify' NOT found in output.");
        }
    } catch (e) {
        console.error("Modification Error (Generation failed):", e);
    }
}

verify();
