import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseUpdate() {
    console.log('🔍 Testing Database Update Capability...\n');

    // 1. Find the course
    const { data: course, error: fetchError } = await supabase
        .from('courses')
        .select('id, title, intro_video_job_id, intro_video_status')
        .ilike('title', '%Prompt Engineering%')
        .single();

    if (fetchError || !course) {
        console.error('❌ Could not fetch course:', fetchError);
        return;
    }

    console.log(`✅ Found Course: ${course.title}`);
    console.log(`   ID: ${course.id}`);
    console.log(`   Current Job ID: ${course.intro_video_job_id || 'NULL'}`);
    console.log(`   Current Status: ${course.intro_video_status || 'NULL'}\n`);

    // 2. Try to update with a test value
    const testJobId = `test_${Date.now()}`;
    console.log(`🔄 Attempting to update with test job ID: ${testJobId}\n`);

    const { data: updateData, error: updateError } = await supabase
        .from('courses')
        .update({
            intro_video_job_id: testJobId,
            intro_video_status: 'queued'
        })
        .eq('id', course.id)
        .select();

    if (updateError) {
        console.error('❌ Update FAILED with error:', updateError);
        console.error('   Error code:', updateError.code);
        console.error('   Error message:', updateError.message);
        console.error('   Error details:', updateError.details);
        console.error('   Error hint:', updateError.hint);
    } else if (!updateData || updateData.length === 0) {
        console.error('❌ Update returned NO ROWS (but no error)');
        console.error('   This suggests RLS policy is blocking the update');
    } else {
        console.log('✅ Update SUCCEEDED!');
        console.log('   Rows affected:', updateData.length);
        console.log('   Updated data:', JSON.stringify(updateData[0], null, 2));
    }

    // 3. Verify the update
    console.log('\n🔍 Verifying update...\n');
    const { data: verifyData, error: verifyError } = await supabase
        .from('courses')
        .select('intro_video_job_id, intro_video_status')
        .eq('id', course.id)
        .single();

    if (verifyError) {
        console.error('❌ Verification failed:', verifyError);
    } else {
        console.log('Current values in database:');
        console.log(`   Job ID: ${verifyData.intro_video_job_id || 'NULL'}`);
        console.log(`   Status: ${verifyData.intro_video_status || 'NULL'}`);

        if (verifyData.intro_video_job_id === testJobId) {
            console.log('\n✅ SUCCESS: Database update is working correctly!');
        } else {
            console.log('\n❌ FAILURE: Value did not persist in database');
        }
    }
}

testDatabaseUpdate().catch(console.error);
