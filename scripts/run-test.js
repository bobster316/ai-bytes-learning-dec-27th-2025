// Simple wrapper to capture full output
const { execSync } = require('child_process');

try {
    const output = execSync('npx tsx scripts/test-heygen-api.ts', {
        cwd: 'k:/recover/from_23rd',
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024
    });
    console.log(output);
} catch (error) {
    console.log('STDOUT:', error.stdout);
    console.log('STDERR:', error.stderr);
    console.log('Exit code:', error.status);
}
