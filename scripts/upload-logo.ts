
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadLogo() {
    console.log('📤 Uploading logo.png to Supabase...');

    try {
        const fileContent = fs.readFileSync('logo.png');
        const fileName = `logo-${Date.now()}.png`;

        const { data, error } = await supabase.storage
            .from('course-audio') // Reusing existing public bucket
            .upload(fileName, fileContent, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('course-audio')
            .getPublicUrl(fileName);

        console.log(`✅ Logo uploaded successfully!`);
        console.log(`URL: ${publicUrl}`);

    } catch (error) {
        console.error('❌ Upload failed:', error);
    }
}

uploadLogo();
