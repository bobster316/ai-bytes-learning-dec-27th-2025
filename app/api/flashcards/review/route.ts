
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SpacedRepetitionService } from "@/lib/services/spaced-repetition";
import { GamificationService } from "@/lib/services/gamification";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { flashcardId, quality } = await request.json();

        const srService = new SpacedRepetitionService();
        const gamification = new GamificationService();

        // 1. Process SM-2 Review
        const schedule = await srService.processReview(user.id, flashcardId, {
            quality,
            responseTime: 0 // Optional: track this for speed bonuses
        });

        // 2. Award XP
        let xp = 10; // Base review XP
        if (quality >= 3) xp += 10; // Correctness bonus
        if (quality === 5) xp += 10; // Mastery bonus

        await gamification.awardXP(user.id, xp, "Flashcard Review");

        // 3. Update Streak
        await gamification.updateStreak(user.id);

        return NextResponse.json({ success: true, xpAwarded: xp, schedule });
    } catch (error: any) {
        console.error("[API] Flashcard review failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
