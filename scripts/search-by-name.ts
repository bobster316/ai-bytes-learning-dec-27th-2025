import fs from 'fs';

try {
    const logPath = 'logs/everything-list.log';
    let content = fs.readFileSync(logPath, 'utf8');
    if (content.includes('\u0000')) content = fs.readFileSync(logPath, 'utf16le');

    console.log('--- SEARCHING BY NAME AND URL ---');

    // Search for "Sarah"
    const sarahIdx = content.toLowerCase().lastIndexOf('sarah');
    if (sarahIdx !== -1) {
        console.log('--- SARAH MATCH ---');
        console.log(content.substring(sarahIdx - 100, sarahIdx + 500));
    }

    // Search for the 16:9 image filename
    const imgFilename = 'sarah-16-9-1769807111971.png';
    const imgIdx = content.indexOf(imgFilename);
    if (imgIdx !== -1) {
        console.log('\n--- IMAGE MATCH ---');
        console.log(content.substring(imgIdx - 500, imgIdx + 100));
    } else {
        console.log('\nImage filename not found.');
    }

} catch (e) {
    console.error('Error:', e);
}
