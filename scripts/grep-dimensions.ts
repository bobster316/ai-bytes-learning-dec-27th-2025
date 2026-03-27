import fs from 'fs';

try {
    const data = fs.readFileSync('logs/metadata.json', 'utf8');
    // Regex for "dimension": { "width": 1280, "height": 720 } or similar
    const widthMatch = data.match(/"width":\s*(\d+)/);
    const heightMatch = data.match(/"height":\s*(\d+)/);

    console.log('Detected Width:', widthMatch ? widthMatch[1] : 'Not Found');
    console.log('Detected Height:', heightMatch ? heightMatch[1] : 'Not Found');

    // Also check aspect ratio string
    const ratioMatch = data.match(/"aspect_ratio":\s*"([^"]+)"/);
    console.log('Detected Ratio:', ratioMatch ? ratioMatch[1] : 'Not Found');

} catch (e) {
    console.error('Error:', e);
}
