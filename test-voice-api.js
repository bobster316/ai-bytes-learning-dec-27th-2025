
async function testVoiceAPI() {
    const url = 'http://localhost:3000/api/voice/message';
    const payload = {
        text: "What is the main topic of this lesson?",
        context: {
            path: "/courses/353/lessons/2057",
            courseId: "353"
        }
    };

    try {
        console.log('Sending request to', url);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }

        const data = await response.json();
        console.log('Success! Response from Aria:');
        console.log('--------------------------------------------------');
        console.log(data.text);
        console.log('--------------------------------------------------');

        if (data.result && data.result.context) {
            console.log('Context info found in debug.');
        }

    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

testVoiceAPI();
