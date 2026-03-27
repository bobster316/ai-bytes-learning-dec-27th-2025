
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function dumpContent() {
    console.log('[DUMP] Checking course_topics...');
    const { data: t, error: te } = await supabase.from('course_topics').select('*').limit(5);
    console.log(`Topics: ${JSON.stringify(t, null, 2)}`);
    if (te) console.error('T Error:', te.message);

    console.log('\n[DUMP] Checking course_lessons...');
    const { data: l, error: le } = await supabase.from('course_lessons').select('*').limit(5);
    console.log(`Lessons: ${JSON.stringify(l, null, 2)}`);
    if (le) console.error('L Error:', le.message);

    console.log('\n[DUMP] Checking topics...');
    const { data: tp, error: tpe } = await supabase.from('topics').select('*').limit(5);
    console.log(`Topics (legacy): ${JSON.stringify(tp, null, 2)}`);
    if (tpe) console.error('TP Error:', tpe.message);
}

dumpContent();
