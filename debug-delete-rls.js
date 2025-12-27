
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugDelete() {
    console.log("Creating dummy course for deletion test...");

    // 1. Create dummy course
    const { data: course, error } = await supabase.from('courses').insert({
        title: 'Delete Debug',
        description: 'Testing delete functionality',
        difficulty_level: 'Beginner'
    }).select().single();

    if (error) {
        console.error("Setup failed:", error);
        return;
    }

    const courseId = course.id;
    console.log(`Created course: ${courseId}`);

    // 2. Call the API Endpoint Logic directly in script to debug
    console.log("Simulating DELETE API Logic...");

    try {
        // Step 1: Topics
        console.log("Checking topics...");
        const { data: topics } = await supabase.from('course_topics').select('id').eq('course_id', courseId);
        const topicIds = topics?.map(t => t.id) || [];
        console.log(`Found ${topicIds.length} topics.`);

        // Step 2: Delete
        console.log("Deleting course record...");
        const { error: delError } = await supabase.from('courses').delete().eq('id', courseId);

        if (delError) {
            console.error("Delete FAILED:", delError.message, delError.details, delError.hint);
        } else {
            console.log("Delete SUCCESS!");
        }

    } catch (e) {
        console.error("Exception during delete sim:", e);
    }
}

debugDelete();
