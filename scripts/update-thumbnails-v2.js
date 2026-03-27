
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadAndUpdate(courseTitle, filePath, storagePath) {
    console.log(`Processing: ${courseTitle}`);

    try {
        const fileContent = fs.readFileSync(filePath);

        // Upload to Storage
        const finalStoragePath = `temp/${storagePath}`; // Keeping organized
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('course-images')
            .upload(finalStoragePath, fileContent, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('course-images')
            .getPublicUrl(finalStoragePath);

        console.log(`Uploaded to: ${publicUrl}`);

        // Find Course ID first
        const { data: searchData, error: searchError } = await supabase
            .from('courses')
            .select('id, title')
            .ilike('title', `%${courseTitle}%`)
            .limit(1);

        if (searchError) {
            console.error(`Search error for ${courseTitle}:`, searchError.message);
            return;
        }

        if (!searchData || searchData.length === 0) {
            console.warn(`WARNING: No course found matching "%${courseTitle}%"`);
            return;
        }

        const courseId = searchData[0].id;
        console.log(`Found course ID: ${courseId} for "${searchData[0].title}"`);

        // Update by ID
        const { error: updateError } = await supabase
            .from('courses')
            .update({ image_url: publicUrl })
            .eq('id', courseId);

        if (updateError) {
            console.error(`Update error for ID ${courseId}:`, updateError.message);
        } else {
            console.log(`Successfully updated course ID: ${courseId}`);
        }

    } catch (err) {
        console.error(`Error processing ${courseTitle}:`, err.message);
    }
}

async function main() {
    const courses = [
        {
            searchTitle: 'AI Fundamentals: Business Concepts',
            file: 'public/temp-thumbnails/ai-fundamentals-thumbnail.png',
            storageName: 'ai-fundamentals-hd.png'
        },
        {
            searchTitle: 'Prompt Engineering: Foundations',
            file: 'public/temp-thumbnails/prompt-engineering-thumbnail.png',
            storageName: 'prompt-engineering-hd.png'
        }
    ];

    for (const course of courses) {
        const fullPath = path.join(process.cwd(), course.file);
        if (fs.existsSync(fullPath)) {
            await uploadAndUpdate(course.searchTitle, fullPath, course.storageName);
        } else {
            console.error(`File not found: ${fullPath}`);
        }
    }
}

main();
