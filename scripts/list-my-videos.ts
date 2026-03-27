
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function listVideos() {
    const apiKey = process.env.HEYGEN_API_KEY;
    console.log('🔍 Fetching latest 10 videos from HeyGen...');

    try {
        const res = await fetch('https://api.heygen.com/v1/video.list?limit=10', {
            headers: { 'X-Api-Key': apiKey! }
        });
        const data = await res.json();
        const fs = await import('fs');
        fs.writeFileSync('scripts/my-videos.json', JSON.stringify(data, null, 2));
        console.log('✅ Video list saved to scripts/my-videos.json');

        if (data.data && data.data.list) {
            console.log('\n--- RECENT VIDEOS ---');
            data.data.list.forEach((v: any, i: number) => {
                console.log(`${i + 1}. ID: ${v.video_id}`);
                console.log(`   Status: ${v.status}`);
                console.log(`   Title: ${v.video_title}`);
                console.log(`   URL: ${v.video_url || 'N/A'}`);
                console.log(`   Created: ${new Date(v.create_time * 1000).toLocaleString()}`);
                console.log('---------------------------');
            });
        } else {
            console.log('No videos found or error in response:', JSON.stringify(data, null, 2));
        }
    } catch (e: any) {
        console.error('Error fetching video list:', e.message);
    }
}

listVideos();
