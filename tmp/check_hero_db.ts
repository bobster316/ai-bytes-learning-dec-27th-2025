
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkHero() {
    const { data, error } = await supabase
        .from('course_lessons')
        .select('content_blocks, title')
        .eq('id', 3567)
        .single();
    
    if (error) {
        console.error('Error fetching lesson:', error);
        return;
    }
    
    const heroBlock = data.content_blocks.find((b: any) => b.type === 'hero' || b.type === 'lesson_header');
    console.log('Hero block:', JSON.stringify(heroBlock, null, 2));
}

checkHero();
