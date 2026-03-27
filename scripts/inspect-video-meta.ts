import fs from 'fs';

const data = fs.readFileSync('logs/metadata.json', 'utf8');
// The file might contain connection logs before the JSON, so let's find the JSON start
const jsonStart = data.indexOf('{');
const jsonStr = data.substring(jsonStart);

try {
    const json = JSON.parse(jsonStr);
    console.log('Video Dimensions:', json.data.dimension);
    console.log('Video Meta:', json.data.meta); // Sometimes hidden here
} catch (e) {
    console.error('Error parsing JSON:', e);
    console.log('Raw Data snippet:', data.substring(data.length - 200));
}
