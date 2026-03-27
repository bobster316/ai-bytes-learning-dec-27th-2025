// Test script to debug course generation API
const fetch = require('node-fetch');

async function testCourseGeneration() {
    console.log('🧪 Testing Course Generation API...\n');

    const payload = {
        courseName: "Introduction to Machine Learning",
        difficultyLevel: "beginner",
        targetAudience: "Professionals",
        courseDescription: "A comprehensive beginner course on Introduction to Machine Learning.",
        targetDuration: 60,
        videoSettings: {
            courseHost: 'sarah',
            moduleHost: 'lana'
        }
    };

    console.log('📤 Sending request with payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n⏳ Waiting for response...\n');

    try {
        const response = await fetch('http://localhost:3000/api/course/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('📊 Response Status:', response.status);
        console.log('📊 Response Headers:', response.headers.raw());

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Response:', errorText);
            return;
        }

        // Read the streaming response
        const reader = response.body;
        let buffer = '';

        reader.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        console.log('📨 Event:', data);

                        if (data.stage === 'error') {
                            console.error('\n❌ ERROR DETECTED:');
                            console.error('Message:', data.message);
                            console.error('Stage:', data.stage);
                        }

                        if (data.stage === 'completed') {
                            console.log('\n✅ Course generation completed!');
                            console.log('Course ID:', data.courseId);
                        }
                    } catch (e) {
                        console.warn('Failed to parse event:', line);
                    }
                }
            }
        });

        reader.on('end', () => {
            console.log('\n🏁 Stream ended');
        });

        reader.on('error', (err) => {
            console.error('\n❌ Stream error:', err);
        });

    } catch (error) {
        console.error('❌ Request failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testCourseGeneration();
