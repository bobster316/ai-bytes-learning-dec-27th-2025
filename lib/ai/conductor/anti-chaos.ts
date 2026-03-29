// lib/ai/conductor/anti-chaos.ts
// Hard constraint enforcement. Called after conduct() to validate outputs
// and also used by LessonExpanderAgent to validate generated block sequences post-generation.

import { blockIntensity } from './block-weights';

export interface AntiChaosViolation {
    rule: string;
    detail: string;
}

/** Block types that cannot be adjacent to each other */
const ATTENTION_HIJACKERS = new Set(['signal_interrupt', 'cinematic_moment', 'tension_arc']);

/**
 * Validates a generated block type sequence against anti-chaos rules.
 * Returns an array of violations (empty = passes).
 * Used both at conduct() time and as a post-generation sanity check.
 */
export function validateBlockSequence(
    blockTypes: string[],
    dramaticBudget: number
): AntiChaosViolation[] {
    const violations: AntiChaosViolation[] = [];

    // Rule 1: Dramatic budget
    const highIntensityCount = blockTypes.filter(t => blockIntensity(t) >= 0.7).length;
    if (highIntensityCount > dramaticBudget) {
        violations.push({
            rule: 'dramatic_budget',
            detail: `${highIntensityCount} high-intensity blocks found, budget is ${dramaticBudget}`,
        });
    }

    // Rule 2: No consecutive high-intensity (>=0.7) blocks
    for (let i = 0; i < blockTypes.length - 1; i++) {
        if (blockIntensity(blockTypes[i]) >= 0.7 && blockIntensity(blockTypes[i + 1]) >= 0.7) {
            violations.push({
                rule: 'consecutive_high_intensity',
                detail: `Consecutive high-intensity blocks at positions ${i} (${blockTypes[i]}) and ${i + 1} (${blockTypes[i + 1]})`,
            });
        }
    }

    // Rule 3: No back-to-back attention hijackers
    for (let i = 0; i < blockTypes.length - 1; i++) {
        if (ATTENTION_HIJACKERS.has(blockTypes[i]) && ATTENTION_HIJACKERS.has(blockTypes[i + 1])) {
            violations.push({
                rule: 'consecutive_hijackers',
                detail: `Consecutive attention hijackers: ${blockTypes[i]}, ${blockTypes[i + 1]}`,
            });
        }
    }

    // Rule 4: Minimum spacing between attention hijackers (>=2 blocks apart)
    const hijackerPositions = blockTypes
        .map((t, i) => ATTENTION_HIJACKERS.has(t) ? i : -1)
        .filter(i => i !== -1);
    for (let i = 0; i < hijackerPositions.length - 1; i++) {
        const gap = hijackerPositions[i + 1] - hijackerPositions[i];
        if (gap < 3) { // less than 2 blocks between them
            violations.push({
                rule: 'hijacker_spacing',
                detail: `Attention hijackers at positions ${hijackerPositions[i]} and ${hijackerPositions[i + 1]} are only ${gap - 1} blocks apart (minimum 2 required)`,
            });
        }
    }

    // Rule 5: Block count range
    if (blockTypes.length < 8) {
        violations.push({ rule: 'min_blocks', detail: `Only ${blockTypes.length} blocks — minimum is 8` });
    }
    if (blockTypes.length > 16) {
        violations.push({ rule: 'max_blocks', detail: `${blockTypes.length} blocks — maximum is 16` });
    }

    return violations;
}

/**
 * Computes the maximum number of high-intensity blocks allowed for a lesson.
 * Climax modules with tension arcs get slightly more budget.
 */
export function computeDramaticBudget(moduleMood: string, arcType: string): number {
    if (moduleMood === 'climax' && arcType === 'tension_first') return 3;
    if (moduleMood === 'climax') return 2;
    if (arcType === 'micro' || arcType === 'exploratory') return 1;
    return 2; // standard default
}
