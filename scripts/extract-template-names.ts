import fs from 'fs';

try {
    const logPath = 'logs/everything-list.log';
    let content = fs.readFileSync(logPath, 'utf8');
    if (content.includes('\u0000')) content = fs.readFileSync(logPath, 'utf16le');

    console.log('--- TEMPLATES FOUND ---');

    // Find blocks that look like { "template_id": "...", "name": "...", "aspect_ratio": "..." }
    // This is a bit tricky with regex in a large file, so let's find the templates array start
    const startIdx = content.indexOf('"templates"');
    if (startIdx !== -1) {
        const templatesSection = content.substring(startIdx);
        const templateBlocks = templatesSection.split('{').slice(1);

        templateBlocks.forEach(block => {
            const idMatch = block.match(/"template_id":\s*"([^"]+)"/);
            const nameMatch = block.match(/"name":\s*"([^"]+)"/);
            const ratioMatch = block.match(/"aspect_ratio":\s*"([^"]+)"/);

            if (idMatch && nameMatch) {
                console.log(`ID: ${idMatch[1]} | Name: ${nameMatch[1]} | Ratio: ${ratioMatch ? ratioMatch[1] : 'unknown'}`);
            }
        });
    } else {
        console.log('Templates section not found.');
    }

} catch (e) {
    console.error('Error:', e);
}
