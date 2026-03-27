
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugContent() {
    const courseId = 653;
    console.log(`🔍 [START] Debugging Course ${courseId}`);

    const { data: topics } = await supabase.from('topics').select('id, title').eq('course_id', courseId);
    console.log(`[TOPICS] Count: ${topics?.length || 0}`);

    const { data: modules } = await supabase.from('modules').select('id, title').eq('course_id', courseId);
    console.log(`[MODULES] Count: ${modules?.length || 0}`);

    const { data: lessons } = await supabase.from('lessons').select('id, title, module_id').limit(10);
    console.log(`[SAMPLE LESSONS] Total found: ${lessons?.length || 0}`);

    // Check if lessons are linked to modules of this course
    if (modules && modules.length > 0) {
        const modIds = modules.map(m => m.id);
        const { data: courseLessons } = await supabase.from('lessons').select('id, title, module_id').in('module_id', modIds);
        console.log(`[COURSE LESSONS] Count: ${courseLessons?.length || 0}`);
    }

    console.log('🔍 [END] Debug Complete.');
}

debugContent();
