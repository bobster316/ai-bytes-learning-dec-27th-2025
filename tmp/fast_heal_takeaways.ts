
import { geminiImageService } from '../lib/ai/gemini-image-service';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://aysqedgkpdbcbubadrrr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c3FlZGdrcGRiY2J1YmFkcnJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUzOTc5MCwiZXhwIjoyMDc4MTE1NzkwfQ.TLTdqATsMYiSRZM1HziWZ9wYNsPRvfCrYmjg9roP5RM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fastHeal(lessonId: string) {
    console.log(`🚀 Fast Healing Takeaways for Lesson ${lessonId}`);
    const { data: lesson } = await supabase.from('course_lessons').select('*').eq('id', lessonId).single();
    if (!lesson) return;

    let blocks = lesson.content_blocks as any[];
    let updated = false;

    for (let i = 0; i < blocks.length; i++) {
        let b = blocks[i];
        if (b.type === 'recap' || b.type === 'takeaways') {
            const currentPoints = b.points || b.items || [];
            const recapPrompt = `Take these simple recap points and transform them into 3-5 substantive, impressive technical takeaways that sound like expert insights.
            Each takeaway MUST be EXACTLY 1 sentence maximum. Keep it high-impact and expert-level.
            Current points: ${currentPoints.join(' | ')}
            Subject: ${lesson.title}
            
            Return ONLY a JSON array of strings. No markdown.`;
            
            const enrichedPoints = await geminiImageService.generateText(recapPrompt, 0.7);
            if (enrichedPoints) {
                try {
                    const cleanJson = enrichedPoints.replace(/```json|```/g, '').trim();
                    const newPoints = JSON.parse(cleanJson);
                    if (Array.isArray(newPoints)) {
                        b.points = newPoints;
                        updated = true;
                        console.log(`      ✅ Recap shortened: ${newPoints.length} points`);
                    }
                } catch (e) {
                    console.error('      ❌ Failed to parse enriched recap:', e);
                }
            }
        }
    }

    if (updated) {
        await supabase.from('course_lessons').update({ content_blocks: blocks }).eq('id', lessonId);
        console.log(`   🎉 Lesson ${lessonId} updated.`);
    }
}

async function run() {
    await fastHeal('3568');
    await fastHeal('3567');
}

run();
