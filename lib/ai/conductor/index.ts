// lib/ai/conductor/index.ts
import type { ConductorContext, ConductorOutput, ConductorMemory, ModuleMood, ArcType, Beat, SignatureMomentType } from './types';
import { ARC_DEFINITIONS } from './arc-definitions';
import { selectArcType } from './arc-selector';
import { selectSignatureMoment } from './signature-moments';
import { selectPersonality } from './personality';
import { computeDramaticBudget } from './anti-chaos';
import { blockIntensity } from './block-weights';

export { validateBlockSequence } from './anti-chaos';
export type { ConductorContext, ConductorOutput, ConductorMemory, ModuleMood } from './types';

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

    const arcDef = ARC_DEFINITIONS[arcType];

    const lines: string[] = [
        `LESSON RHYTHM DIRECTIVE (follow exactly):`,
        `Arc type: ${arcType} — ${arcDef.description}`,
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

    // Inject SEQUENCE ADJUSTMENT for arcs with overrides
    if (arcDef.sequenceOverride && arcDef.sequenceOverride.length > 0) {
        lines.push('');
        lines.push('SEQUENCE ADJUSTMENT (approved override for this arc type):');
        for (const override of arcDef.sequenceOverride) {
            if (override.constraint === 'contrast_before_hook' && override.newParams.allowed) {
                lines.push('  - A contrast block MAY appear before the hook in this lesson.');
                lines.push('    Rule: contrast → hook (by position 3) → prediction → core_explanation.');
                lines.push('    The hook must still appear — do not omit it.');
            }
            if (override.constraint === 'hook_position_limit') {
                lines.push(`  - The hook may appear up to position ${override.newParams.maxPosition} (1-indexed).`);
                lines.push('    Prediction must still appear before the first core_explanation.');
            }
            if (override.constraint === 'process_position_strict' && !override.newParams.strict) {
                lines.push('  - Process/flow_diagram blocks do not need to be adjacent to core_explanation.');
                lines.push('    They must still appear before the closure phase.');
            }
        }
        lines.push('  All other pedagogical rules (required blocks, dependencies) remain in force.');
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
    const beatSequence = [...ARC_DEFINITIONS[arcType].beats];
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

export function computeModuleMood(moduleIndex: number, totalModules: number): ModuleMood {
    const pos = totalModules <= 1 ? 0.5 : moduleIndex / (totalModules - 1);
    if (pos <= 0.25) return 'opening';
    if (pos <= 0.55) return 'building';
    if (pos <= 0.8)  return 'climax';
    return 'resolution';
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
    memory: ConductorMemory,
    generatedBlockTypes: string[],
    firedSignatureMomentType: SignatureMomentType | null
): void {

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
