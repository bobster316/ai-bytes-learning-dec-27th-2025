
// const fetch = require('node-fetch'); // Using native fetch

async function trigger() {
    console.log("Triggering generation for 'Strategic AI Leadership'...");
    try {
        const res = await fetch('http://localhost:3000/api/course/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseName: "Strategic AI Leadership",
                difficultyLevel: "advanced",
                targetDuration: 60
            })
        });

        if (!res.ok) {
            console.error(`Status: ${res.status}`);
            console.error(await res.text());
        } else {
            console.log("Response OK. Reading stream...");
            const text = await res.text();
            console.log(text);
        }
    } catch (e) {
        console.error("Error triggering generation:", e);
    }
}
trigger();
