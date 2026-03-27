
import { createClient } from "@/lib/supabase/server";

export class GamificationService {
    private readonly XP_MAP = {
        LESSON_COMPLETE: 100,
        QUIZ_PASSED: 50,
        FLASHCARD_REVIEW: 10,
        CORRECT_ANSWER: 5,
        STREAK_7_DAYS: 250,
    };

    /**
     * Award XP to a user
     */
    async awardXP(userId: string, amount: number, reason: string): Promise<any> {
        const supabase = await createClient(true);

        let { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (!profile) {
            const { data: newProfile } = await supabase
                .from("user_profiles")
                .insert({ user_id: userId, total_xp: 0, current_level: 1 })
                .select()
                .single();
            profile = newProfile;
        }

        const newTotalXP = (profile?.total_xp || 0) + amount;
        const newLevel = this.calculateLevel(newTotalXP);
        const leveledUp = newLevel > (profile?.current_level || 1);

        const { data: updated } = await supabase
            .from("user_profiles")
            .update({
                total_xp: newTotalXP,
                current_level: newLevel,
                updated_at: new Date().toISOString()
            })
            .eq("user_id", userId)
            .select()
            .single();

        // Log XP event
        await supabase.from("learning_analytics").insert({
            user_id: userId,
            event_type: "xp_awarded",
            event_data: { amount, reason, leveledUp, newLevel }
        });

        return { profile: updated, leveledUp };
    }

    /**
     * Update user streak
     */
    async updateStreak(userId: string): Promise<number> {
        const supabase = await createClient(true);
        const today = new Date().toISOString().split('T')[0];

        const { data: profile } = await supabase
            .from("user_profiles")
            .select("last_activity_date, current_streak, longest_streak")
            .eq("user_id", userId)
            .single();

        if (!profile) return 0;

        let newStreak = profile.current_streak;
        const lastDate = profile.last_activity_date;

        if (!lastDate) {
            newStreak = 1;
        } else {
            const diff = Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24));
            if (diff === 1) newStreak += 1;
            else if (diff > 1) newStreak = 1;
        }

        await supabase
            .from("user_profiles")
            .update({
                current_streak: newStreak,
                longest_streak: Math.max(newStreak, profile.longest_streak || 0),
                last_activity_date: today
            })
            .eq("user_id", userId);

        return newStreak;
    }

    private calculateLevel(xp: number): number {
        // Basic level formula: Level = floor(sqrt(xp / 100)) + 1
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }
}
