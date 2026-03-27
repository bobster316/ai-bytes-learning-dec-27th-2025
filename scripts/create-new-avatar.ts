
import { config } from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

async function createNewAvatar() {
    // Path provided by user metadata
    const imagePath = 'C:/Users/ravkh/.gemini/antigravity/brain/94c99d92-e9ed-4e4f-9898-2bb60ebca646/uploaded_media_1769869690097.png';
    const apiKey = process.env.HEYGEN_API_KEY;

    console.log(`🚀 Creating new avatar from image: ${imagePath}`);

    if (!fs.existsSync(imagePath)) {
        console.error('❌ File does not exist at path!');
        return;
    }

    try {
        const fileBuffer = fs.readFileSync(imagePath);
        const blob = new Blob([fileBuffer], { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', blob, 'avatar.png');

        console.log('📤 Sending request to HeyGen /v1/asset...');

        // Explicitly NOT setting Content-Type to let fetch handle the boundary
        const response = await fetch('https://upload.heygen.com/v1/asset', {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey!,
                'Accept': 'application/json'
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.code === 100) {
            console.log('\n✅ Avatar Created Successfully!');
            console.log(`   New Avatar ID: ${data.data.asset_id}`);
        } else {
            console.error('\n❌ Upload Failed:', JSON.stringify(data, null, 2));
        }

    } catch (error: any) {
        console.error('\n❌ Unexpected Error:', error.message);
    }
}

createNewAvatar();
