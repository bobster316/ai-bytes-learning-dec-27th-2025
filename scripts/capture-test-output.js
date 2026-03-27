// Capture full test output
const { spawn } = require('child_process');

const proc = spawn('npx', ['tsx', 'scripts/test-heygen-api.ts'], {
    cwd: 'k:/recover/from_23rd',
    shell: true
});

let output = '';

proc.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stdout.write(text);
});

proc.stderr.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stderr.write(text);
});

proc.on('close', (code) => {
    console.log('\n\n=== SUMMARY ===');
    console.log('Exit code:', code);

    // Extract error if present
    const errorMatch = output.match(/Error:([^\n]+)/);
    if (errorMatch) {
        console.log('\nError found:', errorMatch[1]);
    }

    const apiErrorMatch = output.match(/HeyGen API error \((\d+)\): (.+)/);
    if (apiErrorMatch) {
        console.log('\nAPI Error:');
        console.log('  Status:', apiErrorMatch[1]);
        console.log('  Message:', apiErrorMatch[2]);
    }
});
