// lib/ai/conductor/types.ts

export type ArcType = 'micro' | 'standard' | 'tension_first' | 'exploratory';

export type BeatName = 'calm' | 'building' | 'tension' | 'insight' | 'reward';

export type LessonPersonality = 'calm' | 'electric' | 'cinematic' | 'technical' | 'warm' | 'stark';

export type ModuleMood = 'opening' | 'building' | 'climax' | 'resolution';

export type SignatureMomentType = 'neural_map' | 'cinematic_moment' | 'signal_interrupt' | 'time_capsule';

export interface Beat {
    name: BeatName;
    /** Block types the generator is encouraged to place in this beat */
    allowedBlockTypes: readonly string[];
    /** 0–1 emotional intensity — used by anti-chaos rules */
    intensity: number;
}

export interface ConductorMemory {
    /** Intensity (0–1) of the final block in the previous lesson. 0 if first lesson. */
    previousLessonEndIntensity: number;
    /** Which signature moments have already fired in this course. */
    firedSignatureMoments: SignatureMomentType[];
    /** Block types used in each of the last 3 lessons. Prevents type repetition across lessons. */
    recentBlockTypeHistory: string[][];
}

export interface ConductorContext {
    /** 0-based index of this lesson within its module */
    lessonIndex: number;
    totalLessonsInModule: number;
    /** 0-based index of this lesson's module within the course */
    moduleIndex: number;
    totalModulesInCourse: number;
    moduleMood: ModuleMood;
    /** archetype_id from CourseDNA, e.g. "clinical", "bold", "quantum_terminal" */
    courseArchetype: string;
    memory: ConductorMemory;
}

export interface SignatureMomentPlacement {
    /** Index into the arc's beatSequence array where the signature moment should be injected */
    beatIndex: number;
    type: SignatureMomentType;
}

export interface ConductorOutput {
    arcType: ArcType;
    beatSequence: Beat[];
    /** Max number of blocks with intensity >= 0.7 allowed in this lesson */
    dramaticBudget: number;
    lessonPersonality: LessonPersonality;
    signatureMoment: SignatureMomentPlacement | null;
    /** 0–11 index into the 12-colour LESSON_ACCENT_CYCLE in block-renderer */
    lessonAccentIndex: number;
    /** Seeded integer for micro-variation (border-radius noise, glow intensity, spacing offsets) */
    microVariationSeed: number;
    /** Human-readable rhythm directive injected into LessonExpanderAgent system prompt */
    conductorNotes: string;
}

// ── Spec v1.0: pedagogical sequence overrides ──────────────────────────────

export type ArcConstraintOverride =
    | { constraint: 'hook_position_limit';     newParams: { maxPosition: number } }
    | { constraint: 'contrast_before_hook';    newParams: { allowed: boolean } }
    | { constraint: 'process_position_strict'; newParams: { strict: boolean } };

export interface ArcDefinition {
    beats: readonly Beat[];
    description: string;
    sequenceOverride?: ArcConstraintOverride[];
}
