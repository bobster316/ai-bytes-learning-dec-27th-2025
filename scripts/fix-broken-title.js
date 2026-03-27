
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim();
});

const supabase = createClient(
    envVars['NEXT_PUBLIC_SUPABASE_URL'],
    envVars['SUPABASE_SERVICE_ROLE_KEY']
);

async function fixCourseTitle() {
    console.log("Searching for broken course title...");

    // Find the course with the broken title (using ILIKE to be safe)
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title')
        .ilike('title', '%Machine Learning Fundamentals%')
        .limit(5);

    if (error) {
        console.error("Search Error:", error);
        return;
    }

    if (!courses || courses.length === 0) {
        console.log("No course found matching 'Machine Learning Fundamentals'");
        return;
    }

    console.log("Found courses:", courses);

    const targetCourse = courses.find(c => c.title.includes("'s Guide") || c.title.includes("A 's")); // Targeted check

    if (targetCourse) {
        const newTitle = "Machine Learning Fundamentals: The Complete Guide";
        console.log(`Fixing Course "${targetCourse.title}" (ID: ${targetCourse.id}) -> "${newTitle}"`);

        const { error: updateError } = await supabase
            .from('courses')
            .update({ title: newTitle })
            .eq('id', targetCourse.id);

        if (updateError) {
            console.error("Update Failed:", updateError);
        } else {
            console.log("✅ Course Title Updated Successfully!");
        }
    } else {
        // Fallback: If exact broken one isn't found but we found ONE course, maybe update it?
        if (courses.length === 1) {
            const c = courses[0];
            const newTitle = "Machine Learning Fundamentals: The Complete Guide";
            console.log(`Updating single match "${c.title}" (ID: ${c.id}) -> "${newTitle}"`);
            await supabase.from('courses').update({ title: newTitle }).eq('id', c.id);
            console.log("✅ Course Title Updated Successfully!");
        } else {
            console.log("Multiple courses found, unsafe to auto-update without exact match.");
        }
    }
}

fixCourseTitle();
