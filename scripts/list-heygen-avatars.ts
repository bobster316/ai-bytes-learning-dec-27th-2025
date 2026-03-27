import 'dotenv/config';
import fetch from 'node-fetch';

const HEYGEN_API_KEY = 'sk_V2_hgu_kWvsCDf9I1d_nIdMnj6jSWbYl3r0WeRz3yPzsAGxxrNb';

if (!HEYGEN_API_KEY) {
    console.error('HEYGEN_API_KEY is missing');
    process.exit(1);
}

async function listAvatars() {
    console.log('--- Fetching Standard Avatars (V2) ---');
    try {
        const response = await fetch('https://api.heygen.com/v2/avatars', {
            headers: {
                'X-Api-Key': HEYGEN_API_KEY,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch avatars: ${response.status} ${response.statusText}`);
            console.error(await response.text());
        } else {
            const data = await response.json();
            const avatars = data.data.avatars || [];
            console.log(`Found ${avatars.length} avatars.`);
            if (avatars.length > 0) {
                console.log('First avatar structure:', JSON.stringify(avatars[0], null, 2));
            }
            avatars.forEach((avatar: any) => {
                const name = avatar.avatar_name || avatar.name || '';
                if (name.toLowerCase().includes('sarah')) {
                    console.log(`- ID: ${avatar.avatar_id}, Name: ${name}, Gender: ${avatar.gender}`);
                }
            });
        }
    } catch (error) {
        console.error('Error fetching avatars:', error);
    }
}

async function listTalkingPhotos() {
    console.log('\n--- Fetching Talking Photos (V2) ---');
    try {
        const response = await fetch('https://api.heygen.com/v2/talking_photos', {
            headers: {
                'X-Api-Key': HEYGEN_API_KEY,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch talking photos: ${response.status} ${response.statusText}`);
            console.error(await response.text());
        } else {
            const data = await response.json();
            const photos = data.data.talking_photos || [];
            console.log(`Found ${photos.length} talking photos.`);
            photos.forEach((photo: any) => {
                if (photo.talking_photo_name.toLowerCase().includes('sarah')) {
                    console.log(`- ID: ${photo.talking_photo_id}, Name: ${photo.talking_photo_name}`);
                }
            });
        }
    } catch (error) {
        console.error('Error fetching talking photos:', error);
    }
}

async function main() {
    await listAvatars();
    await listTalkingPhotos();
}

main();
