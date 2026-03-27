
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { config } from 'dotenv';
import fetch from 'node-fetch';

config({ path: resolve(process.cwd(), '.env.local') });

async function checkBackgroundAccess() {
    console.log('🔍 Debugging Background URL Accessibility...');

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const filename = 'bg_final.jpg';
        console.log(`📂 Reading local file: ${filename}`);
        const bgBuffer = await readFile(filename);

        // Use a unique name to ensure no caching issues during upload
        const remoteName = `backgrounds/debug-bg-${Date.now()}.jpg`;

        console.log(`📤 Uploading to Supabase 'course-audio' bucket as ${remoteName}...`);
        const { error: uploadError } = await supabase
            .storage
            .from('course-audio')
            .upload(remoteName, bgBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase
            .storage
            .from('course-audio')
            .getPublicUrl(remoteName);

        console.log(`🔗 Generated URL: ${publicUrl}`);

        // Check accessibility
        console.log(`🌍 Testing URL Accessibility...`);
        const response = await fetch(publicUrl, { method: 'HEAD' });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')}`);

        if (response.ok) {
            console.log('✅ URL is publicly accessible.');
        } else {
            console.error('❌ URL is NOT accessible. HeyGen cannot download it.');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

checkBackgroundAccess();
