
"use client";

import { useEffect, useState } from "react";
import { LessonClientUtils } from "./lesson-client-utils";

export function LessonClientWrapper({ voiceContext, courseId, lessonId }: any) {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) return null;

    return (
        <div className="hidden">
            <LessonClientUtils voiceContext={voiceContext} courseId={courseId} lessonId={lessonId} />
        </div>
    );
}
