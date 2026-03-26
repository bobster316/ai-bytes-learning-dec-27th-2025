// components/course/course-background.tsx
"use client";

import { useCourseDNA } from "./course-dna-provider";

export function CourseBackground() {
    const { bg_treatment, primary_colour, secondary_colour, surface_colour } = useCourseDNA();

    if (bg_treatment === "clean_flat") {
        return <div className="fixed inset-0 -z-10" style={{ backgroundColor: surface_colour }} />;
    }

    if (bg_treatment === "subtle_grid") {
        return (
            <div className="fixed inset-0 -z-10" style={{ backgroundColor: surface_colour }}>
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(${primary_colour} 1px, transparent 1px), linear-gradient(90deg, ${primary_colour} 1px, transparent 1px)`,
                        backgroundSize: "60px 60px",
                    }}
                />
            </div>
        );
    }

    if (bg_treatment === "grain_texture") {
        return (
            <div className="fixed inset-0 -z-10" style={{ backgroundColor: surface_colour }}>
                <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                    <filter id="grain-bg">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#grain-bg)" />
                </svg>
            </div>
        );
    }

    // dark_mesh (default) — radial gradient blobs + grain overlay (replicates existing LessonContentRenderer pattern)
    return (
        <div className="fixed inset-0 -z-10" style={{ backgroundColor: surface_colour }}>
            <div
                className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[120px] pointer-events-none"
                style={{ background: `radial-gradient(circle, ${primary_colour}, transparent 70%)` }}
            />
            <div
                className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.06] blur-[100px] pointer-events-none"
                style={{ background: `radial-gradient(circle, ${secondary_colour}, transparent 70%)` }}
            />
            <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
                <filter id="grain-mesh">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#grain-mesh)" />
            </svg>
        </div>
    );
}
