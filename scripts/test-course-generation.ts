
const { AgentOrchestrator } = require('../lib/ai/agent-system');
const { VideoGenerationService } = require('../lib/services/video-generation');

// Mock dependencies
jest.mock('../lib/services/video-generation');
jest.mock('@/lib/supabase/server', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({ single: () => ({ data: {}, error: null }) }),
            insert: () => ({ select: () => ({ data: [{}], error: null }) }),
            update: () => ({ select: () => ({ single: () => ({ data: {}, error: null }) }) }),
        }),
    }),
}));

async function runTest() {
    console.log('Starting Test Generation...');
    const orchestrator = new AgentOrchestrator();

    try {
        const result = await orchestrator.generateCourse({
            courseName: "Test Course",
            difficultyLevel: "Beginner",
            targetDuration: 60
        }, async (progress, msg) => {
            console.log(`[Progress ${progress}%] ${msg}`);
        });

        console.log('Generation Complete!');
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Generation Failed:', err);
    }
}

runTest();
