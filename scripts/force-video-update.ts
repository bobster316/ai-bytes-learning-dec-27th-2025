
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { magicHourClient } from '../lib/magichour/client';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Use the COMPLETE Debug Video ID
const PROOF_ID = 'cmkk659rq099j3h0zve2senpa';
// Target the lesson that was supposed to have video (3073)
const TARGET_LESSON_ID = '3073';

async function forceUpdate() {
    console.log(`Forcing Evidence Video Update...`);

    // 1. Get fresh URL
    console.log(`Getting URL for verified ID: ${PROOF_ID}`);
    const status = await magicHourClient.getVideoStatus(PROOF_ID);

    const downloadUrl = (status as any).download?.url || (status as any).download_url;
    if (!downloadUrl) {
        console.error("❌ Failed to get download URL from verified ID!");
        return;
    }
    console.log(`✅ URL Retrieved: ${downloadUrl.substring(0, 50)}...`);

    // 2. Update DB
    console.log(`Updating Lesson ${TARGET_LESSON_ID}...`);
    const { error } = await supabase
        .from('course_lessons')
        .update({ video_url: downloadUrl })
        .eq('id', TARGET_LESSON_ID);

    if (error) console.error("❌ DB Update Failed:", error);
    else console.log("✅ DB Updated Successfully.");
}

forceUpdate();
