
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

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

    let sqlCommands = [];

    for (const course of courses) {
        const fullPath = path.join(process.cwd(), course.file);
        if (!fs.existsSync(fullPath)) {
            console.error(`File not found: ${fullPath}`);
            continue;
        }

        console.log(`Processing: ${course.searchTitle}`);
        try {
            const fileContent = fs.readFileSync(fullPath);
            const finalStoragePath = `temp/${course.storageName}`;

            // Upload
            const { error: uploadError } = await supabase.storage
                .from('course-images')
                .upload(finalStoragePath, fileContent, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (uploadError) {
                console.error(`Upload failed: ${uploadError.message}`);
                continue;
            }

            // Get URL
            const { data: { publicUrl } } = supabase.storage
                .from('course-images')
                .getPublicUrl(finalStoragePath);

            console.log(`Thumbnail URL: ${publicUrl}`);

            // Find ID
            const { data: searchData, error: searchError } = await supabase
                .from('courses')
                .select('id, title')
                .ilike('title', `%${course.searchTitle}%`)
                .limit(1);

            if (searchError) {
                console.error(`Search error: ${searchError.message}`);
            } else if (!searchData || searchData.length === 0) {
                console.warn(`WARNING: No course found matching "%${course.searchTitle}%"`);
            } else {
                const courseId = searchData[0].id;
                console.log(`Found ID: ${courseId}`);

                // Attempt Update
                const { error: updateError } = await supabase
                    .from('courses')
                    .update({ image_url: publicUrl })
                    .eq('id', courseId);

                if (updateError) {
                    console.error(`Update failed via API: ${updateError.message}`);
                    sqlCommands.push(`UPDATE courses SET image_url = '${publicUrl}' WHERE id = '${courseId}';`);
                } else {
                    console.log(`SUCCESS: Course updated via API.`);
                }
            }
        } catch (err) {
            console.error(`Unexpected error: ${err.message}`);
        }
    }

    if (sqlCommands.length > 0) {
        console.log('\n--- MANUAL FIX SQL ---');
        console.log(sqlCommands.join('\n'));
        fs.writeFileSync('fix_thumbnails.sql', sqlCommands.join('\n'));
        console.log('Saved to fix_thumbnails.sql');
    }
}

main();
