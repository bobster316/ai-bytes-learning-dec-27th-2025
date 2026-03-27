const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/voice/JarvisMinimal.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Remove lines 9 to 68 (0-indexed: 8 to 67)
// Line 9 is index 8. Line 68 is index 67.
// Verify content first
if (lines[8].trim() === '// Mock data removed') {
    console.log('Found start marker at line 9');
    // Check end marker around line 68
    // line 67: "    return userProgress;"
    // line 68: "};"
    // Let's print line 67 just to be sure
    console.log('Line 68 content:', lines[67]);

    // Splice out lines 8 to 67 (60 lines)
    // actually, let's just comment them out to be safe
    // Or remove them.
    // The previous view_file showed lines 9-67 as the block to remove.
    // userProgress helper ends at line 67 with "};" or inside "};"

    // safe deletion: from index 8 to index 67 inclusive.
    lines.splice(8, 60);

    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully removed lines 9-68');
} else {
    console.log('Start marker NOT found at line 9. Found:', lines[8]);
}
