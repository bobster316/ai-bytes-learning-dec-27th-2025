import fs from 'fs';

try {
    const data = fs.readFileSync('logs/everything-list.log', 'utf8');

    console.log('--- EXTRACTED ASSETS ---');

    // Simple regex to find talking_photo_id, avatar_id, template_id
    const tpRegex = /"talking_photo_id":\s*"([^"]+)"/g;
    const avRegex = /"avatar_id":\s*"([^"]+)"/g;
    const teRegex = /"template_id":\s*"([^"]+)"/g;
    const nameRegex = /"name":\s*"([^"]+)"/g;

    let match;
    const ids = new Set();

    while ((match = tpRegex.exec(data)) !== null) {
        if (!ids.has(match[1])) {
            console.log(`Talking Photo ID: ${match[1]}`);
            ids.add(match[1]);
        }
    }

    while ((match = avRegex.exec(data)) !== null) {
        if (!ids.has(match[1])) {
            console.log(`Avatar ID: ${match[1]}`);
            ids.add(match[1]);
        }
    }

    while ((match = teRegex.exec(data)) !== null) {
        if (!ids.has(match[1])) {
            console.log(`Template ID: ${match[1]}`);
            ids.add(match[1]);
        }
    }

} catch (e) {
    console.error('Error:', e);
}
