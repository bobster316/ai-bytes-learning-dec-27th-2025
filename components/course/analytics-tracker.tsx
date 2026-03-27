
"use client";

import { useEffect } from "react";

interface AnalyticsTrackerProps {
    courseId: string;
    lessonId: string;
}

export function CourseAnalyticsTracker({ courseId, lessonId }: AnalyticsTrackerProps) {
    useEffect(() => {
        const trackEvent = async (eventType: string) => {
            try {
                await fetch("/api/analytics/track", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        courseId,
                        lessonId,
                        eventType,
                        eventData: {
                            userAgent: navigator.userAgent,
                            timestamp: new Date().toISOString()
                        }
                    })
                });
            } catch (e) {
                console.error("Failed to track analytics:", e);
            }
        };

        trackEvent("lesson_started");

        return () => {
            trackEvent("lesson_left");
        };
    }, [courseId, lessonId]);

    return null;
}
