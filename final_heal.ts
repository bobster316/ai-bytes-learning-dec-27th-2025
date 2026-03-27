
import { createClient } from '@supabase/supabase-js';

const PEXELS_API_KEY = "3CfrxPRVIkwiWjG4G3txP60R3d3MbmLLPiW1Gs6vWWbbIdgR7MQyeiKA";
const SUPABASE_URL = "https://aysqedgkpdbcbubadrrr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c3FlZGdrcGRiY2J1YmFkcnJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUzOTc5MCwiZXhwIjoyMDc4MTE1NzkwfQ.TLTdqATsMYiSRZM1HziWZ9wYNsPRvfCrYmjg9roP5RM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generateImage(prompt: string, seed: number) {
    console.log(`Picking unique Pexels image for seed ${seed}...`);
    const cleanQuery = prompt.split(' ').slice(0, 3).join(' ') + ' tech';
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery)}&per_page=20`;
    const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (data.photos && data.photos.length > 0) {
        const photo = data.photos[seed % data.photos.length];
        return photo.src.large2x;
    }
    return null;
}

async function heal(lessonId: string) {
    console.log(`Final Healing for Lesson ${lessonId}...`);
    const { data: lesson } = await supabase.from('course_lessons').select('*').eq('id', lessonId).single();
    if (!lesson) return;

    let blocks = lesson.content_blocks as any[];
    let updated = false;

    for (let i = 0; i < blocks.length; i++) {
        let b = blocks[i];
        const blockSeed = parseInt(lessonId) * 1000 + i * 10;

        // Fix Key Terms
        if (b.type === 'key_terms' && Array.isArray(b.terms)) {
            console.log("Fixing Key Terms structure...");
            b.terms = b.terms.map((t: any) => 
                typeof t === 'string' ? { term: t, definition: 'A critical technical concept within the AI test plan framework.' } : t
            );
            updated = true;
        }

        // Fix Type Cards (Unique Images)
        if (b.type === 'type_cards' && b.cards) {
            for (let j = 0; j < b.cards.length; j++) {
                let card = b.cards[j];
                const cardSeed = blockSeed + j;
                const url = await generateImage(card.imagePrompt || card.title, cardSeed);
                if (url) {
                    card.imageUrl = url;
                    updated = true;
                }
            }
        }

        // Regular Image Blocks
        if (b.imagePrompt) {
            const url = await generateImage(b.imagePrompt, blockSeed);
            if (url) {
                b.imageUrl = url;
                updated = true;
            }
        }
    }

    if (updated) {
        await supabase.from('course_lessons').update({ content_blocks: blocks }).eq('id', lessonId);
        console.log(`Lesson ${lessonId} successfully healed.`);
    }
}

heal('3568');
heal('3567');
