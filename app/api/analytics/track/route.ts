
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId, lessonId, eventType, eventData } = await request.json();

        const { error } = await supabase.from("learning_analytics").insert({
            user_id: user.id,
            course_id: courseId,
            lesson_id: lessonId,
            event_type: eventType,
            event_data: eventData || {},
            created_at: new Date().toISOString(),
        });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[API] Analytics tracking failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
