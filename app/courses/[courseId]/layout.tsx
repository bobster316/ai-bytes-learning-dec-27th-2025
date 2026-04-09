// app/courses/[courseId]/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { getCourseDNARender } from "@/lib/ai/generate-course-dna";
import { CourseDNAProvider } from "@/components/course/course-dna-provider";
import { CourseBackground } from "@/components/course/course-background";

export default async function CourseLayout({
    params,
    children,
}: {
    params: Promise<{ courseId: string }>;
    children: React.ReactNode;
}) {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: course } = await supabase
        .from("courses")
        .select("course_dna")
        .eq("id", courseId)
        .single();

    const render = getCourseDNARender(course?.course_dna);

    return (
        <CourseDNAProvider render={render}>
            <CourseBackground />
            {children}
        </CourseDNAProvider>
    );
}
