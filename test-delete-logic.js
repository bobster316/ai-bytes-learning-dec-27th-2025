
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testDelete() {
    console.log("Testing Delete API Logic...");

    // 1. Create a dummy course
    const { data: course, error } = await supabase.from('courses').insert({
        title: 'Delete Me Test',
        description: 'Test',
        difficulty_level: 'Beginner'
    }).select().single();

    if (error) {
        console.error("Setup failed:", error);
        return;
    }

    console.log(`Created course ${course.id}. Now deleting...`);

    // 2. Simulate the API logic manually to see where it breaks
    try {
        const courseId = course.id;

        // 1. Topics
        const { data: topics } = await supabase.from('course_topics').select('id').eq('course_id', courseId);
        console.log(`Found ${topics?.length || 0} topics.`);

        // (Skipping deep deletes since this is a fresh course)

        const { error: delError } = await supabase.from('courses').delete().eq('id', courseId);

        if (delError) {
            console.error("Delete failed:", delError);
        } else {
            console.log("Delete successful!");
        }

    } catch (e) {
        console.error("Exception:", e);
    }
}

testDelete();
