import fs from 'fs';

try {
    const logPath = 'logs/everything-list.log';
    let content = fs.readFileSync(logPath, 'utf8');
    if (content.includes('\u0000')) content = fs.readFileSync(logPath, 'utf16le');

    const regex = /"talking_photo_id":\s*"([a-f0-9]{32})"/g;
    let match;
    const ids = new Set();
    while ((match = regex.exec(content)) !== null) {
        ids.add(match[1]);
    }

    console.log(`Checking ${ids.size} unique IDs...`);

    ids.forEach(id => {
        const idx = content.indexOf(id);
        // Look for context around the ID
        const start = Math.max(0, idx - 100);
        const end = Math.min(content.length, idx + 400);
        const snippet = content.substring(start, end);

        // Extract common fields if they exist nearby
        const nameMatch = snippet.match(/"(name|talking_photo_name)":\s*"([^"]+)"/);
        const urlMatch = snippet.match(/"preview_image_url":\s*"([^"]+)"/);

        console.log(`--- ID: ${id} ---`);
        console.log(`Name: ${nameMatch ? nameMatch[2] : 'Unknown'}`);
        // console.log(`URL: ${urlMatch ? urlMatch[1] : 'Unknown'}`);
    });

} catch (e) {
    console.error('Error:', e);
}
