const http = require('http');

const data = JSON.stringify({
    courseName: "How Machines Actually Learn",
    courseDescription: "A deep dive into the microscopic operations of neural networks and gradient descent.",
    difficultyLevel: "intermediate",
    dryRun: true,
    targetDuration: 15,
    topicCount: 1,
    lessonsPerTopic: 1
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/course/generate-v2',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Starting Generation V2 Test (Waiting for SSE stream)...");

const req = http.request(options, (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`[SSE] ${chunk.trim()}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();
