import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const courseId = process.argv[2] || 753;
const { data: topics } = await sb.from('course_topics').select('id, title').eq('course_id', courseId);
console.log('Topics:', topics?.length);

for (const t of topics || []) {
    const { data: lessons } = await sb.from('course_lessons').select('id, title, content_blocks').eq('topic_id', t.id);
    console.log(`Topic: "${t.title}" → ${lessons?.length || 0} lessons`);
    for (const l of lessons || []) {
        console.log(`  [${l.id}] ${l.title} (blocks: ${l.content_blocks?.length || 0})`);
    }
}
