import fs from 'fs';

try {
    const logPath = 'logs/everything-list.log';
    let content = fs.readFileSync(logPath, 'utf8');
    if (content.includes('\u0000')) content = fs.readFileSync(logPath, 'utf16le');

    const id = 'ec7ce11f02d44a6bb80bbe8620796950';
    const idx = content.indexOf(id);
    if (idx !== -1) {
        console.log(`--- Context for ${id} ---`);
        // Show 500 chars before and after
        const start = Math.max(0, idx - 500);
        const end = Math.min(content.length, idx + 500);
        console.log(content.substring(start, end));
    } else {
        console.log('ID not found in log.');
    }

} catch (e) {
    console.error('Error:', e);
}
