/**
 * Manual Multipart Upload Test
 * Constructs raw body manually to facilitate debugging HeyGen upload 400 error
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import * as https from 'https';

config({ path: resolve(process.cwd(), '.env.local') });

async function manualUpload() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const imagePath = resolve(process.cwd(), 'public/ai_avatar/sarah.png');

    if (!fs.existsSync(imagePath)) {
        console.error('File not found:', imagePath);
        process.exit(1);
    }

    const fileBuffer = fs.readFileSync(imagePath);
    const boundary = '----HeyGenUploadBoundary' + Date.now().toString(16);

    // Construct the multipart body parts
    const prePart = `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="sarah.png"\r\n` +
        `Content-Type: image/png\r\n\r\n`;

    const postPart = `\r\n--${boundary}--\r\n`;

    const bodyBuffer = Buffer.concat([
        Buffer.from(prePart, 'utf8'),
        fileBuffer,
        Buffer.from(postPart, 'utf8')
    ]);

    console.log('Sending manual multipart request...');
    console.log('Image size:', fileBuffer.length);
    console.log('Total body size:', bodyBuffer.length);
    console.log('Boundary:', boundary);

    const options = {
        hostname: 'upload.heygen.com',
        path: '/v1/asset',
        method: 'POST',
        headers: {
            'X-Api-Key': apiKey,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': bodyBuffer.length
        }
    };

    const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
            console.log(`\nResponse Status: ${res.statusCode}`);
            try {
                const json = JSON.parse(responseBody);
                console.log('Response Body:', JSON.stringify(json, null, 2));

                if (json.code === 100) {
                    console.log('✅ SUCCESS! Asset ID:', json.data.asset_id);
                } else {
                    console.log('❌ FAILED:', json.message);
                }
            } catch (e) {
                console.log('Raw Body:', responseBody);
            }
        });
    });

    req.on('error', (e) => {
        console.error('Request Error:', e);
    });

    req.write(bodyBuffer);
    req.end();
}

manualUpload();
