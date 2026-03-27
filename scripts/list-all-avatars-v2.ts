/**
 * List ALL avatars including instant/custom avatars
 * Using the correct V2 API endpoint
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

async function listAllAvatarsV2() {
    const apiKey = process.env.HEYGEN_API_KEY;

    console.log('='.repeat(60));
    console.log('📋 FETCHING ALL AVATARS (Including Instant Avatars)');
    console.log('='.repeat(60));
    console.log('');

    try {
        const response = await fetch('https://api.heygen.com/v2/avatars', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey!
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HeyGen API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const avatars = data.data?.avatars || data.avatars || [];

        console.log(`✅ Found ${avatars.length} total avatars\n`);

        // Save full list
        const outputPath = resolve(process.cwd(), 'heygen-avatars-complete.json');
        writeFileSync(outputPath, JSON.stringify(avatars, null, 2));
        console.log(`💾 Full list saved to: ${outputPath}\n`);

        // Look for instant/custom avatars (usually have different naming patterns)
        const instantAvatars = avatars.filter((a: any) =>
            a.avatar_type === 'instant' ||
            a.is_instant === true ||
            a.avatar_name?.toLowerCase().includes('sarah') ||
            a.avatar_name?.toLowerCase().includes('lana')
        );

        console.log('='.repeat(60));
        console.log(`\n🎭 Instant/Custom Avatars Found (${instantAvatars.length}):\n`);

        instantAvatars.forEach((avatar: any, index: number) => {
            console.log(`${index + 1}. ${avatar.avatar_name || 'Unnamed'}`);
            console.log(`   ID: ${avatar.avatar_id}`);
            console.log(`   Type: ${avatar.avatar_type || 'N/A'}`);
            if (avatar.preview_image_url) {
                console.log(`   Preview: ${avatar.preview_image_url}`);
            }
            console.log('');
        });

        // Also search by name
        console.log('='.repeat(60));
        console.log('\n🔍 Searching for "Sarah" and "Lana":\n');

        const sarahAvatars = avatars.filter((a: any) =>
            a.avatar_name?.toLowerCase().includes('sarah')
        );
        const lanaAvatars = avatars.filter((a: any) =>
            a.avatar_name?.toLowerCase().includes('lana')
        );

        if (sarahAvatars.length > 0) {
            console.log('Sarah avatars found:');
            sarahAvatars.forEach((a: any) => {
                console.log(`  • ${a.avatar_name}`);
                console.log(`    ID: ${a.avatar_id}`);
                console.log(`    Type: ${a.avatar_type || 'standard'}`);
            });
            console.log('');
        } else {
            console.log('❌ No avatars with "Sarah" in the name found');
            console.log('');
        }

        if (lanaAvatars.length > 0) {
            console.log('Lana avatars found:');
            lanaAvatars.forEach((a: any) => {
                console.log(`  • ${a.avatar_name}`);
                console.log(`    ID: ${a.avatar_id}`);
                console.log(`    Type: ${a.avatar_type || 'standard'}`);
            });
            console.log('');
        } else {
            console.log('❌ No avatars with "Lana" in the name found');
            console.log('');
        }

        console.log('='.repeat(60));
        console.log('\n💡 Next Steps:');
        console.log('1. Review the list above for your custom avatars');
        console.log('2. Use the avatar_id shown above in your .env.local');
        console.log('3. Update HEYGEN_AVATAR_SARAH_ID and HEYGEN_AVATAR_LANA_ID');
        console.log('='.repeat(60) + '\n');

    } catch (error: any) {
        console.error('\n❌ Failed to fetch avatars');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

listAllAvatarsV2();
