"use client";

import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";

export function SimpleLessonNavigation({ courseId, lessonId, nextLessonHref }: { courseId: string; lessonId: string; nextLessonHref?: string }) {
    const isLastLesson = nextLessonHref?.includes('/complete');

    return (
        <div className="w-full border-t border-white/5 mt-12 pt-8 mb-20">
            <div className="flex flex-col items-center gap-4 text-center">
                {!isLastLesson && (
                    <>
                        <span className="text-[11px] font-bold text-[#8A8AB0]">End of Stream</span>
                        <Link
                            href={`/courses/${courseId}#curriculum`}
                            className="group inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-[#00FFB3] to-[#00FFB3] text-[#030305] font-bold font-sans text-[15px] shadow-[0_4px_20px_rgba(0,255,179,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,255,179,0.45)] transition-all"
                        >
                            Return to Syllabus
                            <GraduationCap className="w-4 h-4" />
                        </Link>
                    </>
                )}

                <Link
                    href={`/courses/${courseId}`}
                    className="group inline-flex items-center gap-2 text-xs text-[#8A8AB0] hover:text-white transition-colors mt-1"
                >
                    <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                    Back to Course Overview
                </Link>
            </div>
        </div>
    );
}

