
const fetch = require('node-fetch'); // Ensure node-fetch is installed or use global check
require('dotenv').config({ path: '.env.local' });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
    console.error("Please set ELEVENLABS_API_KEY in .env.local first.");
    process.exit(1);
}

async function listVoices() {
    try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY
            }
        });

        const data = await response.json();

        if (data.voices) {
            console.log("Available Voices:");
            console.log("--------------------------------------------------");
            // Filter common UK/Female possibilities or list all
            data.voices.forEach(v => {
                console.log(`Name: ${v.name}`);
                console.log(`ID:   ${v.voice_id}`);
                console.log(`Labels: ${JSON.stringify(v.labels)}`);
                console.log("--------------------------------------------------");
            });
        } else {
            console.error("No voices found or error:", data);
        }

    } catch (error) {
        console.error("Error listing voices:", error);
    }
}

// Fallback for node environment
if (!global.fetch) {
    import('node-fetch').then(mod => {
        global.fetch = mod.default;
        listVoices();
    });
} else {
    listVoices();
}
