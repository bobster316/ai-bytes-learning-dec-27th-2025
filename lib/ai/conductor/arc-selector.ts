// lib/ai/conductor/arc-selector.ts
import type { ArcType, ConductorContext } from './types';

/** Archetypes that prefer high-tension arcs */
const TENSION_ARCHETYPES = new Set(['bold', 'provocateur', 'quantum_terminal', 'void_minimal']);
/** Archetypes that prefer exploratory arcs */
const EXPLORATORY_ARCHETYPES = new Set(['clinical', 'futuristic', 'editorial_noir', 'story_driven', 'neon_bloom', 'warm']);

export function selectArcType(ctx: ConductorContext): ArcType {
    const {
        lessonIndex,
        totalLessonsInModule,
        moduleMood,
        courseArchetype,
        memory,
    } = ctx;

    const positionInModule = totalLessonsInModule <= 1
        ? 0.5
        : lessonIndex / (totalLessonsInModule - 1); // 0 = first, 1 = last

    const previousIntensity = memory.previousLessonEndIntensity;

    // ── Decompression rule ────────────────────────────────────────────────────
    // Previous lesson ended high — give learner breathing room.
    if (previousIntensity >= 0.7) {
        return positionInModule < 0.5 ? 'exploratory' : 'micro';
    }

    // ── Module mood drives base arc ───────────────────────────────────────────
    if (moduleMood === 'opening') {
        return 'micro';
    }

    if (moduleMood === 'resolution') {
        return 'exploratory';
    }

    if (moduleMood === 'climax') {
        return TENSION_ARCHETYPES.has(courseArchetype) ? 'tension_first' : 'standard';
    }

    // moduleMood === 'building' from here on
    // ── Archetype bias ────────────────────────────────────────────────────────
    if (EXPLORATORY_ARCHETYPES.has(courseArchetype) && positionInModule < 0.4) {
        return 'exploratory';
    }

    if (TENSION_ARCHETYPES.has(courseArchetype) && positionInModule > 0.6) {
        return 'tension_first';
    }

    // ── Positional fallback ───────────────────────────────────────────────────
    if (positionInModule < 0.3) return 'exploratory';
    if (positionInModule > 0.7) return 'tension_first';

    return 'standard';
}
