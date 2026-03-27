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

    const courseId = courses.id;
    const filePath = path.join(process.cwd(), 'public', 'generated-thumbnails', 'ai-model-training.png');
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `${courseId}/thumbnail-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(fileName, fileBuffer, {
            contentType: 'image/png',
            upsert: true
        });

    if (uploadError) {
        console.error("Upload failed:", uploadError);
        return;
    }

    const { data: publicUrlData } = supabase.storage
        .from('course-images')
        .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`URL: ${publicUrl}`);
    fs.writeFileSync('logs/thumbnail_url.txt', publicUrl);
}

uploadImage();
