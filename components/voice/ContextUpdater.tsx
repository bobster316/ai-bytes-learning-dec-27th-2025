"use client";
import { useEffect } from "react";
import { useLearningContextStore } from "@/lib/store/learning-context-store";
import { LearningContext } from "@/lib/types/learning-context";

export function ContextUpdater({ context }: { context: LearningContext }) {
    const { setContext } = useLearningContextStore();

    useEffect(() => {
        console.log("🧠 ContextUpdater: Updating learning context", context);
        setContext(context);
    }, [context, setContext]);

    return null;
}
