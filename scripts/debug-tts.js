
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_TTS_API_KEY;
if (!apiKey) {
    console.error("Missing API Key");
    process.exit(1);
}

async function testTTS() {
    console.log("Testing Google TTS...");
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const payload = {
        input: { text: "Hello verification" },
        voice: {
            languageCode: "en-US",
            name: "en-US-Neural2-F"
        },
        audioConfig: {
            audioEncoding: "MP3"
        }
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body: ${text}`);

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testTTS();
