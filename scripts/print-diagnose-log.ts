import fs from 'fs';

try {
    const data = fs.readFileSync('logs/diagnose-v2.log', 'utf8');
    console.log(data);
} catch (e) {
    console.error(e);
}
