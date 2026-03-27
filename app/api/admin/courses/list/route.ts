
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
            .select('id, title, category, difficulty_level, price, published, thumbnail_url, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error) {
            console.error("[API] Admin course list error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`[API DEBUG] Fetched ${courses?.length} courses.`);
        return NextResponse.json({ courses: courses || [] });
    } catch (err: any) {
        console.error("[API] Failed to fetch admin courses:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
