
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function testModel() {
    const modelName = 'gemini-2.0-flash';
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`Testing model: ${modelName}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello, answer in one word." }] }]
            })
        });

        if (response.ok) {
            console.log(`✅ SUCCESS: ${modelName}`);
            const data = await response.json();
            console.log(JSON.stringify(data, null, 2));
            return true;
        } else {
            console.log(`❌ FAILED: ${modelName} (${response.status} ${response.statusText})`);
            const err = await response.text();
            console.log(err);
            return false;
        }
    } catch (e: any) {
        console.error(`❌ ERROR: ${e.message}`);
        return false;
    }
}

testModel();
