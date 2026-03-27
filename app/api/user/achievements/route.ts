
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GamificationService } from "@/lib/services/gamification";

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const supabase = await createClient(true);

        // Fetch profile
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        // Fetch badges
        const { data: badges } = await supabase
            .from("user_badges")
            .select("*, badges(*)")
            .eq("user_id", userId);

        return NextResponse.json({
            profile,
            badges: badges || []
        });
    } catch (error: any) {
        console.error("[API] Failed to fetch achievements:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
