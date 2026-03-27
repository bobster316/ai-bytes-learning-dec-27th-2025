
import { config } from 'dotenv';
import { resolve } from 'path';
import { exec } from 'child_process';

config({ path: resolve(process.cwd(), '.env.local') });

const imagePath = 'temp_avatar.png';
const apiKey = process.env.HEYGEN_API_KEY;

if (!apiKey) {
    console.error('❌ HEYGEN_API_KEY is missing!');
    process.exit(1);
}

// Construct curl command with -k (insecure) to bypass SSL revocation check issues
const command = `curl.exe -k -v -X POST "https://upload.heygen.com/v1/asset" -H "X-Api-Key: ${apiKey}" -F "file=@${imagePath}"`;

console.log('🚀 Uploading via curl (insecure mode)...');

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Exec error: ${error.message}`);
        return;
    }
    if (stderr) {
        // Curl writes progress to stderr, don't fail on it, just log it
        // console.error(`Stderr: ${stderr}`);
    }
    try {
        const data = JSON.parse(stdout);
        if (data.code === 100) {
            console.log('\n✅ Avatar Created Successfully!');
            console.log(`   New Avatar ID: ${data.data.asset_id}`);
        } else {
            console.log('Response:', stdout);
        }
    } catch (e) {
        console.log('Raw Output:', stdout);
    }
});
