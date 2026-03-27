import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadBackground() {
    const filePath = 'C:/Users/ravkh/.gemini/antigravity/brain/47df30f3-9759-409f-957d-c48ec0193230/office_background_1769806572255.png';
    console.log(`Reading file from: ${filePath}`);

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = `backgrounds/office-blur-${Date.now()}.png`;

        console.log(`Uploading to course-audio bucket as ${fileName}...`);

        const { data, error } = await supabase.storage
            .from('course-audio') // Re-using existing bucket for convenience
            .upload(fileName, fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('course-audio')
            .getPublicUrl(fileName);

        console.log('Upload Success!');
        console.log('Public URL:', publicUrl);

    } catch (error) {
        console.error('Upload failed:', error);
    }
}

uploadBackground();
