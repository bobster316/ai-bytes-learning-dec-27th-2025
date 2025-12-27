
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function listModels() {
    // There isn't a direct listModels on GoogleGenerativeAI instance in the node SDK easily exposed?
    // Actually typically it's via a model manager? Use fetch.
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        // const fetch = (await import('node-fetch')).default || global.fetch;
        const res = await fetch(url);
        const data = await res.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("Error listing models:", data);
        }
    } catch (e) {
        console.error(e);
    }
}
listModels();
