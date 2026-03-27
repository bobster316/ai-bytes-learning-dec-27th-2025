
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.MAGIC_HOUR_API_KEY;
const baseUrl = 'https://api.magichour.ai/v1';

async function uploadFile(filename) {
    const filePath = path.join(process.cwd(), 'public', 'ai_avatar', filename);
    if (!fs.existsSync(filePath)) return null;

    try {
        const payload = { items: [{ extension: 'png', type: 'image' }] };
        const res = await fetch(`${baseUrl}/files/upload-urls`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        const uploadInfo = data.items[0];
        const fileId = uploadInfo.file_path || uploadInfo.key || uploadInfo.id;
        const upUrl = uploadInfo.url || uploadInfo.upload_url || uploadInfo.signed_url;

        const fileBuffer = fs.readFileSync(filePath);
        await fetch(upUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/png' },
            body: fileBuffer
        });
        return fileId;
    } catch (e) {
        return null;
    }
}

async function main() {
    const sarahId = await uploadFile('sarah.png');
    const lanaId = await uploadFile('lana.png');

    const result = {
        SARAH_AVATAR_ID: sarahId,
        LANA_AVATAR_ID: lanaId
    };

    fs.writeFileSync('avatar_ids.json', JSON.stringify(result, null, 2));
    console.log('Saved to avatar_ids.json');
}

main();
