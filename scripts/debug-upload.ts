/**
 * Debug photo upload to HeyGen
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

config({ path: resolve(process.cwd(), '.env.local') });

async function debugUpload() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const imagePath = resolve(process.cwd(), 'public/ai_avatarr/sarah.png');

    console.log('Testing photo upload...');
    console.log('Image path:', imagePath);
    console.log('File exists:', fs.existsSync(imagePath));

    const form = new FormData();
    const fileStream = fs.createReadStream(imagePath);
    const fileName = path.basename(imagePath);

    form.append('file', fileStream, {
        filename: fileName,
        contentType: 'image/png'
    });

    console.log('\nForm headers:', form.getHeaders());

    try {
        const response = await fetch('https://upload.heygen.com/v1/asset', {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey!,
                ...form.getHeaders()
            },
            body: form as any
        });

        console.log('\nResponse status:', response.status);
        const text = await response.text();
        console.log('Response:', text);

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

debugUpload();
