// lib/ai/conductor/index.ts
import type { ConductorContext, ConductorOutput, ArcType, Beat } from './types';
import { ARC_DEFINITIONS } from './arc-definitions';
import { selectArcType } from './arc-selector';
import { selectSignatureMoment } from './signature-moments';
import { selectPersonality } from './personality';
import { computeDramaticBudget } from './anti-chaos';

export { validateBlockSequence } from './anti-chaos';
export type { ConductorContext, ConductorOutput, ConductorMemory } from './types';

const LESSON_ACCENT_CYCLE = [
    '#00FFB3', '#9B8FFF', '#FFB347', '#FF6B6B',
    '#5BC8F5', '#D4A840', '#7EC8A4', '#FF8C69',
    '#B8E840', '#F8A4C8', '#2EC4F0', '#8B94B8',
] as const;

/** Derive a seeded integer from course + lesson position. Pure — no randomness. */
function computeMicroSeed(ctx: ConductorContext): number {
    const str = `${ctx.moduleIndex}:${ctx.lessonIndex}:${ctx.moduleMood}`;
    return str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

/** Pick accent index cycling through 12 colours, offset by module to avoid same colour per module */
function computeAccentIndex(ctx: ConductorContext): number {
    const base = ctx.moduleIndex * ctx.totalLessonsInModule + ctx.lessonIndex;
    const moduleOffset = ctx.moduleIndex * 3; // shift colour start per module
    return (base + moduleOffset) % LESSON_ACCENT_CYCLE.length;
}

const ARC_DESCRIPTIONS: Readonly<Record<ArcType, string>> = {
    micro: 'Brief and focused. Open gently, reach one insight, reward and close.',
    standard: 'Full journey. Build foundations, introduce friction, achieve insight, then reward.',
    tension_first: 'Challenge-led. Open with a provocative question or conflict, then resolve it.',
    exploratory: 'Discovery-led. Invite curiosity without hard friction. Let understanding emerge.',
};

/** Builds the human-readable directive string injected into the LessonExpanderAgent prompt. */
function buildConductorNotes(
    arcType: ArcType,
    beats: readonly Beat[],
    output: Omit<ConductorOutput, 'conductorNotes'>,
    ctx: ConductorContext
): string {
    const beatNames = beats.map(b => b.name.toUpperCase()).join(' → ');
    const recentTypes = ctx.memory.recentBlockTypeHistory.flat();
    const avoidList = [...new Set(recentTypes)].slice(0, 8);

    const lines: string[] = [
        `LESSON RHYTHM DIRECTIVE (follow exactly):`,
        `Arc type: ${arcType} — ${ARC_DESCRIPTIONS[arcType]}`,
        `Emotional sequence: ${beatNames}`,
        `Lesson personality: ${output.lessonPersonality} — let this tone colour your word choices and visual cues`,
        `Dramatic budget: max ${output.dramaticBudget} blocks with intensity ≥ 0.7 (tension/insight-level blocks)`,
        `Block count target: 10–13 blocks total. Minimum 8. Maximum 16.`,
    ];

    if (output.signatureMoment) {
        lines.push('');
        lines.push(`⭐ SIGNATURE MOMENT — place a "${output.signatureMoment.type}" block at beat index ${output.signatureMoment.beatIndex} (${beats[output.signatureMoment.beatIndex]?.name ?? 'insight'} beat).`);
        lines.push(`   This is a once-per-course event. It must feel unmistakably special. Give it exceptional content.`);
    }

    if (avoidList.length > 0) {
        lines.push('');
        lines.push(`Avoid overusing these block types (recently used): ${avoidList.join(', ')}`);
    }

    const prevIntensity = ctx.memory.previousLessonEndIntensity;
    if (prevIntensity > 0) {
        const feel = prevIntensity >= 0.7 ? 'significantly quieter and gentler'
            : prevIntensity >= 0.4 ? 'at a similar energy level'
            : 'with moderate energy';
        lines.push('');
        lines.push(`The previous lesson ended at intensity ${prevIntensity.toFixed(2)}. Open this lesson ${feel}.`);
    }

    return lines.join('\n');
}

/**
 * The Conductor.
 * Reads ConductorContext and returns ConductorOutput with all orchestration decisions.
 * Pure function — no side effects. Call once per lesson during course generation.
 */
export function conduct(ctx: ConductorContext): ConductorOutput {
    const arcType = selectArcType(ctx);
    const beatSequence = [...ARC_DEFINITIONS[arcType]];
    const dramaticBudget = computeDramaticBudget(ctx.moduleMood, arcType);
    const lessonPersonality = selectPersonality(ctx);
    const signatureMoment = selectSignatureMoment(ctx, arcType);
    const lessonAccentIndex = computeAccentIndex(ctx);
    const microVariationSeed = computeMicroSeed(ctx);

    const partial: Omit<ConductorOutput, 'conductorNotes'> = {
        arcType,
        beatSequence,
        dramaticBudget,
        lessonPersonality,
        signatureMoment,
        lessonAccentIndex,
        microVariationSeed,
    };

    const conductorNotes = buildConductorNotes(arcType, beatSequence, partial, ctx);

    return { ...partial, conductorNotes };
}

/**
 * Updates ConductorMemory after a lesson has been generated.
 * Call this after each lesson to keep the Conductor informed for the next.
 *
 * @param memory  The current memory object (mutated in-place for performance)
 * @param generatedBlockTypes  The block types of the lesson that just completed
 * @param firedSignatureMomentType  The signature moment type that fired, if any
 */
export function updateConductorMemory(
    memory: import('./types').ConductorMemory,
    generatedBlockTypes: string[],
    firedSignatureMomentType: import('./types').SignatureMomentType | null
): void {
    const { blockIntensity } = require('./block-weights');

    // Update end-of-lesson intensity
    const lastBlockType = generatedBlockTypes[generatedBlockTypes.length - 1] ?? '';
    memory.previousLessonEndIntensity = blockIntensity(lastBlockType);

    // Record fired signature moment
    if (firedSignatureMomentType && !memory.firedSignatureMoments.includes(firedSignatureMomentType)) {
        memory.firedSignatureMoments.push(firedSignatureMomentType);
    }

    // Shift recent block type history (keep last 3 lessons only)
    memory.recentBlockTypeHistory.push([...generatedBlockTypes]);
    if (memory.recentBlockTypeHistory.length > 3) {
        memory.recentBlockTypeHistory.shift();
    }
}
