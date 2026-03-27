import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { imageService } from "@/lib/ai/image-service";

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Fetch all courses
        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, title, description');

        if (error) throw error;
        if (!courses || courses.length === 0) {
            return NextResponse.json({ message: 'No courses found' });
        }

        const results = [];

        // 2. Update each course
        for (const course of courses) {
            try {
                console.log(`Updating thumbnail for course: ${course.title}`);
                const newThumbnail = await imageService.fetchCourseThumbnail(course.title, course.description);

                if (newThumbnail) {
                    const { error: updateError } = await supabase
                        .from('courses')
                        .update({ thumbnail_url: newThumbnail })
                        .eq('id', course.id);

                    if (updateError) throw updateError;
                    results.push({ id: course.id, title: course.title, status: 'updated', url: newThumbnail });
                } else {
                    results.push({ id: course.id, title: course.title, status: 'failed_generation' });
                }
            } catch (innerError: any) {
                console.error(`Error updating course ${course.id}:`, innerError);
                results.push({ id: course.id, title: course.title, status: 'error', message: innerError.message });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
