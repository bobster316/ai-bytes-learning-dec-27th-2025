// components/course/SectionDivider.tsx
"use client";

import { useCourseDNA } from "./course-dna-provider";

export function SectionDivider({ sectionNumber }: { sectionNumber?: number }) {
    const { section_divider, primary_colour } = useCourseDNA();

    if (section_divider === "bold_number") {
        if (sectionNumber !== undefined) {
            return (
                <div className="flex items-center justify-center my-8 select-none pointer-events-none">
                    <span
                        className="font-mono text-[80px] font-black leading-none opacity-[0.06]"
                        style={{ color: primary_colour }}
                    >
                        {String(sectionNumber).padStart(2, "0")}
                    </span>
                </div>
            );
        }
        // bold_number with no sectionNumber — thick accent rule so variation is still visible
        return (
            <div
                className="my-10 h-[3px] w-16 mx-auto rounded-full"
                style={{ backgroundColor: primary_colour, opacity: 0.4 }}
            />
        );
    }

    if (section_divider === "dot_row") {
        return (
            <div className="flex items-center justify-center gap-2 my-8">
                {[0, 1, 2, 3, 4].map((i) => (
                    <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: primary_colour, opacity: 0.3 }}
                    />
                ))}
            </div>
        );
    }

    // thin_rule (default)
    return (
        <div
            className="my-10 h-px w-full max-w-[1140px] mx-auto"
            style={{ backgroundColor: primary_colour, opacity: 0.12 }}
        />
    );
}
