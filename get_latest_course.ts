import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestCourse() {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url, difficulty_level, created_at')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (error) {
    console.error('Error fetching course:', error.message);
    return;
  }
  
  if (!courses || courses.length === 0) {
    console.log('No courses found.');
    return;
  }
  
  const course = courses[0];
  console.log('--- LATEST COURSE ---');
  console.log('ID:', course.id);
  console.log('Title:', course.title);
  console.log('Difficulty:', course.difficulty_level);
  console.log('Thumbnail:', course.thumbnail_url);
  console.log('Description:', course.description);
  
  const { data: topics } = await supabase
    .from('course_topics')
    .select('id, title, order_index')
    .eq('course_id', course.id)
    .order('order_index', { ascending: true });
    
  console.log('\n--- TOPICS ---');
  if (topics) {
    for (const t of topics) {
      console.log(`${t.order_index}. ${t.title}`);
      
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, title, order_index, content_blocks, thumbnail_url, content_html')
        .eq('topic_id', t.id)
        .order('order_index', { ascending: true });
        
      if (lessons) {
        for (const l of lessons) {
          const blocks = l.content_blocks ? (typeof l.content_blocks === 'string' ? JSON.parse(l.content_blocks) : l.content_blocks) : [];
          console.log(`  Lesson ${l.order_index}: ${l.title} (Blocks: ${blocks.length})`);
          console.log(`  HTML Size: ${l.content_html ? l.content_html.length : 0} bytes`);
        }
      }
    }
  }
}
checkLatestCourse();
