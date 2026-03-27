
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AITutorService } from "@/lib/services/ai-tutor-service";

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { courseId, lessonId, question, conversationHistory } = body;

        // Validate input
        if (!courseId || !question) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Initialize tutor service
        const tutorService = new AITutorService();

        // Get answer
        const response = await tutorService.answerQuestion({
            courseId,
            userId: user.id,
            lessonId,
            question,
            conversationHistory,
        });

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("[API] Tutor API error:", error);
        return NextResponse.json(
            { error: "Failed to process question", details: error.message },
            { status: 500 }
        );
    }
}
