import fs from 'fs';

try {
    const data = fs.readFileSync('logs/find-asset.log', 'utf8');
    // Find the JSON block
    const jsonStart = data.indexOf('{');
    const jsonStr = data.substring(jsonStart);
    const json = JSON.parse(jsonStr);

    const assets = json.data.talking_photos || [];
    console.log(`Found ${assets.length} talking photos.`);

    assets.forEach((a: any) => {
        console.log(`- ID: ${a.id}, Image: ${a.image_url.split('?')[0]}`);
    });

} catch (e) {
    console.error('Error parsing:', e);
}
