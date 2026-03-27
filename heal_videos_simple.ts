
import { createClient } from '@supabase/supabase-js';

const PEXELS_API_KEY = "3CfrxPRVIkwiWjG4G3txP60R3d3MbmLLPiW1Gs6vWWbbIdgR7MQyeiKA";
const SUPABASE_URL = "https://aysqedgkpdbcbubadrrr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c3FlZGdrcGRiY2J1YmFkcnJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUzOTc5MCwiZXhwIjoyMDc4MTE1NzkwfQ.TLTdqATsMYiSRZM1HziWZ9wYNsPRvfCrYmjg9roP5RM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BANNED = new Set(['artificial', 'intelligence', 'neural', 'algorithm', 'system', 'process', 'concept', 'learning', 'abstract', 'visual', 'image', 'picture', 'scene', 'footage', 'background']);

function sanitiseQuery(query: string): string {
    let sanitized = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const words = sanitized.split(/\s+/).filter(w => w.length > 2 && !BANNED.has(w));
    let result = words.slice(0, 4).join(' ').trim();
    if (result.includes('tech') || result.includes('computer') || result.includes('server') || result.includes('code') || result.includes('data')) {
        result += ' bright';
    }
    return result || 'bright technology laboratory';
}

async function searchPexels(query: string) {
    const cleanQuery = sanitiseQuery(query);
    console.log(`Searching Pexels for: "${cleanQuery}"`);
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(cleanQuery)}&per_page=15&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (data.videos && data.videos.length > 0) {
        // Skip known "dark/cicada" IDs if they appear
        const BAD_IDS = ['9984805']; 
        
        for (const video of data.videos) {
             if (BAD_IDS.includes(video.id.toString())) continue;
             const hdFile = video.video_files.find((f: any) => f.quality === 'hd' && f.width >= 1280);
             if (hdFile) return hdFile.link;
        }
        return data.videos[0].video_files[0].link;
    }
    return null;
}

async function heal(lessonId: string) {
    console.log(`Healing Lesson ${lessonId}...`);
    const { data: lesson } = await supabase.from('course_lessons').select('*').eq('id', lessonId).single();
    if (!lesson) return;

    const blocks = lesson.content_blocks as any[];
    let updated = false;

    for (const b of blocks) {
        if ((b.type === 'video_snippet' || b.blockType === 'video_snippet')) {
            console.log(`Processing block ${b.id}...`);
            // Prioritize video_search_query
            const rawQuery = b.video_search_query || b.videoPrompt || b.title || lesson.title;
            const videoUrl = await searchPexels(rawQuery);
            if (videoUrl) {
                b.videoUrl = videoUrl;
                updated = true;
                console.log(`✅ Fixed: ${videoUrl}`);
            }
        }
    }

    if (updated) {
        await supabase.from('course_lessons').update({ content_blocks: blocks }).eq('id', lessonId);
        console.log("Lesson updated successfully.");
    }
}

heal('3567');
