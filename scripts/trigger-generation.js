
// Removed node-fetch import, using native fetch
// Fix: Use response.body (Node 18+) for streaming response reading

async function trigger() {
    console.log("Triggering generation for 'Advanced AI Architecture'...");
    try {
        const res = await fetch('http://localhost:3000/api/course/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseName: "Advanced AI Architecture",
                difficultyLevel: "advanced", // FIXED: lowercase
                courseDescription: "A technical deep dive into modern AI architectures, neural networks, and scalablity.",
                targetDuration: 60,
                dryRun: false // Ensure DB persistence
            })
        });

        console.log(`Response Status: ${res.status}`);

        if (!res.ok) {
            const text = await res.text();
            console.error("Error Body:", text);
            return;
        }

        // Reading the stream
        // @ts-ignore
        for await (const chunk of res.body) {
            const text = new TextDecoder().decode(chunk);
            console.log(text);
        }

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}
trigger();
