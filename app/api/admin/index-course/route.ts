
import { NextRequest, NextResponse } from "next/server";
import { CourseIndexer } from "@/lib/services/course-indexer";

export async function POST(request: NextRequest) {
    try {
        const { courseId } = await request.json();

        if (!courseId) {
            return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
        }

        const indexer = new CourseIndexer();
        await indexer.indexCourse(courseId);

        return NextResponse.json({ success: true, message: "Course indexed successfully" });
    } catch (error: any) {
        console.error("[API] Course indexing failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
