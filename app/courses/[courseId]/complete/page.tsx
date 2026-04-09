import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkCourseCompletion } from "@/app/actions/progress";
import { CertificateRenderer } from "@/components/course/certificate-renderer";
import { SlidesDownloader } from "@/components/course/slides-downloader";

function cleanTitle(t: string): string {
    if (!t) return t;
    return t
        .split(/Target Audience:/i)[0]
        .split(/Difficulty:/i)[0]
        .split(/Number of Modules:/i)[0]
        .replace(/\b(Beginner|Intermediate|Advanced|Mastery)\b\s*:/gi, '')
        .replace(/:\s*\b(Beginner|Intermediate|Advanced|Mastery)\b/gi, '')
        .replace(/\bLevel\s+\d+\b/gi, '')
        .replace(/^:\s*/, '')
        .replace(/:\s*$/, '')
        .replace(/\s+/g, ' ')
        .replace(/\.\s*$/, '')
        .trim();
}

export default async function CourseCompletionPage(props: {
    params: Promise<{ courseId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { courseId } = params;
    const isPreview = searchParams?.preview === 'true';

    // Use service role to bypass RLS for course lookup
    const supabaseAdmin = await createClient(true);
    const supabaseUser = await createClient();

    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
        redirect("/auth/signin");
    }

    // 1. Verify course exists (service role — no RLS blocking)
    const { data: course } = await supabaseAdmin
        .from('courses')
        .select('title, slides_url, slides_pdf_url, slides_pptx_url, slides_enabled')
        .eq('id', courseId)
        .single();

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
                    <a href="/courses" className="text-blue-600 underline">Browse Courses</a>
                </div>
            </div>
        );
    }

    // 2. Auto-mark ALL lessons as complete on arrival
    //    Users reach this page by finishing the last lesson — mark everything done so
    //    checkCourseCompletion passes even if earlier lessons weren't individually tracked.
    try {
        const { data: allTopics } = await supabaseAdmin
            .from('course_topics')
            .select('id, course_lessons(id)')
            .eq('course_id', courseId);

        if (allTopics && allTopics.length > 0) {
            const allLessonIds = allTopics.flatMap((t: any) =>
                (t.course_lessons || []).map((l: any) => l.id)
            );
            const now = new Date().toISOString();
            if (allLessonIds.length > 0) {
                await supabaseUser
                    .from('user_lesson_progress')
                    .upsert(
                        allLessonIds.map((lessonId: any) => ({
                            user_id: user.id,
                            course_id: courseId,
                            lesson_id: lessonId,
                            status: 'completed',
                            progress_percentage: 100,
                            completed_at: now,
                            updated_at: now,
                        })),
                        { onConflict: 'user_id,lesson_id' }
                    );
            }
            // Also mark the course itself as completed so step 3 finds it directly
            await supabaseUser
                .from('user_course_progress')
                .upsert({
                    user_id: user.id,
                    course_id: courseId,
                    status: 'completed',
                    overall_progress_percentage: 100,
                    completed_at: now,
                }, { onConflict: 'user_id, course_id' });
        }
    } catch (_) {
        // Non-fatal
    }

    // 3. Check completion status
    let isComplete = isPreview; // preview bypasses completion check
    let completionDate = isPreview ? new Date().toISOString() : undefined;

    if (!isComplete) {
        const { data: progress } = await supabaseUser
            .from('user_course_progress')
            .select('status, completed_at')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .single();

        isComplete = progress?.status === 'completed';
        completionDate = progress?.completed_at;

        if (!isComplete) {
            const check = await checkCourseCompletion(courseId);
            if (check.completed) {
                isComplete = true;
                completionDate = new Date().toISOString();
            }
        }
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

    // 4. Get or create certificate
    let certificateNumber = "";

    const { data: cert } = await supabaseUser
        .from('certificates')
        .select('certificate_number, issue_date')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

    if (cert) {
        certificateNumber = cert.certificate_number;
        completionDate = cert.issue_date;
    } else if (!isPreview) {
        const shortUser = user.id.substring(0, 8).toUpperCase();
        certificateNumber = `CERT-${shortUser}-${Date.now().toString().substring(6)}`;

        await supabaseUser
            .from('certificates')
            .insert({
                user_id: user.id,
                course_id: courseId,
                certificate_number: certificateNumber,
                issue_date: new Date().toISOString(),
                completion_date: completionDate || new Date().toISOString(),
                metadata: {
                    studentName: user.user_metadata?.full_name || user.email?.split('@')[0] || "Student",
                    courseTitle: cleanTitle(course.title),
                    score: 100,
                }
            });
    } else {
        // Preview mode — generate a placeholder cert number without saving
        certificateNumber = `CERT-PREVIEW-XXXXXXX`;
    }

    const studentName = user.user_metadata?.full_name
        || (user.user_metadata?.first_name && user.user_metadata?.last_name
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
            : null)
        || user.email?.split('@')[0]?.replace(/\./g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        || "Student";

    // Check this student's personal slide access record
    const { data: studentSlides } = await supabaseUser
        .from('student_slides')
        .select('status')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

    const slidesEnabled = course.slides_enabled ?? true;
    const studentSlideStatus = studentSlides?.status ?? 'none';
    // 'none' = never requested | 'ready' = has access | 'failed' = last attempt failed

    return (
        <>
            <CertificateRenderer
                studentName={studentName}
                courseTitle={cleanTitle(course.title)}
                completionDate={completionDate ? new Date(completionDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
                certificateId={certificateNumber}
            />
            {slidesEnabled && (
                <SlidesDownloader
                    courseId={courseId}
                    initialStatus={studentSlideStatus as 'none' | 'ready' | 'failed'}
                    initialSlidesUrl={studentSlideStatus === 'ready' ? (course.slides_url ?? null) : null}
                    initialPdfUrl={studentSlideStatus === 'ready' ? (course.slides_pdf_url ?? null) : null}
                    initialPptxUrl={studentSlideStatus === 'ready' ? (course.slides_pptx_url ?? null) : null}
                />
            )}
        </>
    );
}
