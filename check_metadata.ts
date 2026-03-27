
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://aysqedgkpdbcbubadrrr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c3FlZGdrcGRiY2J1YmFkcnJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUzOTc5MCwiZXhwIjoyMDc4MTE1NzkwfQ.TLTdqATsMYiSRZM1HziWZ9wYNsPRvfCrYmjg9roP5RM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkMetadata() {
    console.log("🔍 Auditing Lesson Metadata...");
    const { data: lessons, error } = await supabase.from('course_lessons').select('id, title, duration_minutes, content_blocks').limit(100);
    
    if (error) {
        console.error("❌ Failed to fetch lessons:", error);
        return;
    }

    let untitledCount = 0;
    let missingDurationCount = 0;
    let brokenRecapCount = 0;

    lessons.forEach(l => {
        if (!l.title || l.title.toLowerCase().includes("untitled")) untitledCount++;
        if (!l.duration_minutes) missingDurationCount++;
        
        const header = (l.content_blocks as any[])?.find(b => b.type === 'hero' || b.type === 'lesson_header');
        if (header && (!header.difficulty || header.difficulty === 'Beginner' && !l.title.includes('Introduction'))) {
            // Difficulty is a block-level field in many schemas
        }
        const recap = (l.content_blocks as any[])?.find(b => b.type === 'recap' || b.type === 'recap_slide');
        if (recap && (!recap.points || recap.points.length === 0) && (!recap.items || recap.items.length === 0)) {
            brokenRecapCount++;
        }
    });

    console.log(`📊 Audit Results (Sample of ${lessons.length} lessons):`);
    console.log(`   - Untitled Lessons: ${untitledCount}`);
    console.log(`   - Missing Duration: ${missingDurationCount}`);
    console.log(`   - Broken Recap Slides: ${brokenRecapCount}`);
}

checkMetadata().catch(console.error);
