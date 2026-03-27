
import { createClient } from './lib/supabase/server'; 
async function run() { 
    const s = await createClient(true); 
    const {data} = await s.from('course_lessons').select('content_blocks, content_markdown, title').eq('id', '3567').single(); 
    console.log(JSON.stringify(data, null, 2)); 
} 
run();
