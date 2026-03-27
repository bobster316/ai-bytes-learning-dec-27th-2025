import fs from 'fs';

try {
    const logPath = 'logs/everything-list.log';
    let content = fs.readFileSync(logPath, 'utf8');
    if (content.includes('\u0000')) content = fs.readFileSync(logPath, 'utf16le');

    console.log('--- FINDING LATEST TALKING PHOTO ---');

    // Find all occurrences of talking_photo_id
    const regex = /"talking_photo_id":\s*"([a-f0-9]{32})"/g;
    let match;
    const ids = [];
    while ((match = regex.exec(content)) !== null) {
        ids.push(match[1]);
    }

    if (ids.length > 0) {
        // The list is usually returned newest first, but let's see.
        console.log('First 5 IDs (usually newest):', ids.slice(0, 5));
        console.log('Last 5 IDs:', ids.slice(-5));

        // Also look for names if they are nearby
        ids.slice(0, 10).forEach(id => {
            const idx = content.indexOf(id);
            const context = content.substring(idx, idx + 200).replace(/\n/g, ' ');
            console.log(`ID: ${id} | Context: ${context}`);
        });
    } else {
        console.log('No Talking Photo IDs found.');
    }

} catch (e) {
    console.error('Error:', e);
}
