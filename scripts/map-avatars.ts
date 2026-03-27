
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

async function mapAvatars() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const headers = {
        'Accept': 'application/json',
        'X-Api-Key': apiKey!
    };

    console.log('🔍 Mapping all HeyGen Avatars & Groups...\n');

    try {
        // 1. Fetch User's Talking Photos
        console.log('📸 Fetching Talking Photos...');
        const tpRes = await fetch('https://api.heygen.com/v2/talking_photos', { headers });
        const tpData = await tpRes.json();
        const talkingPhotos = tpData.data?.talking_photos || [];
        console.log(`   Found ${talkingPhotos.length} talking photos.\n`);

        // 2. Fetch Avatar Groups
        console.log('📁 Fetching Avatar Groups...');
        const groupRes = await fetch('https://api.heygen.com/v2/avatar_group.list', { headers });
        const groupData = await groupRes.json();
        const groups = groupData.data?.groups || [];
        console.log(`   Found ${groups.length} groups.\n`);

        const fullMap: any = {
            talking_photos: talkingPhotos,
            groups: []
        };

        // 3. For each group, fetch avatars
        for (const group of groups) {
            console.log(`   Mapping group: ${group.name} (${group.id})...`);
            try {
                const avRes = await fetch(`https://api.heygen.com/v2/avatars?avatar_group_id=${group.id}`, { headers });
                const avData = await avRes.json();
                const avatars = avData.data?.avatars || [];

                fullMap.groups.push({
                    group_id: group.id,
                    group_name: group.name,
                    avatars: avatars.map((a: any) => ({
                        id: a.avatar_id,
                        name: a.avatar_name,
                        gender: a.gender,
                        preview: a.preview_image_url
                    }))
                });
            } catch (err) {
                console.error(`   Error fetching group ${group.id}:`, err.message);
            }
        }

        // 4. Save and report
        writeFileSync('avatar_map_report.json', JSON.stringify(fullMap, null, 2));
        console.log('\n✅ Mapping complete! Report saved to avatar_map_report.json');

        // 5. Look for Sarah and Lana in the names
        console.log('\n🔍 Searching for "Sarah" or "Lana" in names:');

        talkingPhotos.forEach((tp: any) => {
            if (tp.talking_photo_name?.toLowerCase().includes('sarah') || tp.talking_photo_name?.toLowerCase().includes('lana')) {
                console.log(`⭐ FOUND in Talking Photos: ${tp.talking_photo_name} (ID: ${tp.talking_photo_id})`);
            }
        });

        fullMap.groups.forEach((g: any) => {
            if (g.group_name.toLowerCase().includes('sarah') || g.group_name.toLowerCase().includes('lana')) {
                console.log(`⭐ FOUND Group Name: ${g.group_name} (ID: ${g.group_id})`);
            }
            g.avatars.forEach((a: any) => {
                if (a.name?.toLowerCase().includes('sarah') || a.name?.toLowerCase().includes('lana')) {
                    console.log(`⭐ FOUND Avatar: ${a.name} in Group ${g.group_name} (ID: ${a.id})`);
                }
            });
        });

    } catch (error) {
        console.error('❌ Failed to map avatars:', error.message);
    }
}

mapAvatars();
