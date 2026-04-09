// components/course/course-dna-provider.tsx
"use client";

import React, { createContext, useContext } from "react";
import type { CourseDNA } from "@/lib/types/course-upgrade";
import { defaultRender } from "@/lib/ai/generate-course-dna";

const CourseDNAContext = createContext<CourseDNA["render"]>(defaultRender);

export function useCourseDNA(): CourseDNA["render"] {
    return useContext(CourseDNAContext);
}

export function CourseDNAProvider({
    render,
    children,
}: {
    render: CourseDNA["render"];
    children: React.ReactNode;
}) {
    return (
        <CourseDNAContext.Provider value={render}>
            <div
                style={{
                    "--course-primary":   render.primary_colour,
                    "--course-secondary": render.secondary_colour,
                    "--course-surface":   render.surface_colour,
                    display: "contents",
                } as React.CSSProperties}
            >
                {children}
            </div>
        </CourseDNAContext.Provider>
    );
}
