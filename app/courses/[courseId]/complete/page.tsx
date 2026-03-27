import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { checkCourseCompletion } from "@/app/actions/progress";
import { CertificateRenderer } from "@/components/course/certificate-renderer";

export default async function CourseCompletionPage(props: {
    params: Promise<{ courseId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await props.params;
    const { courseId } = params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 1. Verify Course Exists
    const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();

    if (!course) notFound();

    // 2. Check if completion is recorded
    const { data: progress } = await supabase
        .from('user_course_progress')
        .select('status, completed_at')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

    let isComplete = progress?.status === 'completed';
    let completionDate = progress?.completed_at;

    // 3. Last check (in case they navigated here directly but DB isn't updated)
    if (!isComplete) {
        const check = await checkCourseCompletion(courseId);
        if (check.completed) {
            isComplete = true;
            completionDate = new Date().toISOString();
        } else {
            // Redirect back to course if not complete
            // redirect(`/courses/${courseId}`);
            // OR show "Not Complete" message for debugging
        }
    }

    // ALLOW PREVIEW FOR USER REQUEST
    const searchParams = await props.searchParams; // Next.js 15+ prop
    if (searchParams?.preview === 'true') {
        isComplete = true;
        completionDate = new Date().toISOString();
    }

    if (!isComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Course Not Completed</h1>
                    <p className="mb-4">You have not finished all the modules and quizzes yet.</p>
                    <a href={`/courses/${courseId}`} className="text-blue-600 underline">Return to Course</a>
                </div>
            </div>
        );
    }

    // 4. Get or Create Certificate Record
    let certificateNumber = "";

    // Check existing
    const { data: cert } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

    if (cert) {
        certificateNumber = cert.certificate_number;
        completionDate = cert.issue_date; // Use issued date
    } else {
        // Create new certificate
        // Generate a simple ID: COURSE-USER-TIMESTAMP
        const shortUser = user.id.substring(0, 8).toUpperCase();
        certificateNumber = `CERT-${shortUser}-${Date.now().toString().substring(6)}`;

        await supabase
            .from('certificates')
            .insert({
                user_id: user.id,
                course_id: courseId,
                certificate_number: certificateNumber,
                issue_date: new Date().toISOString(),
                completion_date: completionDate || new Date().toISOString(),
                metadata: {
                    studentName: user.user_metadata?.full_name || user.email?.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || "Student",
                    courseTitle: course.title,
                    score: 100 // Defaulting to 100 for completion-based for now
                }
            });
    }

    return (
        <CertificateRenderer
            studentName={user.email?.split('@')[0] || "Student"} // Use metadata if available, fallback to email
            courseTitle={course.title}
            completionDate={completionDate ? new Date(completionDate).toLocaleDateString() : new Date().toLocaleDateString()}
            certificateId={certificateNumber}
        />
    );
}
