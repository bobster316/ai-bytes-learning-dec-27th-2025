import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function simpleHeyGenTest() {
    console.log('============================================================');
    console.log('🧪 SIMPLE HEYGEN TEST');
    console.log('============================================================\n');

    try {
        console.log('Loading HeyGen service...');
        const { heyGenService } = await import('../lib/services/heygen-service');
        console.log('✅ HeyGen service loaded\n');

        console.log('Checking configuration...');
        const isConfigured = heyGenService.isConfigured();
        console.log(`Is configured: ${isConfigured}\n`);

        if (!isConfigured) {
            console.error('❌ HeyGen is not configured');
            console.log('\nEnvironment check:');
            console.log(`  HEYGEN_API_KEY: ${process.env.HEYGEN_API_KEY ? 'Found' : 'NOT FOUND'}`);
            console.log(`  HEYGEN_TEMPLATE_COURSE_INTRO: ${process.env.HEYGEN_TEMPLATE_COURSE_INTRO || 'NOT FOUND'}`);
            console.log(`  HEYGEN_TEMPLATE_MODULE_INTRO: ${process.env.HEYGEN_TEMPLATE_MODULE_INTRO || 'NOT FOUND'}`);
            process.exit(1);
        }

        console.log('✅ HeyGen is properly configured!');
        console.log(`  API Key: ${process.env.HEYGEN_API_KEY?.substring(0, 15)}...`);
        console.log(`  Course Template: ${process.env.HEYGEN_TEMPLATE_COURSE_INTRO}`);
        console.log(`  Module Template: ${process.env.HEYGEN_TEMPLATE_MODULE_INTRO}`);

        console.log('\n============================================================');
        console.log('✅ TEST PASSED');
        console.log('============================================================\n');

    } catch (error: any) {
        console.error('\n❌ TEST FAILED');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

simpleHeyGenTest();
