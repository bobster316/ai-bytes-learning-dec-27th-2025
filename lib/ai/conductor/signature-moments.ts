// lib/ai/conductor/signature-moments.ts
import type { ArcType, ConductorContext, SignatureMomentType, SignatureMomentPlacement } from './types';

interface SignatureRule {
    /** Index into the arc's beatSequence array (0-based) */
    beatIndex: number;
    /** Minimum global lesson index (moduleIndex * totalLessonsInModule + lessonIndex) before this can fire */
    minGlobalLessonIndex: number;
    /** Module moods in which this is allowed */
    moduleMoods: readonly string[];
    /** Arc types in which this moment is appropriate */
    arcTypes: readonly ArcType[];
}

const SIGNATURE_RULES: Readonly<Record<SignatureMomentType, SignatureRule>> = {
    time_capsule: {
        beatIndex: 2,           // reward beat in micro / last beat in standard
        minGlobalLessonIndex: 0,
        moduleMoods: ['opening', 'building'],
        arcTypes: ['standard', 'micro', 'exploratory'],
    },
    neural_map: {
        beatIndex: 3,           // insight beat
        minGlobalLessonIndex: 2,
        moduleMoods: ['building', 'climax'],
        arcTypes: ['standard', 'exploratory'],
    },
    cinematic_moment: {
        beatIndex: 3,           // insight beat
        minGlobalLessonIndex: 1,
        moduleMoods: ['climax'],
        arcTypes: ['standard', 'tension_first'],
    },
    signal_interrupt: {
        beatIndex: 2,           // tension beat in standard / tension beat in tension_first
        minGlobalLessonIndex: 2,
        moduleMoods: ['building', 'climax'],
        arcTypes: ['standard', 'tension_first'],
    },
};

/** Priority order — earlier items fire first when multiple are eligible */
const SIGNATURE_PRIORITY: readonly SignatureMomentType[] = [
    'time_capsule',
    'neural_map',
    'signal_interrupt',
    'cinematic_moment',
];

export function selectSignatureMoment(
    ctx: ConductorContext,
    arcType: ArcType
): SignatureMomentPlacement | null {
    const globalLessonIndex = ctx.moduleIndex * ctx.totalLessonsInModule + ctx.lessonIndex;

    for (const type of SIGNATURE_PRIORITY) {
        const rule = SIGNATURE_RULES[type];

        // Already fired this course
        if (ctx.memory.firedSignatureMoments.includes(type)) continue;

        // Too early in the course
        if (globalLessonIndex < rule.minGlobalLessonIndex) continue;

        // Wrong module mood
        if (!rule.moduleMoods.includes(ctx.moduleMood)) continue;

        // Wrong arc type
        if (!rule.arcTypes.includes(arcType)) continue;

        return { beatIndex: rule.beatIndex, type };
    }

    return null;
}
