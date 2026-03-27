
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listCourses() {
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, intro_video_job_id, intro_video_status, intro_video_url')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching courses:", error);
        return;
    }

    console.log("Recent Courses:");
    courses.forEach(c => {
        console.log(`- ${c.title} (${c.id})`);
        console.log(`  Intro Job: ${c.intro_video_job_id}`);
        console.log(`  Status: ${c.intro_video_status}`);
        console.log(`  URL: ${c.intro_video_url}`);
        console.log("-----------------------------------");
    });
}

listCourses();
