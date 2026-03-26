// lib/ai/generate-course-dna.ts
import crypto from "crypto";
import { CourseDNA, CourseDNASchema } from "@/lib/types/course-upgrade";
import { ARCHETYPES, PALETTES, IMAGE_AESTHETICS, BG_TREATMENTS, TYPOGRAPHY_PERSONALITIES } from "./course-dna-catalogue";

function pick<T>(arr: readonly T[], seed: number): T {
    return arr[seed % arr.length];
}

export const defaultRender: CourseDNA["render"] = {
    palette_id:       "pulse_teal",
    primary_colour:   "#00FFB3",
    secondary_colour: "#9B8FFF",
    surface_colour:   "#0a0a0f",
    image_aesthetic:  "photorealistic",
    bg_treatment:     "dark_mesh",
    typography:       "modern_sans",
    layout_density:   "balanced",
    section_divider:  "thin_rule",
};

/**
 * Deterministic — same courseId + title + difficulty always produce the same DNA.
 * Pure function, no side effects, no DB calls.
 */
export function generateCourseDNA(courseId: string, title: string, difficulty: string): CourseDNA {
    const hash = crypto.createHash("sha256")
        .update(`${courseId}:${title}:${difficulty}`)
        .digest("hex");

    // 7 seed integers from non-overlapping 4-char windows of the 64-char hex hash
    // seeds[0]=archetype, [1]=palette, [2]=example_bias, [3]=question_tone,
    // [4]=image_aesthetic, [5]=bg_treatment, [6]=typography
    const seeds = Array.from({ length: 7 }, (_, i) =>
        parseInt(hash.slice(i * 4, i * 4 + 4), 16)
    );

    const archetype = pick(ARCHETYPES, seeds[0]);
    const palette   = pick(PALETTES,   seeds[1]);

    return {
        dna_version: 1,
        content: {
            archetype_id:  archetype.id,
            writing_style: archetype.writingStyle,
            example_bias:  pick(["real_world_first", "theory_first", "analogy_first"] as const, seeds[2]),
            question_tone: pick(["socratic", "direct_challenge", "reflective"]        as const, seeds[3]),
        },
        render: {
            palette_id:       palette.id,
            primary_colour:   palette.primary,
            secondary_colour: palette.secondary,
            surface_colour:   palette.surface,
            image_aesthetic:  pick(IMAGE_AESTHETICS,          seeds[4]),
            bg_treatment:     pick(BG_TREATMENTS,             seeds[5]),
            typography:       pick(TYPOGRAPHY_PERSONALITIES,  seeds[6]),
            layout_density:   archetype.layoutDensity,   // archetype-coupled
            section_divider:  archetype.sectionDivider,  // archetype-coupled
        },
    };
}

/** Safely parse raw JSONB from DB. Returns defaultRender on any validation failure. */
export function getCourseDNARender(raw: unknown): CourseDNA["render"] {
    const result = CourseDNASchema.safeParse(raw);
    return result.success ? result.data.render : defaultRender;
}

/** Derive fingerprint — always re-derivable from courseId/title/difficulty */
export function deriveDNAFingerprint(courseId: string, title: string, difficulty: string): string {
    return crypto.createHash("sha256")
        .update(`${courseId}:${title}:${difficulty}`)
        .digest("hex");
}

/**
 * Derive an integer 0–N from a string. Used to replace the old lessonVariant.variant
 * integer in block components that need a per-course cycle offset (TypeCards, RecapSlide).
 * e.g. archetypeOffset(dna.render.palette_id, 4) replaces `lessonVariant.variant % 4`
 */
export function archetypeOffset(seed: string, modulus: number): number {
    const sum = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return sum % modulus;
}
