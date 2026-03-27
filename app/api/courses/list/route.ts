
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Handle case where Supabase credentials are missing (returns null or similar)
        if (!supabase) {
            console.warn("[API] Supabase client unavailable (missing credentials?)");
            return NextResponse.json({ courses: [] });
        }

        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, title, description, category, difficulty_level')
            .eq('published', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("[API] Course list error:", error);
            // Don't crash the widget if courses fail to load, just return empty
            return NextResponse.json({ courses: [] });
        }

        return NextResponse.json({ courses: courses || [] });
    } catch (err: any) {
        console.error("[API] Failed to fetch courses:", err);
        // Fallback to empty list so frontend doesn't break
        return NextResponse.json({ courses: [] });
    }
}
