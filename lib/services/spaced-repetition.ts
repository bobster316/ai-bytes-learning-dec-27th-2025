
import { createClient } from "@/lib/supabase/server";

export interface ReviewResult {
    quality: number; // 0-5 rating
    responseTime: number; // milliseconds
}

export class SpacedRepetitionService {
    /**
     * Get cards due for review
     */
    async getDueCards(userId: string, limit: number = 20): Promise<any[]> {
        const supabase = await createClient(true);
        const now = new Date().toISOString();

        const { data: dueCards } = await supabase
            .from("user_card_progress")
            .select(`
        *,
        flashcard:flashcards (
          *
        )
      `)
            .eq("user_id", userId)
            .lte("next_review_at", now)
            .order("next_review_at", { ascending: true })
            .limit(limit);

        return dueCards || [];
    }

    /**
     * Process a card review using SM-2 algorithm
     */
    async processReview(
        userId: string,
        flashcardId: string,
        result: ReviewResult
    ): Promise<any> {
        const supabase = await createClient(true);

        // Get current progress
        let { data: progress } = await supabase
            .from("user_card_progress")
            .select("*")
            .eq("user_id", userId)
            .eq("flashcard_id", flashcardId)
            .maybeSingle();

        if (!progress) {
            // First time seeing this card
            progress = {
                ease_factor: 2.5,
                interval: 0,
                repetitions: 0,
                status: 'new'
            };
        }

        const nextSchedule = this.calculateSM2(
            progress.ease_factor,
            progress.interval,
            progress.repetitions,
            result.quality
        );

        const updateData = {
            user_id: userId,
            flashcard_id: flashcardId,
            ease_factor: nextSchedule.easeFactor,
            interval: nextSchedule.interval,
            repetitions: nextSchedule.repetitions,
            last_reviewed_at: new Date().toISOString(),
            next_review_at: nextSchedule.nextReviewAt.toISOString(),
            total_reviews: (progress.total_reviews || 0) + 1,
            correct_reviews: (progress.correct_reviews || 0) + (result.quality >= 3 ? 1 : 0),
            last_quality: result.quality,
            status: nextSchedule.repetitions >= 4 ? 'review' : 'learning',
            updated_at: new Date().toISOString()
        };

        const { data: updated } = await supabase
            .from("user_card_progress")
            .upsert(updateData, { onConflict: 'user_id,flashcard_id' })
            .select()
            .single();

        return updated;
    }

    /**
     * SM-2 Algorithm
     */
    private calculateSM2(
        easeFactor: number,
        interval: number,
        repetitions: number,
        quality: number
    ) {
        let nextInterval: number;
        let nextEaseFactor: number;
        let nextRepetitions: number;

        if (quality >= 3) {
            if (repetitions === 0) {
                nextInterval = 1;
            } else if (repetitions === 1) {
                nextInterval = 6;
            } else {
                nextInterval = Math.round(interval * easeFactor);
            }
            nextRepetitions = repetitions + 1;
            nextEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        } else {
            nextRepetitions = 0;
            nextInterval = 1;
            nextEaseFactor = easeFactor;
        }

        if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;

        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval);

        return {
            easeFactor: nextEaseFactor,
            interval: nextInterval,
            repetitions: nextRepetitions,
            nextReviewAt
        };
    }
}
