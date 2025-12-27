
const { GroqClient, aiClient } = require('./lib/ai/groq');
require('dotenv').config({ path: '.env.local' });

async function testAI() {
    console.log("Checking API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
    try {
        const client = aiClient;
        console.log("Generating small description...");
        const desc = await client.generateDescription("AI for Beginners", "beginner");
        console.log("Description Success:", desc);

        console.log("Generating Outline...");
        const outline = await client.generateOutline({
            courseName: "Deep Learning 101",
            difficultyLevel: "beginner",
            courseDescription: "Intro to DL",
            targetDuration: 60
        });
        console.log("Outline Success:", JSON.stringify(outline, null, 2).substring(0, 200) + "...");
    } catch (error) {
        console.error("AI Test Failed:", error);
    }
}

testAI();
