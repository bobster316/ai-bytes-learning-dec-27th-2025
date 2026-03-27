const HEYGEN_API_KEY = 'sk_V2_hgu_kWvsCDf9I1d_nIdMnj6jSWbYl3r0WeRz3yPzsAGxxrNb';

async function listAvatars() {
    console.log('--- Fetching All Talking Photos ---');
    try {
        const response = await fetch('https://api.heygen.com/v2/talking_photos', {
            headers: {
                'X-Api-Key': HEYGEN_API_KEY,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`Failed to fetch: ${response.status}`);
            return;
        }

        const data = await response.json();
        const photos = data.data.talking_photos || [];
        console.log(`Found ${photos.length} talking photos.`);
        photos.forEach((photo) => {
            console.log(`- ID: ${photo.talking_photo_id}, Name: ${photo.talking_photo_name}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

listAvatars();
