
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { heyGenService } from '../lib/services/heygen-service';

async function verifyOptions() {
    console.log('🧪 VERIFYING HEYGEN V2 OPTIONS (1:1, 16:9, GREEN SCREEN)');

    const testAudio = 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/test-heygen-integration.mp3';

    try {
        // Test 1: 16:9 Green Screen
        console.log('\n🎬 Triggering 16:9 Green Screen...');
        const result169 = await heyGenService.generateVideo({
            audioUrl: testAudio,
            avatarType: 'sarah',
            duration: 10,
            title: '16:9 Green Screen Test',
            aspectRatio: '16:9'
        });
        console.log('✅ 16:9 Job ID:', result169.jobId);

        // Test 2: 1:1 Green Screen
        console.log('\n🎬 Triggering 1:1 Green Screen...');
        const result11 = await heyGenService.generateVideo({
            audioUrl: testAudio,
            avatarType: 'sarah',
            duration: 10,
            title: '1:1 Green Screen Test',
            aspectRatio: '1:1'
        });
        console.log('✅ 1:1 Job ID:', result11.jobId);

        console.log('\nRendering will take 2-5 minutes.');
        console.log(`16:9 Status: npx tsx scripts/check-test-video.ts (set jobId to ${result169.jobId})`);
        console.log(`1:1 Status: npx tsx scripts/check-test-video.ts (set jobId to ${result11.jobId})`);

    } catch (error: any) {
        console.error('\n❌ VERIFICATION TRIGGER FAILED:', error.message);
    }
}

verifyOptions();
