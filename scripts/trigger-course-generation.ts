
import { fetch } from 'undici';

async function triggerCourseGeneration() {
    console.log('🚀 Triggering Course Generation...');

    // Test Payload
    const payload = {
        courseName: "Introduction to Machine Learning",
        courseDescription: "A beginner's guide to how machines learn from data.",
        difficultyLevel: "beginner",
        targetDuration: 10,
        targetAudience: "New Employees",
        videoSettings: {
            courseHost: 'sarah',
            moduleHost: 'sarah'
        }
    };

    try {
        const response = await fetch('http://localhost:3000/api/course/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        if (!response.body) throw new Error('No response body');

        // Handle SSE Stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        console.log('📡 Connected to generation stream...\n');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));
                        handleEvent(data);
                    } catch (e) {
                        // Ignore parse errors for partial chunks
                    }
                }
            }
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

function handleEvent(data: any) {
    if (data.stage === 'error') {
        console.error(`❌ ERROR: ${data.message}`);
        return;
    }

    if (data.stage === 'videos') {
        console.log(`\n🎬 VIDEO GENERATION TRIGGERED: ${data.message}`);
        return;
    }

    if (data.stage === 'completed') {
        console.log(`\n🎉 COMPLETED! Course ID: ${data.courseId}`);
        console.log(`   URL: http://localhost:3000/admin/courses/${data.courseId}`);
        return;
    }

    // General progress
    if (data.message) {
        process.stdout.write(`\r[${data.progress || 0}%] ${data.stage}: ${data.message}`.padEnd(80));
    }
}

triggerCourseGeneration();
