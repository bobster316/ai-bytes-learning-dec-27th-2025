import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function diagnose() {
    console.log('🔍 DIAGNOSTIC CHECK\n');

    // Get latest course
    const { data: course } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!course) {
        console.log('No courses found');
        return;
    }

    console.log('📚 COURSE DETAILS:');
    console.log(`Title: ${course.title}`);
    console.log(`ID: ${course.id}`);
    console.log(`Created: ${course.created_at}\n`);

    console.log('🎬 VIDEO STATUS:');
    console.log(`Job ID: ${course.intro_video_job_id || '❌ NULL'}`);
    console.log(`Status: ${course.intro_video_status || '❌ NULL'}`);
    console.log(`Video URL: ${course.intro_video_url || '❌ NULL'}\n`);

    // If job ID exists, manually check HeyGen status
    if (course.intro_video_job_id) {
        console.log('🔄 Manually checking HeyGen status...');
        const { heyGenService } = await import('../lib/services/heygen-service');

        try {
            const status = await heyGenService.checkVideoStatus(course.intro_video_job_id);
            console.log(`\nHeyGen Response:`);
            console.log(`  Status: ${status.status}`);
            console.log(`  Video URL: ${status.videoUrl || 'NULL'}`);
            console.log(`  Error: ${status.error || 'None'}`);

            if (status.status === 'completed' && status.videoUrl) {
                console.log('\n✅ VIDEO IS READY ON HEYGEN!');
                console.log('Updating database...');

                const { error } = await supabase
                    .from('courses')
                    .update({
                        intro_video_url: status.videoUrl,
                        intro_video_status: 'completed'
                    })
                    .eq('id', course.id);

                if (error) {
                    console.error('❌ Database update failed:', error);
                } else {
                    console.log('✅ Database updated successfully!');
                }
            }
        } catch (e: any) {
            console.error('❌ Error checking HeyGen:', e.message);
        }
    } else {
        console.log('❌ PROBLEM: No job ID saved during generation!');
        console.log('This means the video generated but we lost the tracking ID.');
    }
}

diagnose().catch(console.error);
