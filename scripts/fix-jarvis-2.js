const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/voice/JarvisMinimal.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Goal: Remove lines 9 to 64 (1-indexed). 
// 0-indexed: 8 to 63.

// Verification
const startLineContent = lines[9].trim(); // Index 9 is line 10. Line 9 is empty.
console.log('Line 10 content:', startLineContent);
// Should be "** AUDIO PROFILE: The Professor **" or similar.

const endLineContent = lines[63].trim(); // Index 63 is line 64.
console.log('Line 64 content:', endLineContent);
// Should be "`;"

if (endLineContent === '`;') {
    console.log('Found end marker at line 64');

    // Splice out lines 8 to 63 (inclusive). 
    // Count: 63 - 8 + 1 = 56 lines.

    lines.splice(8, 57); // Removing line 9 to 65 just to be cleaner (65 is empty).

    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully removed garbage lines');
} else {
    console.log('End marker NOT found at line 64. Found:', endLineContent);
}
