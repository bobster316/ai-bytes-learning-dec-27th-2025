
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetails(courseId) {
    console.log(`Checking details for course ${courseId}...`);

    // Check topics
    const { data: topics, error: tErr } = await supabase
        .from('course_topics')
        .select('*')
        .eq('course_id', courseId);

    if (tErr) console.error('Error fetching topics:', tErr);
    else console.log(`Found ${topics.length} topics.`);

    for (const topic of topics) {
        console.log(`Topic: ${topic.title} (ID: ${topic.id})`);
        // Check lessons
        const { data: lessons, error: lErr } = await supabase
            .from('course_lessons')
            .select('*')
            .eq('topic_id', topic.id);

        if (lErr) console.error('Error fetching lessons:', lErr);
        else console.log(`  Found ${lessons.length} lessons.`);

        for (const lesson of lessons) {
            console.log(`    Lesson: ${lesson.title} (ID: ${lesson.id})`);
        }
    }
}

checkDetails(349);
checkDetails(352);
