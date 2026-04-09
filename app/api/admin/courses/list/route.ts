
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("[API DEBUG] Starting Admin Course List fetch...");
    try {
        console.log("[API DEBUG] Creating Service Role Client...");
        console.log("[API DEBUG] Service Role Client requested.");
        const supabase = await createClient(true);
        console.log("[API DEBUG] Client created. Fetching courses...");


        const { data: courses, error } = await supabase
            .from('courses')
            .select(`
                id, title, category, difficulty_level, price, published, thumbnail_url, slides_url, slides_pdf_url, slides_pptx_url, slides_enabled, created_at, updated_at,
                course_topics(id, audio_url)
            `)
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error) {
            console.error("[API] Admin course list error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Compute audio status per course so the admin UI can drive menu states
        const enriched = (courses || []).map((c: any) => {
            const topics: any[] = c.course_topics || [];
            const totalModules = topics.length;
            const modulesWithAudio = topics.filter((t: any) => !!t.audio_url).length;
            const { course_topics: _, ...rest } = c;
            return { ...rest, totalModules, modulesWithAudio };
        });

        console.log(`[API DEBUG] Fetched ${enriched.length} courses.`);
        return NextResponse.json({ courses: enriched });
    } catch (err: any) {
        console.error("[API] Failed to fetch admin courses:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
