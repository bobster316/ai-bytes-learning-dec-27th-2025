const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/ai/agent-system.ts');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
    { from: '"CINEMATIC PHOTOGRAPHY, 8K, RAW STYLE: "', to: '"PHOTOREALISTIC CINEMATIC PHOTOGRAPHY: "' },
    { from: '"SPLIT-SCREEN PHOTOGRAPHY: "', to: '"PHOTOREALISTIC SPLIT-SCREEN: "' },
    { from: '"DOCUMENTARY PHOTOGRAPHY: "', to: '"PHOTOREALISTIC DOCUMENTARY: "' },
    { from: '"MACRO PHOTOGRAPHY OF SCREEN: "', to: '"PHOTOREALISTIC MACRO OF SCREEN: "' },
    { from: '"MACRO HARDWARE SHOT: "', to: '"PHOTOREALISTIC MACRO HARDWARE: "' }
];

let changed = false;
replacements.forEach(r => {
    if (content.includes(r.from)) {
        content = content.replace(r.from, r.to);
        changed = true;
        console.log(`Replaced: ${r.from} -> ${r.to}`);
    } else {
        console.warn(`String not found: ${r.from}`);
    }
});

if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched agent-system.ts');
} else {
    console.log('No changes needed.');
}
