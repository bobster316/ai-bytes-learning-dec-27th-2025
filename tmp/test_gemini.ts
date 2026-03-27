
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testModels() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-latest"];
    
    for (const modelName of models) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`✅ ${modelName} works!`);
        } catch (e: any) {
            console.log(`❌ ${modelName} failed: ${e.message}`);
        }
    }
}

testModels();
