// lib/ai/conductor/personality.ts
import type { LessonPersonality, ConductorContext, ModuleMood } from './types';

/** Which personalities are compatible with each archetype. First item is preferred. */
const ARCHETYPE_PERSONALITIES: Readonly<Record<string, readonly LessonPersonality[]>> = {
    clinical:         ['calm', 'technical'],
    bold:             ['electric', 'stark', 'technical'],
    warm:             ['warm', 'calm'],
    futuristic:       ['electric', 'cinematic', 'technical'],
    story_driven:     ['cinematic', 'warm'],
    provocateur:      ['stark', 'electric'],
    quantum_terminal: ['technical', 'stark'],
    editorial_noir:   ['cinematic', 'warm'],
    arctic_glass:     ['calm', 'technical'],
    void_minimal:     ['calm', 'stark'],
    neon_bloom:       ['electric', 'cinematic'],
    thermal_amber:    ['stark', 'electric'],
    narrative_arc:    ['cinematic', 'warm'],
    data_dense:       ['technical', 'calm'],
    scientific:       ['technical', 'calm'],
    story_world:      ['cinematic', 'warm'],
    expressive:       ['electric', 'cinematic'],
    modular:          ['calm', 'technical'],
};

/** Module mood nudges personality toward specific flavours */
const MOOD_PERSONALITY_NUDGE: Readonly<Record<ModuleMood, Partial<Record<LessonPersonality, number>>>> = {
    opening:    { calm: 2, warm: 1 },
    building:   { technical: 1, electric: 1 },
    climax:     { electric: 2, stark: 1 },
    resolution: { calm: 2, cinematic: 1 },
};

export function selectPersonality(ctx: ConductorContext): LessonPersonality {
    const { courseArchetype, moduleMood, lessonIndex, totalLessonsInModule } = ctx;

    const allowed: readonly LessonPersonality[] = ARCHETYPE_PERSONALITIES[courseArchetype]
        ?? ['calm', 'electric', 'cinematic', 'technical', 'warm', 'stark'];

    // Score each allowed personality
    const scores = new Map<LessonPersonality, number>();
    for (const p of allowed) {
        scores.set(p, 1);
    }

    // Apply mood nudge
    const nudge = MOOD_PERSONALITY_NUDGE[moduleMood];
    for (const [p, boost] of Object.entries(nudge) as [LessonPersonality, number][]) {
        if (scores.has(p)) {
            scores.set(p, (scores.get(p) ?? 0) + boost);
        }
    }

    // Deterministic selection using lesson position as tiebreaker
    const positionBias = lessonIndex % allowed.length;
    const sorted = [...scores.entries()].sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]; // higher score first
        return allowed.indexOf(a[0]) - allowed.indexOf(b[0]); // stable by allowed order
    });

    // Pick top-scoring, use positionBias to rotate between ties
    const topScore = sorted[0][1];
    const topTied = sorted.filter(([, s]) => s === topScore).map(([p]) => p);
    return topTied[positionBias % topTied.length];
}
