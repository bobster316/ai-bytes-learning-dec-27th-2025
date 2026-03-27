
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listVideos() {
    console.log('🔍 Listing last 5 videos from Supabase...');
    const { data: videos, error } = await supabase
        .from('videos')
        .select(`
            id, 
            video_job_id, 
            status, 
            created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching videos:', JSON.stringify(error, null, 2));
        return;
    }

    if (!videos || videos.length === 0) {
        console.log('No videos found.');
        return;
    }

    videos.forEach(v => {
        console.log('------------------------------------------------');
        console.log(`ID: ${v.id}`);
        console.log(`Job ID: ${v.video_job_id}`);
        console.log(`Status: ${v.status}`);
        console.log(`Created: ${new Date(v.created_at).toLocaleString()}`);
        // Helper to handle joined data structure which might be array or object depending on Supabase version
        // Actually Supabase returns object if single relationship or array if many.
        // Let's just print json safely.
        // console.log(`Lesson: ${JSON.stringify(v.lesson)}`);
    });
}

listVideos();
