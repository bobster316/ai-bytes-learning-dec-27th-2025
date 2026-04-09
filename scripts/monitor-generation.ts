import http from 'http';

const PROMPT = {
    courseName: "The Intelligence Illusion: How AI Really Works",
    targetAudience: "Non-technical beginners",
    difficultyLevel: "intermediate", // Lowercase per zod schema
    targetDuration: 15,
    topicCount: 1, // Keep it fast for this test
    lessonsPerTopic: 2
};

async function run() {
    console.log("🚀 Initializing Live Course Generation Monitor...");
    console.log("Payload:", JSON.stringify(PROMPT, null, 2));
    
    const startTime = Date.now();

    const req = http.request('http://localhost:3000/api/course/generate-v2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }, (res) => {
        console.log(`\nHTTP ${res.statusCode} Headers:`, res.headers['content-type']);
        let buffer = '';

        res.on('data', (chunk) => {
            buffer += chunk.toString();
            
            if (res.statusCode !== 200 && !buffer.includes('data: ')) {
                 console.log("Raw Response body:", buffer);
                 return;
            }

            // Basic SSE line parsing
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || ''; // Keep remainder

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '').trim();
                    try {
                        const event = JSON.parse(dataStr);
                        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                        
                        if (event.type === 'progress') {
                            console.log(`[${elapsed}s] 🔄 PROGRESS: ${event.progress}% | ${event.step} (${event.subStep || ''})`);
                        } else if (event.type === 'error' || event.status === 'failed') {
                            console.error(`[${elapsed}s] ❌ ERROR:`, event.error || event.details || event.message);
                        } else if (event.type === 'completed' || event.status === 'completed') {
                            console.log(`[${elapsed}s] ✅ COMPLETED! Course ID: ${event.courseId || event.course?.id}`);
                            process.exit(0);
                        } else {
                            console.log(`[${elapsed}s] ℹ️ EVENT:`, JSON.stringify(event));
                        }
                    } catch (e) {
                         console.error("Parse error on chunk:", dataStr);
                    }
                }
            }
        });

        res.on('end', () => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`\n[${elapsed}s] 🔌 Connection closed by server.`);
        });
    });

    req.on('error', (e) => {
        console.error('Test script request error:', e);
    });

    req.write(JSON.stringify(PROMPT));
    req.end();
}

run();
