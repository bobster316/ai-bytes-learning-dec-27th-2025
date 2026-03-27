
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export interface AdaptiveProfile {
    user_id: string;
    course_id: string;
    estimated_pace: 'slow' | 'moderate' | 'fast' | 'very_fast';
    current_difficulty_level: number;
    strong_concepts: string[];
    weak_concepts: string[];
    learning_style: 'visual' | 'code_heavy' | 'reading' | 'interactive';
    recommended_review_topics: any[];
    recommended_next_topics: any[];
    engagement_score: number;
    completion_predictions: any;
    updated_at: string;
}

export interface LearningAnalytics {
    totalEvents: number;
    events: any[];
    timeRange: {
        start: string;
        end: string;
    };
}

export class AdaptiveLearningEngine {
    private anthropic: Anthropic;

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY!,
        });
    }

    /**
     * Create or update adaptive learning profile for a user
     */
    async updateLearningProfile(
        userId: string,
        courseId: string
    ): Promise<AdaptiveProfile> {
        const supabase = await createClient(true);
        console.log(`🎯 Updating adaptive profile for user ${userId}`);

        // Gather learning analytics
        const analytics = await this.gatherUserAnalytics(userId, courseId);

        // Analyze learning patterns
        const analysis = await this.analyzeLearningPatterns(analytics);

        // Generate recommendations
        const recommendations = await this.generateRecommendations(analysis, courseId);

        // Save or update profile
        const { data: profile, error } = await supabase
            .from("adaptive_learning_profiles")
            .upsert(
                {
                    user_id: userId,
                    course_id: courseId,
                    estimated_pace: analysis.pace,
                    current_difficulty_level: analysis.currentDifficulty,
                    strong_concepts: analysis.strongConcepts,
                    weak_concepts: analysis.weakConcepts,
                    learning_style: analysis.learningStyle,
                    recommended_review_topics: recommendations.reviewTopics,
                    recommended_next_topics: recommendations.nextTopics,
                    engagement_score: analysis.engagementScore,
                    completion_predictions: recommendations.completionPredictions,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id,course_id",
                }
            )
            .select()
            .single();

        if (error) throw error;
        return profile;
    }

    /**
     * Determine if user should skip or review content
     */
    async shouldAdaptProgression(
        userId: string,
        lessonId: string
    ): Promise<any> {
        const supabase = await createClient();
        const { data: analytics } = await supabase
            .from("learning_analytics")
            .select("*")
            .eq("user_id", userId)
            .eq("lesson_id", lessonId)
            .order("created_at", { ascending: false })
            .limit(20);

        // Simple heuristic for performance analysis
        const struggles = analytics?.filter(e => e.event_type === 'struggled_concept').length || 0;
        const mastery = analytics?.filter(e => e.event_type === 'mastered_concept').length || 0;

        if (struggles > 3) {
            return {
                action: "provide_support",
                reason: "Multiple struggles detected in this lesson",
                suggestions: ["Review fundamental definitions", "Try a simpler example"],
                insertRemedialContent: true,
            };
        } else if (mastery > 5) {
            return {
                action: "accelerate",
                reason: "Consistently mastering concepts quickly",
                suggestions: ["Skip basic exercises", "Try the advanced challenge"],
                skipBasicExercises: true,
            };
        }

        return { action: "continue_normal" };
    }

    private async gatherUserAnalytics(
        userId: string,
        courseId: string
    ): Promise<LearningAnalytics> {
        const supabase = await createClient();
        const { data: events } = await supabase
            .from("learning_analytics")
            .select(`
        *,
        lesson:course_lessons (
          title,
          order_index
        )
      `)
            .eq("user_id", userId)
            .eq("course_id", courseId)
            .order("created_at", { ascending: true });

        return {
            totalEvents: events?.length || 0,
            events: events || [],
            timeRange: {
                start: events?.[0]?.created_at || new Date().toISOString(),
                end: events?.[events?.length - 1]?.created_at || new Date().toISOString(),
            },
        };
    }

    private async analyzeLearningPatterns(analytics: LearningAnalytics): Promise<any> {
        const response = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 1000,
            messages: [{
                role: "user",
                content: `Analyze this student's learning patterns: ${JSON.stringify(analytics.events.slice(-20))}. 
        Return JSON with: pace (slow|moderate|fast|very_fast), currentDifficulty (0-1), strongConcepts (array), weakConcepts (array), learningStyle (visual|code_heavy|reading|interactive), engagementScore (0-1).`
            }]
        });

        const content = response.content[0];
        if (content.type === "text") {
            try {
                return JSON.parse(content.text);
            } catch (e) {
                return { pace: 'moderate', currentDifficulty: 0.5, strongConcepts: [], weakConcepts: [], learningStyle: 'interactive', engagementScore: 0.5 };
            }
        }
        throw new Error("Invalid analysis response");
    }

    private async generateRecommendations(analysis: any, courseId: string): Promise<any> {
        // Simplified recommendations for MVP
        return {
            reviewTopics: analysis.weakConcepts.map((c: string) => ({ concept: c, priority: 'medium' })),
            nextTopics: [],
            completionPredictions: { confidence: 0.8 },
            actionItems: []
        };
    }
}
