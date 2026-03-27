import 'dotenv/config';
import fetch from 'node-fetch';

const HEYGEN_API_KEY = 'sk_V2_hgu_kWvsCDf9I1d_nIdMnj6jSWbYl3r0WeRz3yPzsAGxxrNb';
const AVATAR_ID = '928a4d33d7d2466c865a2fbea708e80a'; // User provided ID

async function runTest() {
    console.log('--- Testing Sarah New Video Generation ---');
    console.log(`Avatar ID: ${AVATAR_ID}`);

    const url = 'https://api.heygen.com/v2/video/generate';
    const payload = {
        video_inputs: [
            {
                character: {
                    type: 'talking_photo',
                    talking_photo_id: AVATAR_ID
                },
                voice: {
                    type: 'text',
                    input_text: 'Hello, this is a test of the Sarah New avatar.',
                    voice_id: '1bd001e7e50f421d891986aad5158bc8' // HeyGen public voice
                },
                background: {
                    type: 'color',
                    value: '#00FF00'
                }
            }
        ],
        dimension: { width: 1280, height: 720 }
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch('https://api.heygen.com/v2/video/generate', {
            method: 'POST',
            headers: {
                'X-Api-Key': HEYGEN_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log(`Response Status: ${response.status} ${response.statusText}`);
        console.log('--- ERROR START ---');
        console.log(text);
        console.log('--- ERROR END ---');

        if (response.ok) {
            const json = JSON.parse(text);
            console.log('Success! Job ID:', json.data?.video_id || json.data?.id);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

runTest();
