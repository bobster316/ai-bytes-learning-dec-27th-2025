
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient(true);

        // Fetch all lessons with quality data
        const { data: lessons, error } = await supabase
            .from("course_lessons")
            .select("id, title, quality_score, quality_breakdown")
            .order("created_at", { ascending: false });

        if (error) throw error;

        const reports = lessons.map(l => ({
            lessonId: l.id,
            lessonTitle: l.title,
            overallScore: (l.quality_score || 0) / 100,
            passed: (l.quality_score || 0) >= 85,
            recommendations: l.quality_breakdown?.recommendations || [],
            checks: l.quality_breakdown?.checks || []
        }));

        const stats = {
            totalLessons: reports.length,
            passedLessons: reports.filter(r => r.passed).length,
            failedLessons: reports.filter(r => !r.passed && r.overallScore > 0).length,
            warningLessons: reports.filter(r => r.overallScore > 0 && r.overallScore < 0.85).length,
            averageScore: reports.length > 0 ? reports.reduce((a, b) => a + b.overallScore, 0) / reports.length : 0
        };

        return NextResponse.json({ reports, stats });
    } catch (error: any) {
        console.error("[API] Failed to fetch quality reports:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
