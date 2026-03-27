import { createClient } from '@supabase/supabase-js';
import { sanitizeBlocks } from './lib/ai/content-sanitizer';
import { videoService } from './lib/ai/video-service';
import { geminiImageService } from './lib/ai/gemini-image-service';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

(async () => {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Fetching Lesson 3568...');
    const { data: lesson, error: fetchErr } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', 3568)
        .single();

    if (fetchErr || !lesson) {
        console.error('Failed to fetch lesson:', fetchErr?.message);
        return;
    }

    console.log('Healing Blocks...');
    // Lesson 3568 blocks used 'lesson_title' instead of 'title'.
    // sanitizeBlocks now handles this mapping.
    let cleanBlocks = sanitizeBlocks(lesson.content_blocks) as any[];

    for (let b of cleanBlocks) {
        // Handle Video Snippets
        if (b.type === 'video_snippet' && !b.videoUrl) {
            console.log(`🎬 Generating video for: "${b.title}"`);
            const query = b.video_search_query || b.title || 'AI technology';
            const res = await videoService.fetchVideoWaterfall(query, 'Technology', null);
            if (res?.url) {
                b.videoUrl = res.url;
                console.log(`   ✅ Video found: ${res.url}`);
            }
        }

        // Handle Image Blocks (Full Image, Image Text Row, etc)
        if (b.imagePrompt && !b.imageUrl) {
            console.log(`🖼️ Generating image for: "${b.title || b.label || 'Block'}"`);
            const img = await geminiImageService.generateImage(b.imagePrompt, 3568 + (b.order || 0));
            if (img?.url) {
                b.imageUrl = img.url;
                console.log(`   ✅ Image generated: ${img.url}`);
            }
        }

        // Handle Type Cards
        if (b.type === 'type_cards' && b.cards) {
            for (let card of b.cards) {
                if (card.imagePrompt && !card.imageUrl) {
                    console.log(`🖼️ Generating card image: "${card.title}"`);
                    const img = await geminiImageService.generateImage(card.imagePrompt, 3568);
                    if (img?.url) card.imageUrl = img.url;
                }
            }
        }
    }

    console.log('Updating Database...');
    const { error: updateErr } = await supabase
        .from('course_lessons')
        .update({
            content_blocks: cleanBlocks,
            title: 'Designing AI Test Plans', // Explicitly fix title
            thumbnail_url: cleanBlocks.find(b => b.imageUrl)?.imageUrl || null
        })
        .eq('id', 3568);

    if (updateErr) {
        console.error('Update failed:', updateErr.message);
    } else {
        console.log('🚀 Lesson 3568 fully healed and media-filled!');
    }
})();
