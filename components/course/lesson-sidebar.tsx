
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { useParams } from "next/navigation";

export function LessonSidebar({
    outline,
    completedQuizzes = {},
    isFreePreview = false
}: {
    outline: {
        title: string;
        topics: {
            title: string;
            id: string;
            lessons: { id: string; title: string, order_index: number }[];
            quizzes?: { id: string; title: string }[];
        }[]
    };
    completedQuizzes?: Record<string, boolean>; // map of quizId -> boolean
    isFreePreview?: boolean;
}) {
    const params = useParams();
    const currentLessonId = params.lessonId as string;
    let globalLessonIndex = 0;

    // NOTE: No outer <aside> wrapper here — page.tsx provides the 320px sticky container.
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 className="font-bold text-sm text-white/90 tracking-tight leading-snug">{outline.title}</h3>
                {isFreePreview && (
                    <span className="bg-amber-400/15 text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-wide shrink-0 ml-2">Free</span>
                )}
            </div>

            <div className="space-y-6 overflow-y-auto scrollbar-hide flex-1">
                {outline.topics.map((topic, tIdx) => (
                    <div key={tIdx} className="space-y-2">
                        <div className="pl-3 border-l-2 border-[#00FFB3]/50 py-1 mb-3">
                            <div className="text-[9px] font-mono font-bold text-[#00FFB3] mb-0.5 uppercase tracking-widest">MODULE {tIdx + 1}</div>
                            <div className="text-[11px] font-bold text-white/80 leading-tight">{topic.title}</div>
                        </div>
                        {/* Lessons List + Quiz */}
                        <div className="space-y-0.5 pl-2">
                            {topic.lessons.map((lesson, lIdx) => {
                                const isActive = String(lesson.id) === String(currentLessonId);
                                const isLocked = isFreePreview && globalLessonIndex >= 3;
                                globalLessonIndex++;

                                if (isLocked) {
                                    return (
                                        <Link
                                            key={lesson.id}
                                            href="/pricing"
                                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] text-white/30 hover:text-amber-400/70 transition-all border-l-2 border-transparent group cursor-pointer"
                                        >
                                            <Lock className="w-3 h-3 shrink-0 text-white/20 group-hover:text-amber-400/50" />
                                            <span className="leading-relaxed truncate">{lesson.title}</span>
                                        </Link>
                                    );
                                }

                                return (
                                    <Link
                                        key={lesson.id}
                                        href={`/courses/${params.courseId}/lessons/${lesson.id}`}
                                        prefetch={true}
                                        className={cn(
                                            "flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-all text-[11px] group relative",
                                            isActive
                                                ? "bg-[#00FFB3]/15 text-[#00FFB3] font-semibold border-l-2 border-[#00FFB3]"
                                                : "text-white/40 hover:bg-white/5 hover:text-white/70 border-l-2 border-transparent"
                                        )}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {isActive ? (
                                                <Circle className="w-3 h-3 fill-[#00FFB3] text-[#00FFB3]" />
                                            ) : (
                                                <Circle className="w-3 h-3 opacity-30 group-hover:opacity-60" />
                                            )}
                                        </div>
                                        <span className="leading-relaxed">{lesson.title}</span>
                                    </Link>
                                );
                            })}

                            {topic.quizzes && topic.quizzes.length > 0 && (
                                topic.quizzes.map(quiz => {
                                    const isCompleted = completedQuizzes?.[quiz.id];
                                    const isQuizLocked = isFreePreview && globalLessonIndex >= 3;

                                    if (isQuizLocked) {
                                        return (
                                            <Link
                                                key={`quiz-${quiz.id}`}
                                                href="/pricing"
                                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] text-white/25 hover:text-amber-400/60 border border-dashed border-white/10 hover:border-amber-400/30 mt-1"
                                            >
                                                <Lock className="w-3 h-3 shrink-0" />
                                                <span className="leading-relaxed font-medium">Locked Quiz</span>
                                            </Link>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={`quiz-${quiz.id}`}
                                            href={`/courses/${params.courseId}/quizzes/${quiz.id}`}
                                            className={cn(
                                                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-[11px] group mt-1",
                                                isCompleted
                                                    ? "text-[#00FFB3] bg-[#00FFB3]/8 border border-[#00FFB3]/20 hover:bg-[#00FFB3]/12"
                                                    : "text-white/40 hover:bg-[#00FFB3]/8 hover:text-[#00FFB3] border border-dashed border-white/10 hover:border-[#00FFB3]/30"
                                            )}
                                        >
                                            <CheckCircle2 className={cn("w-3 h-3 shrink-0", isCompleted ? "text-[#00FFB3]" : "text-white/30 group-hover:text-[#00FFB3]")} />
                                            <span className="leading-relaxed font-medium">
                                                {isCompleted ? "Quiz Completed ✓" : "Module Assessment"}
                                            </span>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
