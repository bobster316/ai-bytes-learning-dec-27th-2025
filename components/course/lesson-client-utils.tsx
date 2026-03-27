"use client";

import dynamic from "next/dynamic";

// Loaded client-only — avoids SSR hydration mismatches from store/browser API access
const ContextUpdater = dynamic(
    () => import("@/components/voice/ContextUpdater").then(m => m.ContextUpdater),
    { ssr: false }
);

const CourseAnalyticsTracker = dynamic(
    () => import("@/components/course/analytics-tracker").then(m => m.CourseAnalyticsTracker),
    { ssr: false }
);

export function LessonClientUtils({
    voiceContext,
    courseId,
    lessonId,
}: {
    voiceContext: any;
    courseId: string;
    lessonId: string;
}) {
    return (
        <>
            <ContextUpdater context={voiceContext} />
            <CourseAnalyticsTracker courseId={courseId} lessonId={lessonId} />
        </>
    );
}
