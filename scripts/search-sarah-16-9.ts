import fs from 'fs';
import path from 'path';

async function search() {
    const logPath = 'logs/everything-list.log';
    if (!fs.existsSync(logPath)) {
        console.error('Log file not found');
        return;
    }

    // Read file with potential UTF-16LE encoding check
    let content = fs.readFileSync(logPath, 'utf8');

    // If it looks like UTF-16, try again
    if (content.includes('\u0000')) {
        content = fs.readFileSync(logPath, 'utf16le');
    }

    console.log('--- SEARCHING FOR TALKING PHOTOS ---');

    // Look for talking_photo_id
    const tpMatches = content.match(/"talking_photo_id":\s*"([a-f0-9]{32})"/g);
    if (tpMatches) {
        console.log(`Found ${tpMatches.length} raw matches.`);
        const uniqueIds = [...new Set(tpMatches.map(m => m.match(/"([a-f0-9]{32})"/)[1]))];
        console.log('Unique Talking Photo IDs:', uniqueIds);
    } else {
        console.log('No talking_photo_id matches found.');
    }

    // Look for template_id
    const tMatches = content.match(/"template_id":\s*"([a-f0-9]{32})"/g);
    if (tMatches) {
        console.log(`Found ${tMatches.length} template matches.`);
        const uniqueTIds = [...new Set(tMatches.map(m => m.match(/"([a-f0-9]{32})"/)[1]))];
        console.log('Unique Template IDs:', uniqueTIds);
    }
}

search();
