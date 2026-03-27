
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.MAGIC_HOUR_API_KEY;
const baseUrl = 'https://api.magichour.ai/v1';
const logFile = 'probe_results.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function testUploadAndGen() {
    fs.writeFileSync(logFile, '--- Testing Magic Hour Lip Sync (Final Proof) ---\n');
    log('Starting...');

    // 1. Get arguments
    const filePath = path.join(process.cwd(), 'public', 'ai_avatar', 'sarah.png');
    if (!fs.existsSync(filePath)) return;

    // 2. Upload
    let fileId;
    try {
        const payload = { items: [{ extension: 'png', type: 'image' }] };
        const res = await fetch(`${baseUrl}/files/upload-urls`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        const uploadInfo = data.items[0];
        fileId = uploadInfo.file_path || uploadInfo.key || uploadInfo.id;

        const upUrl = uploadInfo.url || uploadInfo.upload_url || uploadInfo.signed_url;
        const fileBuffer = fs.readFileSync(filePath);
        await fetch(upUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/png' },
            body: fileBuffer
        });
        log(`✅ Uploaded input image. File Path: ${fileId}`);
    } catch (e) {
        log('Upload Error: ' + e.message);
        return;
    }

    // 3. Final Probe
    // We use a known public audio URL
    const audioUrl = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

    log(`\nTesting /lip-sync with Image + URL Audio...`);
    try {
        const body = {
            start_seconds: 0,
            end_seconds: 5,
            assets: {
                video_source: "file",
                video_file_path: fileId,
                audio_file_path: audioUrl
            }
        };

        const gRes = await fetch(`${baseUrl}/lip-sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        log(`Status: ${gRes.status}`);
        const text = await gRes.text();
        log(`Response: ${text.substring(0, 500)}`);

    } catch (e) {
        log('Probe Error: ' + e.message);
    }
}

testUploadAndGen();
