
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { geminiImageService } from './lib/ai/gemini-image-service';

async function testPhase2Prompts() {
    console.log('🧪 Starting VISUAL TEST BENCH (Phase 2: Enterprise Technical Theme)');
    
    // Case Study 1: The "Teacher/Student" Failure
    const prompt1 = "Fundamentals of AI System Testing Hero: Professional and educational visualization of technical testing concepts.";
    
    // Case Study 2: The "Pointless Data" Failure
    const prompt2 = "The Importance of Data: A detailed technical representation of high-volume data streams and quality analysis.";
    
    // Case Study 3: The "Generic Laptop" Failure
    const prompt3 = "Testing in Practice: Modern software dashboard displaying real-time AI performance monitoring and technical metrics.";

    const testCases = [
        { name: 'Case 1 - Hero (No Teacher)', prompt: prompt1 },
        { name: 'Case 2 - Data (Technical Detail)', prompt: prompt2 },
        { name: 'Case 3 - Practice (No Generic B-Roll)', prompt: prompt3 }
    ];

    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        console.log(`\n⏳ Testing ${test.name}...`);
        
        // This simulates the LOGIC that will be in the REFACTORED buildEducationalPrompt
        const phase2Logic = `CORE SUBJECT: ${test.prompt}. 
CONTEXT: An authentic industrial enterprise environment, zero human figures, no classroom or office tropes.
TECHNICAL STYLE: Raw handheld industrial photography, 35mm lens, cool ambient data center lighting, razor-sharp technical focus.
MANDATORY CONSTRAINTS: POSITIVE ASSERTIONS OF ABSENCE - An empty, clean, professional technology interface. No teacher, no student, no smiling faces. 15% whitespace safety margin. 
EXCLUDE: teacher, student, laptop being closed, handshakes, cartoon, 3D characters, clip-art.`;

        try {
            // Passing index as number to match signature
            const img = await geminiImageService.generateImage(phase2Logic, i);
            if (img?.url) {
                // Log with unique marker for easy grep
                console.log(`✅ [SUCCESS_URL] ${img.url} [/SUCCESS_URL]`);
            } else {
                console.error(`❌ Failed for ${test.name}`);
            }
        } catch (e) {
            console.error(`❌ Error in ${test.name}:`, e);
        }
    }
    
    console.log('\n🏁 TEST BENCH COMPLETE. Please verify the URLs above.');
}

testPhase2Prompts().catch(console.error);
