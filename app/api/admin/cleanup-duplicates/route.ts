import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use Service Role Key to bypass RLS for cleanup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('[Cleanup] Initializing with:', {
    url: supabaseUrl,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});

const supabase = createClient(supabaseUrl, supabaseKey);

function getMediaId(url: string) {
    if (!url) return 'missing';
    if (url.includes('pexels.com')) {
        const match = url.match(/\/photos\/(\d+)\//);
        if (match) return match[1];
    }
    if (url.includes('unsplash.com')) {
        const match = url.match(/photo-([a-zA-Z0-9-]+)/);
        if (match) return match[1];
    }
    return url.split('?')[0];
}

export async function GET() {
    try {
        const { data: courses, error } = await supabase.from('courses').select('id, title, image_url');

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const idMap: Record<string, any> = {};
        const duplicates: any[] = [];
        const updates: any[] = [];

        courses?.forEach(c => {
            if (!c.image_url) return;
            const mediaId = getMediaId(c.image_url);

            if (idMap[mediaId]) {
                const keep = idMap[mediaId];
                console.log(`Duplicate found: ${c.title} shares image with ${keep.title}`);
                duplicates.push({ duplicate: c, keep });
            } else {
                idMap[mediaId] = c;
            }
        });

        for (const d of duplicates) {
            // Generate unique replacement
            const seed = Math.floor(Math.random() * 10000000);
            const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(d.duplicate.title)}%20abstract%20technology?width=1280&height=720&nologo=true&seed=${seed}`;

            await supabase.from('courses').update({ image_url: newUrl }).eq('id', d.duplicate.id);
            updates.push({ id: d.duplicate.id, old: d.duplicate.image_url, new: newUrl });
        }

        return NextResponse.json({
            success: true,
            fixed_count: updates.length,
            updates
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
