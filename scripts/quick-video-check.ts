import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function quickCheck() {
    const { data } = await supabase
        .from('courses')
        .select('title, intro_video_url')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (data) {
        console.log(`Latest Course: ${data.title}`);
        console.log(`Video URL: ${data.intro_video_url ? '✅ PRESENT' : '❌ MISSING'}`);
        if (data.intro_video_url) {
            console.log(`URL: ${data.intro_video_url.substring(0, 50)}...`);
        }
    }
}

quickCheck();
