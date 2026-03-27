import fs from 'fs';

try {
    const logPath = 'logs/everything-list.log';
    let content = fs.readFileSync(logPath, 'utf8');
    if (content.includes('\u0000')) content = fs.readFileSync(logPath, 'utf16le');

    const templateId = '411231c2870e4df98f24351f3ab616d6';
    const idx = content.indexOf(templateId);
    if (idx !== -1) {
        console.log(`--- Context for Template ${templateId} ---`);
        // Show 2000 chars after the ID to see its elements
        console.log(content.substring(idx, idx + 4000));
    } else {
        console.log('Template ID not found in log.');
    }

} catch (e) {
    console.error('Error:', e);
}
