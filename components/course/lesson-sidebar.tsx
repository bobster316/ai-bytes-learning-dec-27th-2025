
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { useParams } from "next/navigation";

export function LessonSidebar({
    outline
}: {
    outline: {
        title: string;
        topics: {
            title: string;
            id: string;
            lessons: { id: string; title: string, order_index: number }[];
            quizzes?: { id: string; title: string }[];
        }[]
    }
}) {
    const params = useParams();
    const currentLessonId = params.lessonId as string;

    return (
        <aside className="w-80 h-[calc(100vh-80px)] sticky top-20 border-r border-border bg-background/50 backdrop-blur-xl hidden lg:block overflow-y-auto">
            <div className="p-6">
                <h3 className="font-bold text-lg mb-6 text-foreground tracking-tight">{outline.title}</h3>

                <div className="space-y-8">
                    {outline.topics.map((topic, tIdx) => (
                        <div key={tIdx} className="space-y-4">
                            <div className="pl-4 border-l-2 border-primary/50 py-1">
                                <h4 className="text-xs font-mono font-bold text-primary mb-1">MODULE {tIdx + 1}</h4>
                                <h5 className="text-sm font-bold text-foreground leading-tight">{topic.title}</h5>
                            </div>
                            {/* Lessons List + Quiz */}
                            <div className="space-y-1 pl-4">
                                {topic.lessons.map((lesson, lIdx) => {
                                    const isActive = lesson.id === currentLessonId;
                                    return (
                                        <Link
                                            key={lesson.id}
                                            href={`/courses/${params.courseId}/lessons/${lesson.id}`}
                                            prefetch={true}
                                            className={cn(
                                                "flex items-start gap-3 p-3 rounded-xl transition-all text-sm group",
                                                isActive
                                                    ? "bg-primary/10 text-primary font-medium"
                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            <div className="mt-0.5">
                                                {isActive ? (
                                                    <Circle className="w-4 h-4 fill-primary text-primary" />
                                                ) : (
                                                    <Circle className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                                                )}
                                            </div>
                                            <span className="leading-relaxed">{lesson.title}</span>
                                        </Link>
                                    );
                                })}

                                {topic.quizzes && topic.quizzes.length > 0 && (
                                    <Link
                                        key={`quiz-${topic.id}`}
                                        href={`/courses/${params.courseId}/topics/${topic.id}/quiz/${topic.quizzes[0].id}`}
                                        className={cn(
                                            "flex items-start gap-3 p-3 rounded-xl transition-all text-sm group",
                                            "text-muted-foreground hover:bg-cyan-500/10 hover:text-cyan-600 mt-2 border border-dashed border-border hover:border-cyan-200"
                                        )}
                                    >
                                        <div className="mt-0.5">
                                            <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                                        </div>
                                        <span className="leading-relaxed font-medium">Topic Assessment</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
