/**
 * Test upload with minimal payload
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import FormData from 'form-data';
import https from 'https';

config({ path: resolve(process.cwd(), '.env.local') });

async function testSimpleUpload() {
    console.log('Testing simple upload...');
    const apiKey = process.env.HEYGEN_API_KEY;

    // Create a 1x1 pixel transparent PNG buffer
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

    const form = new FormData();
    form.append('file', buffer, {
        filename: 'pixel.png',
        contentType: 'image/png'
    });

    const options = {
        method: 'POST',
        hostname: 'upload.heygen.com',
        path: '/v1/asset',
        rejectUnauthorized: false,
        headers: {
            'X-Api-Key': apiKey,
            ...form.getHeaders()
        }
    };

    console.log('Sending request to upload.heygen.com...');

    const req = https.request(options, (res) => {
        let chunks: any[] = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
            const body = Buffer.concat(chunks).toString();
            console.log(`Status: ${res.statusCode}`);
            console.log('Body:', body);
        });
    });

    req.on('error', (e) => {
        console.error('Request error:', e);
    });

    form.pipe(req);
}

testSimpleUpload();
