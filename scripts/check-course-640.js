const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCourse640() {
    console.log('='.repeat(60));
    console.log('CHECKING COURSE 640 - VIDEO GENERATION STATUS');
    console.log('='.repeat(60));

    // Check course
    const { data: course, error: courseErr } = await supabase
        .from('courses')
        .select('id, title, intro_video_job_id, intro_video_status')
        .eq('id', 640)
        .single();

    if (courseErr) {
        console.error('Error fetching course:', courseErr);
        return;
    }

    console.log('\n📚 COURSE:');
    console.log('  ID:', course.id);
    console.log('  Title:', course.title);
    console.log('  intro_video_job_id:', course.intro_video_job_id || '❌ NULL');
    console.log('  intro_video_status:', course.intro_video_status || '❌ NULL');

    // Check topics
    const { data: topics, error: topicsErr } = await supabase
        .from('course_topics')
        .select('id, title, intro_video_job_id, intro_video_status, order_index')
        .eq('course_id', 640)
        .order('order_index');

    if (topicsErr) {
        console.error('Error fetching topics:', topicsErr);
        return;
    }

    console.log('\n📖 TOPICS:');
    topics.forEach(topic => {
        console.log(`  Topic ${topic.order_index + 1}: ${topic.title}`);
        console.log(`    intro_video_job_id: ${topic.intro_video_job_id || '❌ NULL'}`);
        console.log(`    intro_video_status: ${topic.intro_video_status || '❌ NULL'}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    const courseHasVideo = !!course.intro_video_job_id;
    const topicsWithVideos = topics.filter(t => !!t.intro_video_job_id).length;

    console.log(`  Course intro video: ${courseHasVideo ? '✅ JOB ID EXISTS' : '❌ NULL'}`);
    console.log(`  Topics with videos: ${topicsWithVideos}/${topics.length}`);

    if (courseHasVideo && topicsWithVideos === topics.length) {
        console.log('\n🎉 SUCCESS! All video job IDs were created!');
    } else {
        console.log('\n⚠️  ISSUE: Some video job IDs are missing');
        console.log('   Check server logs for [Orchestrator] and [API] messages');
    }
    console.log('='.repeat(60));
}

checkCourse640().catch(console.error);
