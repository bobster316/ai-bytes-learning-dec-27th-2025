
import { createClient } from '@supabase/supabase-js';

const PEXELS_API_KEY = "3CfrxPRVIkwiWjG4G3txP60R3d3MbmLLPiW1Gs6vWWbbIdgR7MQyeiKA";
const SUPABASE_URL = "https://aysqedgkpdbcbubadrrr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c3FlZGdrcGRiY2J1YmFkcnJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUzOTc5MCwiZXhwIjoyMDc4MTE1NzkwfQ.TLTdqATsMYiSRZM1HziWZ9wYNsPRvfCrYmjg9roP5RM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchPexels(query: string) {
    console.log(`Searching Pexels for: "${query}"`);
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (data.videos && data.videos.length > 0) {
        const hdFile = data.videos[0].video_files.find((f: any) => f.quality === 'hd' && f.width >= 1280);
        return hdFile ? hdFile.link : data.videos[0].video_files[0].link;
    }
    return null;
}

async function heal(lessonId: string) {
    console.log(`Healing Lesson ${lessonId}...`);
    const { data: lesson } = await supabase.from('course_lessons').select('*').eq('id', lessonId).single();
    if (!lesson) return;

    let blocks = lesson.content_blocks as any[];
    let updated = false;

    // Direct Mapping for FLEX/V3 Schemas in the script
    const TYPE_MAP: Record<string, string> = {
        'HERO VIDEO':        'video_snippet',
        'SECONDARY VIDEO':   'video_snippet',
        'FLEX-1':           'image_text_row',
        'FLEX-2':           'type_cards',
        'FLEX-3':           'instructor_insight',
        'FLEX-4':           'image_text_row',
        'FLEX-5':           'text',
        'FLEX-6':           'full_image',
        'FLEX-7':           'type_cards',
        'FLEX-8':           'applied_case',
        'full_image_section': 'full_image'
    };

    const finalBlocks = blocks.map(b => {
        let type = (b.type || b.blockType || 'text') as string;
        if (TYPE_MAP[type]) type = TYPE_MAP[type];

        let repaired = { ...b, type };

        // Nested Content Extraction
        if (b.content && typeof b.content === 'object' && !Array.isArray(b.content)) {
            Object.assign(repaired, b.content);
        }

        // Title/Description mapping for lesson_header
        if (type === 'lesson_header') {
            if (!repaired.title && repaired.lesson_title) repaired.title = repaired.lesson_title;
            if (!repaired.description && repaired.microObjective) repaired.description = repaired.microObjective;
        }

        return repaired;
    });

    for (let i = 0; i < finalBlocks.length; i++) {
        let b = finalBlocks[i];
        // Fix Videos
        if (b.type === 'video_snippet' && !b.videoUrl) {
            const query = b.video_search_query || b.title || 'AI technology';
            const videoUrl = await searchPexels(query);
            if (videoUrl) {
                b.videoUrl = videoUrl;
                updated = true;
                console.log(`✅ Video fixed for ${b.title}: ${videoUrl}`);
            }
        }
        // Fix Images (Basic fallback for existing broken blocks)
        if (b.imagePrompt && !b.imageUrl) {
             console.log(`🖼️ Generating image for block ${i}...`);
             const img = await geminiImageService.generateImage(b.imagePrompt, parseInt(lessonId) + i);
             if (img?.url) {
                b.imageUrl = img.url;
                updated = true;
             }
        }
        // Fix Type Cards
        if (b.type === 'type_cards' && b.cards) {
            for (let j = 0; j < b.cards.length; j++) {
                let card = b.cards[j];
                if (card.imagePrompt && !card.imageUrl) {
                    console.log(`🖼️ Generating card image: "${card.title}" (index ${j})`);
                    const img = await geminiImageService.generateImage(card.imagePrompt, parseInt(lessonId) + i * 10 + j);
                    if (img?.url) {
                        card.imageUrl = img.url;
                        updated = true;
                    }
                }
            }
        }
    }

    if (true) { // Always update to fix types/metadata
        await supabase.from('course_lessons').update({ 
            content_blocks: finalBlocks,
            title: 'Designing AI Test Plans' 
        }).eq('id', lessonId);
        console.log("Lesson updated successfully.");
    }
}

heal('3568');
