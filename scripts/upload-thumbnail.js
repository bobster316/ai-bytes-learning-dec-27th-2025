const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            if (line.trim() && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    process.env[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
    }
} catch (e) {
    console.log("Could not load .env.local, relying on process.env");
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImage() {
    const courseTitle = "AI Model Training Essentials";

    // 1. Get Course ID
    const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .ilike('title', `%${courseTitle}%`)
        .single();

    if (courseError) {
        console.error("Error finding course:", courseError);
        return;
    }

    if (!courses) {
        console.error("Course not found");
        return;
    }

    const courseId = courses.id;
    console.log(`Found Course: ${courses.title} (${courseId})`);

    // 2. Read File
    const filePath = path.join(process.cwd(), 'public', 'generated-thumbnails', 'ai-model-training.png');
    if (!fs.existsSync(filePath)) {
        console.error("Thumbnail file not found at " + filePath);
        return;
    }
    const fileBuffer = fs.readFileSync(filePath);

    // 3. Upload to Storage
    const fileName = `${courseId}/thumbnail-${Date.now()}.png`;
    console.log(`Uploading to ${fileName}...`);

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(fileName, fileBuffer, {
            contentType: 'image/png',
            upsert: true
        });

    if (uploadError) {
        console.error("Upload failed:", uploadError);
        return;
    }

    // 4. Get Public URL
    const { data: publicUrlData } = supabase.storage
        .from('course-images')
        .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`Uploaded Image URL: ${publicUrl}`);

    // 5. Update Course Record - Using UPSERT as workaround
    // Note: upsert requires ALL columns if not specified, 
    // so let's try just patching if update failed, or upsert with minimal data if id is correct?
    // Actually, upserting ONLY id and image_url might nullify other columns if not careful,
    // unless the table has defaults, but it's risky.
    // Let's try to update again, but maybe the schema cache refreshed?

    const { error: updateError } = await supabase
        .from('courses')
        .update({ image_url: publicUrl })
        .eq('id', courseId);

    if (updateError) {
        console.error("Update failed again:", updateError);
        console.log("Please update manually with the URL above.");
        return;
    }

    console.log("Course updated successfully!");
}

uploadImage();
