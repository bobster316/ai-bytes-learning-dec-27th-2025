import { OrchestratorV2 } from '../lib/ai/agent-system-v2';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const orchestrator = new OrchestratorV2();
    console.log("Starting Generation using DeepSeek / OpenRouter...");
    
    try {
        const payload = {
            courseName: "Introduction to Machine Learning",
            difficultyLevel: "beginner",
            targetDuration: 60
        };

        const result = await (orchestrator as any).generateManifest(payload);

        console.log("FINAL OUTPUT MANIFEST:");
        console.log(JSON.stringify(result, null, 2));

        // Just generate the first lesson to prove lesson expansion works
        const lesson = (result as any).curriculum?.[0]?.lessons?.[0];
        console.log(`Expanding first module: ${lesson?.title}`);
        
        const content = await (orchestrator as any).expandLesson(lesson, {}, {}, [], 1, 1, "test");
        console.log("FINAL OUTPUT LESSON CONTENT:");
        console.log(JSON.stringify(content, null, 2));

    } catch (e: any) {
        console.error("GENERATION FAILED!", e);
        console.error("Stack:", e.stack);
    }
}

main();
