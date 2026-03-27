/**
 * Debug Upload with Axios
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

config({ path: resolve(process.cwd(), '.env.local') });

async function debugUpload() {
    console.log('Testing upload with Axios...');
    const apiKey = process.env.HEYGEN_API_KEY;
    console.log('API Key present:', !!apiKey);

    // Path check
    const imagePath = resolve(process.cwd(), 'public/ai_avatar/sarah.png');
    console.log('Image path:', imagePath);
    console.log('Exists:', fs.existsSync(imagePath));
    const stats = fs.statSync(imagePath);
    console.log('Size:', stats.size);

    // Technique 1: Stream
    try {
        console.log('\n--- Attempt 1: Stream ---');
        const form = new FormData();
        form.append('file', fs.createReadStream(imagePath));

        const headers = {
            'X-Api-Key': apiKey,
            ...form.getHeaders()
        };
        console.log('Headers:', headers);

        const response = await axios.post('https://upload.heygen.com/v1/asset', form, {
            headers,
            maxBodyLength: Infinity
        });
        console.log('Success (Stream):', response.data);
    } catch (error: any) {
        console.error('Failed (Stream):', error.response ? error.response.data : error.message);
    }

    // Technique 2: Buffer
    try {
        console.log('\n--- Attempt 2: Buffer ---');
        const buffer = fs.readFileSync(imagePath);
        const form = new FormData();
        form.append('file', buffer, { filename: 'sarah.png', contentType: 'image/png' });

        const headers = {
            'X-Api-Key': apiKey,
            ...form.getHeaders()
        };

        const response = await axios.post('https://upload.heygen.com/v1/asset', form, {
            headers,
            maxBodyLength: Infinity
        });
        console.log('Success (Buffer):', response.data);
    } catch (error: any) {
        console.error('Failed (Buffer):', error.response ? error.response.data : error.message);
    }
}

debugUpload();
