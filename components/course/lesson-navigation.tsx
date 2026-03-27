"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { updateLessonProgress } from "@/app/actions/progress";
import { useState } from "react";

interface Lesson {
    id: string;
    title: string;
    order_index: number;
}

interface Quiz {
    id: string;
    title: string;
}

interface Topic {
    id: string;
    title: string;
    order_index: number;
    lessons: Lesson[];
    quizzes?: Quiz[];
}

interface CourseOutline {
    title: string;
    topics: Topic[];
}

interface LessonNavigationProps {
    courseId: string;
    currentLessonId: string;
    courseOutline: CourseOutline;
}

export function LessonNavigation({ courseId, currentLessonId, courseOutline }: LessonNavigationProps) {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);

    // Standardize IDs for comparison
    const targetId = String(currentLessonId).trim();

    // Calculate current position
    let currentTopicIndex = -1;
    let currentLessonIndex = -1;
    let currentTopic: Topic | null = null;

    if (courseOutline?.topics) {
        for (let t = 0; t < courseOutline.topics.length; t++) {
            const topic = courseOutline.topics[t];
            const lessons = topic.lessons || [];

            const lIndex = lessons.findIndex(l => String(l.id).trim() === targetId);

            if (lIndex !== -1) {
                currentTopicIndex = t;
                currentLessonIndex = lIndex;
                currentTopic = topic;
                break; // Stop searching once found
            }
        }
    }

    // Logic for Previous
    let prevLink: string | null = null;
    let prevTitle: string | null = null;

    if (currentTopic && currentLessonIndex !== -1) {
        const lessons = (currentTopic as Topic).lessons || [];

        if (currentLessonIndex > 0) {
            // Previous lesson in same topic
            const prevLesson = lessons[currentLessonIndex - 1];
            prevLink = `/courses/${courseId}/lessons/${prevLesson.id}`;
            prevTitle = prevLesson.title;
        } else if (currentTopicIndex > 0) {
            // Last item of previous topic
            const prevTopic = courseOutline.topics[currentTopicIndex - 1];
            const prevTopicQuizzes = prevTopic.quizzes || [];
            const prevTopicLessons = prevTopic.lessons || [];

            if (prevTopicQuizzes.length > 0) {
                const quiz = prevTopicQuizzes[0];
                prevLink = `/courses/${courseId}/quizzes/${quiz.id}`;
                prevTitle = "Module Quiz";
            } else if (prevTopicLessons.length > 0) {
                const lastLessonOfPrev = prevTopicLessons[prevTopicLessons.length - 1];
                prevLink = `/courses/${courseId}/lessons/${lastLessonOfPrev.id}`;
                prevTitle = lastLessonOfPrev.title;
            }
        }
    }

    // Logic for Next
    let nextLink: string | null = null;
    let nextTitle: string = "";
    let nextLabel: string = "Next Lesson";
    let isQuiz = false;

    if (currentTopic && currentLessonIndex !== -1) {
        const activeTopic = currentTopic as Topic;
        const lessons = activeTopic.lessons || [];
        const quizzes = activeTopic.quizzes || [];

        // 1. Are there more lessons in this topic?
        if (currentLessonIndex < lessons.length - 1) {
            const nextLesson = lessons[currentLessonIndex + 1];
            nextLink = `/courses/${courseId}/lessons/${nextLesson.id}`;
            nextTitle = nextLesson.title;
            nextLabel = "Next Lesson";
        }
        // 2. No more lessons. Is there a quiz?
        else if (quizzes.length > 0) {
            const quiz = quizzes[0];
            nextLink = `/courses/${courseId}/quizzes/${quiz.id}`;
            nextTitle = "Module Quiz";
            nextLabel = "Take Quiz";
            isQuiz = true;
        }
        // 3. No quiz. Is there a next topic?
        else if (currentTopicIndex < courseOutline.topics.length - 1) {
            const nextTopic = courseOutline.topics[currentTopicIndex + 1];
            const nextTopicLessons = nextTopic.lessons || [];

            if (nextTopicLessons.length > 0) {
                const nextLesson = nextTopicLessons[0];
                nextLink = `/courses/${courseId}/lessons/${nextLesson.id}`;
                nextTitle = nextLesson.title;
                nextLabel = "Next Module";
            }
        }
    }

    // Recovery Fallback / Direct Link Support
    if (!nextLink && courseOutline?.topics?.length) {
        // If we're lost (currentLessonIndex === -1), show "Continue Learning"
        // Or if we're at the very end (last lesson, no more modules), nextLink stays null (shows "Complete Course")
        if (currentLessonIndex === -1) {
            const firstTopic = courseOutline.topics[0];
            const firstTopicLessons = firstTopic.lessons || [];
            if (firstTopicLessons.length > 0) {
                nextLink = `/courses/${courseId}/lessons/${firstTopicLessons[0].id}`;
                nextTitle = firstTopicLessons[0].title;
                nextLabel = "Start Learning";
            }
        }
    }

    const handleNextClick = async (e: React.MouseEvent) => {
        if (!nextLink) return;
        e.preventDefault();
        setIsNavigating(true);

        try {
            await updateLessonProgress(courseId, targetId, 100);
            router.push(nextLink);
        } catch (error) {
            console.error("Failed to update progress:", error);
            router.push(nextLink);
        }
    };

    return (
        <nav className="border-t border-border/50 mt-16 pt-8 pb-12" aria-label="Lesson navigation">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Previous Button */}
                <div className="w-full md:w-1/2">
                    {prevLink ? (
                        <Link
                            href={prevLink}
                            className="group flex flex-col p-4 rounded-xl border border-border/50 hover:border-primary/20 hover:bg-muted/30 transition-all text-left"
                        >
                            <span className="flex items-center text-[11px] font-bold text-muted-foreground mb-1 group-hover:text-primary transition-colors font-sans">
                                <ArrowLeft className="w-3 h-3 mr-1 transition-transform group-hover:-translate-x-1" />
                                Previous Lesson
                            </span>
                            <span className="font-medium text-foreground truncate max-w-full">
                                {prevTitle}
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href={`/courses/${courseId}`}
                            className="group flex flex-col p-4 rounded-xl border border-border/50 hover:border-primary/20 hover:bg-muted/30 transition-all text-left opacity-70"
                        >
                            <span className="flex items-center text-[11px] font-bold text-muted-foreground mb-1 group-hover:text-primary transition-colors font-sans">
                                <ArrowLeft className="w-3 h-3 mr-1 transition-transform group-hover:-translate-x-1" />
                                Back to Overview
                            </span>
                            <span className="font-medium text-foreground">
                                Course Dashboard
                            </span>
                        </Link>
                    )}
                </div>

                {/* Next Button */}
                <div className="w-full md:w-1/2">
                    {nextLink ? (
                        <Link
                            href={nextLink}
                            onClick={handleNextClick}
                            className={cn(
                                "group flex flex-col items-end p-4 rounded-xl border transition-all text-right relative overflow-hidden cursor-pointer",
                                isQuiz
                                    ? "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/50"
                                    : "border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40"
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-r from-transparent transition-colors",
                                isQuiz ? "to-amber-500/5 group-hover:to-amber-500/10" : "to-primary/5 group-hover:to-primary/10"
                            )} />

                            <span className={cn(
                                "relative z-10 flex items-center text-[11px] font-bold mb-1 font-sans",
                                isQuiz ? "text-amber-600 dark:text-amber-400" : "text-primary"
                            )}>
                                {isNavigating ? "Saving..." : nextLabel}
                                {isQuiz ? <GraduationCap className="w-3 h-3 ml-1" /> : <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />}
                            </span>
                            <span className="relative z-10 font-medium text-foreground truncate max-w-full">
                                {nextTitle}
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href={`/courses/${courseId}`}
                            className="group flex flex-col items-end p-4 rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/50 transition-all text-right"
                        >
                            <span className="flex items-center text-[11px] text-green-600 dark:text-green-400 font-bold mb-1 font-sans">
                                Complete Course
                                <CheckCircle className="w-3 h-3 ml-1" />
                            </span>
                            <span className="font-medium text-foreground">
                                Return to Dashboard
                            </span>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
