import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LessonContentRenderer from "@/components/course/lesson-content-renderer";
import { LessonSidebar } from "@/components/course/lesson-sidebar";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function LessonPage(props: { params: Promise<{ courseId: string; lessonId: string }> }) {
    const params = await props.params;
    const { courseId, lessonId } = params;
    const supabase = await createClient();

    // Fetch Lesson with Topic and Course info
    const { data: lesson, error } = await supabase
        .from('course_lessons')
        .select(`
      *,
      topic:course_topics(
        id,
        title,
        course:courses(
            id,
            title
        )
      )
    `)
        .eq('id', lessonId)
        .single();

    if (error || !lesson) {
        notFound();
    }

    // Fetch Full Course Outline for Sidebar
    const { data: courseOutline } = await supabase
        .from('courses')
        .select(`
            title,
            topics:course_topics(
                id,
                title,
                order_index,
                lessons:course_lessons(
                    id,
                    title,
                    order_index
                ),
                quizzes:course_quizzes(
                    id,
                    title
                )
            )
        `)
        .eq('id', courseId)
        .single();

    // Sort outline
    if (courseOutline && courseOutline.topics) {
        courseOutline.topics.sort((a, b) => a.order_index - b.order_index);
        courseOutline.topics.forEach(t => {
            if (t.lessons) t.lessons.sort((a, b) => a.order_index - b.order_index);
        });
    }

    // Fetch Images
    const { data: images } = await supabase
        .from('lesson_images')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

    // Safe JSON Parse
    let contentJson = null;
    try {
        if (lesson.content_markdown && lesson.content_markdown.trim().startsWith('{')) {
            contentJson = JSON.parse(lesson.content_markdown);
            // Inject the video_url from the DB column into the content JSON
            if (lesson.video_url) {
                contentJson.video_url = lesson.video_url;
            }
        }
    } catch (e) {
        // Silent fail, fallback to HTML
    }

    // Determine Render Mode
    const useNativeRender = !!contentJson;
    const htmlContent = lesson.content_html; // valid HTML string

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <div className="container mx-auto max-w-[1600px] flex items-start gap-8">

                {/* Sidebar Navigation */}
                {courseOutline && <LessonSidebar outline={courseOutline} />}

                <main className="flex-1 pb-32 min-w-0">
                    {useNativeRender ? (
                        <div className="w-full">
                            <article>
                                <div className="py-8 space-y-6 border-b border-border/50 mb-12 max-w-[var(--max-content-width)] mx-auto">
                                    <Link
                                        href={`/courses/${courseId}`}
                                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Course Overview
                                    </Link>

                                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-widest">
                                        <span className="text-cyan-500 font-bold">{lesson.topic?.title || 'Module'}</span>
                                        <ChevronRight className="w-3 h-3" />
                                        <span>Lesson {lesson.order_index + 1}</span>
                                    </div>
                                    <h1 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                                        {lesson.title}
                                    </h1>
                                </div>

                                <LessonContentRenderer content={contentJson} images={images || []} />
                            </article>
                        </div>
                    ) : htmlContent ? (
                        <iframe
                            srcDoc={htmlContent}
                            className="w-full h-[calc(100vh-80px)] border-0 bg-white dark:bg-black"
                            title="Lesson Content"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    ) : (
                        <div className="container mx-auto px-4 py-12 text-center">
                            <div className="bg-destructive/10 border border-destructive/50 text-destructive p-8 rounded-2xl inline-block max-w-lg">
                                <h3 className="font-bold mb-2 uppercase tracking-widest">Data Corruption</h3>
                                <p>The neural stream for this lesson could not be established.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
