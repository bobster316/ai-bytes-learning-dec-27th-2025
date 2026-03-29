// lib/ai/conductor/block-weights.ts
// Maps every block type to an emotional intensity (0–1).
// Calm blocks are 0.0–0.2. Building 0.3–0.5. High-intensity 0.6+.
// Any block type not listed defaults to 0.4 (building).

export const BLOCK_INTENSITY: Readonly<Record<string, number>> = {
    // ── Calm (0.0 – 0.2) ──────────────────────────────────────────
    lesson_header:       0.1,
    hero_video:          0.1,
    objective:           0.1,
    text:                0.2,

    // ── Building (0.3 – 0.5) ──────────────────────────────────────
    type_cards:          0.4,
    flow_diagram:        0.4,
    image_text_row:      0.35,
    instructor_insight:  0.4,
    industry_tabs:       0.45,
    full_image:          0.3,
    concept_illustration: 0.35,
    mindmap:             0.45,
    video_snippet:       0.4,
    interactive_vis:     0.45,
    open_exercise:       0.45,
    audio_recap_prominent: 0.3,
    perspective_toggle:  0.45,
    world_stage:         0.4,
    reality_anchor:      0.4,
    code_cinema:         0.45,
    scroll_story:        0.45,

    // ── Tension (0.6 – 0.85) ──────────────────────────────────────
    // NOTE: Tension and Insight blocks share the 0.6–0.75 range.
    // Beat-level intensity in arc-definitions.ts governs beat categorisation;
    // block intensity here governs individual dramatic budget cost.
    prediction:          0.65,
    myth_buster:         0.7,
    contrast_duel:       0.75,
    tension_arc:         0.8,
    signal_interrupt:    0.85,

    // ── Insight (0.6 – 0.75) ──────────────────────────────────────
    punch_quote:         0.6,
    applied_case:        0.65,
    depth_charge:        0.65,
    animated_stat:       0.65,
    quote_mosaic:        0.6,
    neural_map:          0.75,
    cinematic_moment:    0.75,

    // ── Reward (0.2 – 0.4) ────────────────────────────────────────
    go_deeper:           0.35,
    time_capsule:        0.3,
    callout:             0.3,
    recap:               0.25,
    quiz:                0.35,
    key_terms:           0.2,
    completion:          0.25,
};

/** Returns intensity for a block type, defaulting to 0.4 (building) if unknown. */
export function blockIntensity(blockType: string): number {
    return BLOCK_INTENSITY[blockType] ?? 0.4;
}
