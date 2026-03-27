// Capture full error output
const { spawn } = require('child_process');

const proc = spawn('npx', ['tsx', 'scripts/test-heygen-api.ts'], {
    cwd: 'k:/recover/from_23rd',
    shell: true
});

let stdout = '';
let stderr = '';

proc.stdout.on('data', (data) => {
    const text = data.toString();
    stdout += text;
    process.stdout.write(text);
});

proc.stderr.on('data', (data) => {
    const text = data.toString();
    stderr += text;
    process.stderr.write(text);
});

proc.on('close', (code) => {
    console.log('\n\n=== FULL OUTPUT ===');
    console.log('Exit code:', code);
    if (stderr) {
        console.log('\n=== STDERR ===');
        console.log(stderr);
    }
});
