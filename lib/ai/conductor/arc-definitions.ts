// lib/ai/conductor/arc-definitions.ts
import type { ArcType, Beat, ArcDefinition } from './types';

export const ARC_DEFINITIONS: Readonly<Record<ArcType, ArcDefinition>> = {

    /**
     * MICRO — 3 beats
     * For: short lessons, post-high-intensity lessons, opening-module lessons.
     * No hard tension. Quick, memorable, satisfying.
     */
    micro: {
        description: 'Brief and focused. Open gently, reach one insight, reward and close.',
        beats: [
            {
                name: 'calm',
                allowedBlockTypes: ['lesson_header', 'objective', 'text'],
                intensity: 0.1,
            },
            {
                name: 'insight',
                allowedBlockTypes: ['neural_map', 'punch_quote', 'applied_case', 'depth_charge', 'animated_stat', 'quote_mosaic'],
                intensity: 0.7,
            },
            {
                name: 'reward',
                allowedBlockTypes: ['recap', 'quiz', 'key_terms', 'completion', 'time_capsule'],
                intensity: 0.3,
            },
        ],
    },

    /**
     * STANDARD — 5 beats (full arc)
     * Default for most lessons. Runs the complete emotional journey.
     */
    standard: {
        description: 'Full journey. Build foundations, introduce friction, achieve insight, then reward.',
        beats: [
            {
                name: 'calm',
                allowedBlockTypes: ['lesson_header', 'objective', 'text'],
                intensity: 0.1,
            },
            {
                name: 'building',
                allowedBlockTypes: ['type_cards', 'flow_diagram', 'image_text_row', 'instructor_insight', 'industry_tabs', 'concept_illustration', 'mindmap', 'perspective_toggle', 'world_stage', 'code_cinema', 'reality_anchor', 'callout'],
                intensity: 0.4,
            },
            {
                name: 'tension',
                allowedBlockTypes: ['signal_interrupt', 'tension_arc', 'contrast_duel', 'myth_buster', 'prediction'],
                intensity: 0.8,
            },
            {
                name: 'insight',
                allowedBlockTypes: ['cinematic_moment', 'neural_map', 'applied_case', 'depth_charge', 'punch_quote', 'animated_stat', 'quote_mosaic'],
                intensity: 0.7,
            },
            {
                name: 'reward',
                allowedBlockTypes: ['recap', 'quiz', 'key_terms', 'completion', 'time_capsule', 'go_deeper'],
                intensity: 0.3,
            },
        ],
    },

    /**
     * TENSION_FIRST — 4 beats
     * For: advanced lessons, climax-module lessons, provocateur/bold archetype courses.
     * Opens with challenge. Earns calm through resolution.
     *
     * NOTE: lesson_header and objective are structurally required by the renderer
     * and must always be emitted by the generator unconditionally, regardless of
     * this arc's beat list which starts at tension. The generator prompt (Task 10)
     * must document this constraint explicitly.
     */
    tension_first: {
        description: 'Challenge-led. Open with a provocative question or conflict, then resolve it.',
        beats: [
            {
                name: 'tension',
                allowedBlockTypes: ['signal_interrupt', 'myth_buster', 'contrast_duel', 'tension_arc'],
                intensity: 0.8,
            },
            {
                name: 'building',
                allowedBlockTypes: ['type_cards', 'flow_diagram', 'instructor_insight', 'industry_tabs', 'perspective_toggle'],
                intensity: 0.4,
            },
            {
                name: 'insight',
                allowedBlockTypes: ['neural_map', 'applied_case', 'depth_charge', 'punch_quote', 'cinematic_moment'],
                intensity: 0.7,
            },
            {
                name: 'reward',
                allowedBlockTypes: ['recap', 'quiz', 'key_terms', 'completion'],
                intensity: 0.3,
            },
        ],
        sequenceOverride: [
            { constraint: 'contrast_before_hook', newParams: { allowed: true } },
            { constraint: 'hook_position_limit',  newParams: { maxPosition: 3 } },
        ],
    },

    /**
     * EXPLORATORY — 4 beats (no hard tension)
     * For: discovery lessons, early-module lessons, resolution-module lessons.
     * Deep understanding without confrontation.
     *
     * NOTE: Two 'building' beats are intentional. Downstream code MUST use beatIndex
     * (array position) when referencing specific beats — never beat.name alone.
     * Beat index 1 = structural overview blocks.
     * Beat index 2 = reflective/interactive blocks.
     */
    exploratory: {
        description: 'Discovery-led. Invite curiosity without hard friction. Let understanding emerge.',
        beats: [
            {
                name: 'calm',
                allowedBlockTypes: ['lesson_header', 'objective', 'text'],
                intensity: 0.1,
            },
            {
                name: 'building',
                allowedBlockTypes: ['type_cards', 'flow_diagram', 'image_text_row', 'industry_tabs', 'concept_illustration', 'scroll_story', 'callout'],
                intensity: 0.4,
            },
            {
                name: 'building',
                allowedBlockTypes: ['instructor_insight', 'perspective_toggle', 'world_stage', 'mindmap', 'reality_anchor', 'open_exercise'],
                intensity: 0.45,
            },
            {
                name: 'insight',
                allowedBlockTypes: ['neural_map', 'applied_case', 'depth_charge', 'go_deeper', 'punch_quote', 'animated_stat'],
                intensity: 0.6,
            },
            {
                name: 'reward',
                allowedBlockTypes: ['recap', 'quiz', 'key_terms', 'completion', 'go_deeper'],
                intensity: 0.3,
            },
        ],
        sequenceOverride: [
            { constraint: 'hook_position_limit',     newParams: { maxPosition: 4 } },
            { constraint: 'process_position_strict', newParams: { strict: false } },
        ],
    },
};
