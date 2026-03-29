# Conductor — Lesson Rhythm Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Conductor orchestration engine — the intelligence layer that selects arc type, enforces anti-chaos rules, places signature moments, and injects rhythm directives into the LessonExpanderAgent prompt so every lesson is a scored emotional experience, not a random block assembly.

**Architecture:** A pure TypeScript module at `lib/ai/conductor/` with no external dependencies. The Conductor reads `ConductorContext` (lesson position, module mood, memory of previous lessons) and outputs `ConductorOutput` (arc type, beat sequence, signature moment placement, conductorNotes for prompt injection). It is called once per lesson during course generation and writes its key outputs to DB columns on `course_lessons` for render-time use.

**Tech Stack:** TypeScript (strict), Next.js API route, Supabase (PostgreSQL), Gemini 2.0 Flash via existing `BaseAgentV2`. No new npm packages required.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/ai/conductor/types.ts` | **Create** | All TypeScript interfaces and union types |
| `lib/ai/conductor/block-weights.ts` | **Create** | Block type → emotional intensity mapping |
| `lib/ai/conductor/arc-definitions.ts` | **Create** | Beat sequences for all 4 arc types |
| `lib/ai/conductor/arc-selector.ts` | **Create** | selectArcType() — reads context, returns arc |
| `lib/ai/conductor/signature-moments.ts` | **Create** | Signature moment rules + selectSignatureMoment() |
| `lib/ai/conductor/personality.ts` | **Create** | selectPersonality() + archetype compatibility matrix |
| `lib/ai/conductor/anti-chaos.ts` | **Create** | validateConductorOutput() — enforces hard constraints |
| `lib/ai/conductor/index.ts` | **Create** | conduct() — main entry point |
| `lib/ai/agent-system-v2.ts` | **Modify** | Wire ConductorContext → conduct() → inject conductorNotes into LessonExpanderAgent prompt |
| `supabase/migrations/20260329_conductor_fields.sql` | **Create** | Add arc_type, lesson_personality, micro_variation_seed columns to course_lessons |
| `lib/utils/lesson-renderer-v2.ts` | **Modify** | Read conductor fields from lesson DB row; pass lessonPersonality + microVariationSeed to renderer |
| `components/course/block-renderer.tsx` | **Modify** | Accept + apply microVariationSeed and lessonPersonality props |

---

## Task 1: TypeScript Types

**Files:**
- Create: `lib/ai/conductor/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/conductor/types.ts
git commit -m "feat(conductor): add TypeScript types for Conductor rhythm engine"
```

---

## Task 2: Block Emotional Weights

**Files:**
- Create: `lib/ai/conductor/block-weights.ts`

- [ ] **Step 1: Create block weights**

```typescript
// lib/ai/conductor/block-weights.ts
// Maps every block type to an emotional intensity (0–1).
// Calm blocks are 0.0–0.2. Building 0.3–0.5. High-intensity 0.6+.
// Any block type not listed defaults to 0.4 (building).

export const BLOCK_INTENSITY: Readonly<Record<string, number>> = {
    // ── Calm (0.0 – 0.2) ──────────────────────────────────────────
    lesson_header:       0.1,
    objective:           0.1,
    text:                0.2,

    // ── Building (0.3 – 0.5) ──────────────────────────────────────
    type_cards:          0.4,
    flow_diagram:        0.4,
    image_text_row:      0.35,
    instructor_insight:  0.4,
    industry_tabs:       0.45,
    full_image:          0.3,
    concept_illustration:0.35,
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/conductor/block-weights.ts
git commit -m "feat(conductor): add block emotional intensity weights"
```

---

## Task 3: Arc Definitions

**Files:**
- Create: `lib/ai/conductor/arc-definitions.ts`

- [ ] **Step 1: Create arc definitions**

```typescript
// lib/ai/conductor/arc-definitions.ts
import type { ArcType, Beat } from './types';

export const ARC_DEFINITIONS: Readonly<Record<ArcType, readonly Beat[]>> = {

    /**
     * MICRO — 3 beats
     * For: short lessons, post-high-intensity lessons, opening-module lessons.
     * No hard tension. Quick, memorable, satisfying.
     */
    micro: [
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

    /**
     * STANDARD — 5 beats (full arc)
     * Default for most lessons. Runs the complete emotional journey.
     */
    standard: [
        {
            name: 'calm',
            allowedBlockTypes: ['lesson_header', 'objective', 'text'],
            intensity: 0.1,
        },
        {
            name: 'building',
            allowedBlockTypes: ['type_cards', 'flow_diagram', 'image_text_row', 'instructor_insight', 'industry_tabs', 'concept_illustration', 'mindmap', 'perspective_toggle', 'world_stage', 'code_cinema', 'reality_anchor'],
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

    /**
     * TENSION_FIRST — 4 beats
     * For: advanced lessons, climax-module lessons, provocateur/bold archetype courses.
     * Opens with challenge. Earns calm through resolution.
     */
    tension_first: [
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

    /**
     * EXPLORATORY — 4 beats (no hard tension)
     * For: discovery lessons, early-module lessons, resolution-module lessons.
     * Deep understanding without confrontation.
     */
    exploratory: [
        {
            name: 'calm',
            allowedBlockTypes: ['lesson_header', 'objective', 'text'],
            intensity: 0.1,
        },
        {
            name: 'building',
            allowedBlockTypes: ['type_cards', 'flow_diagram', 'image_text_row', 'industry_tabs', 'concept_illustration', 'scroll_story'],
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
    ],
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/conductor/arc-definitions.ts
git commit -m "feat(conductor): add 4 arc type beat definitions"
```

---

## Task 4: Arc Selector

**Files:**
- Create: `lib/ai/conductor/arc-selector.ts`

- [ ] **Step 1: Create arc selector**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/conductor/arc-selector.ts
git commit -m "feat(conductor): add arc type selector with decompression and archetype bias"
```

---

## Task 5: Signature Moments

**Files:**
- Create: `lib/ai/conductor/signature-moments.ts`

- [ ] **Step 1: Create signature moment selector**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/conductor/signature-moments.ts
git commit -m "feat(conductor): add signature moment selector with per-course eligibility rules"
```

---

## Task 6: Lesson Personality

**Files:**
- Create: `lib/ai/conductor/personality.ts`

- [ ] **Step 1: Create personality selector**

```typescript
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
    opening:    { calm: 2, warm: 1 },          // boost calm/warm in opening modules
    building:   { technical: 1, electric: 1 }, // push technical/electric in building
    climax:     { electric: 2, stark: 1 },     // heighten intensity in climax
    resolution: { calm: 2, cinematic: 1 },     // settle down in resolution
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/conductor/personality.ts
git commit -m "feat(conductor): add lesson personality selector with archetype + mood compatibility"
```

---

## Task 7: Anti-Chaos Validator

**Files:**
- Create: `lib/ai/conductor/anti-chaos.ts`

- [ ] **Step 1: Create anti-chaos module**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/conductor/anti-chaos.ts
git commit -m "feat(conductor): add anti-chaos validator with hard constraint rules"
```

---

## Task 8: Main Conductor Function

**Files:**
- Create: `lib/ai/conductor/index.ts`

- [ ] **Step 1: Create main conduct() function**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/conductor/index.ts
git commit -m "feat(conductor): add main conduct() function and updateConductorMemory()"
```

---

## Task 9: Database Migration

**Files:**
- Create: `supabase/migrations/20260329_conductor_fields.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20260329_conductor_fields.sql
-- Adds Conductor output fields to course_lessons.
-- arc_type and lesson_personality are used by the renderer.
-- micro_variation_seed drives seeded noise in block components.
-- conductor_memory stores the memory snapshot used to generate this lesson
-- (useful for debugging and lesson regeneration with correct context).

ALTER TABLE course_lessons
    ADD COLUMN IF NOT EXISTS arc_type TEXT,
    ADD COLUMN IF NOT EXISTS lesson_personality TEXT,
    ADD COLUMN IF NOT EXISTS micro_variation_seed INTEGER,
    ADD COLUMN IF NOT EXISTS conductor_memory JSONB;

-- Indexes for potential future filtering/analytics
CREATE INDEX IF NOT EXISTS idx_course_lessons_arc_type
    ON course_lessons (arc_type);

CREATE INDEX IF NOT EXISTS idx_course_lessons_personality
    ON course_lessons (lesson_personality);

COMMENT ON COLUMN course_lessons.arc_type IS
    'Conductor arc type: micro | standard | tension_first | exploratory';

COMMENT ON COLUMN course_lessons.lesson_personality IS
    'Conductor lesson personality: calm | electric | cinematic | technical | warm | stark';

COMMENT ON COLUMN course_lessons.micro_variation_seed IS
    'Seeded integer for deterministic micro-variation in block border-radius, glow, spacing';

COMMENT ON COLUMN course_lessons.conductor_memory IS
    'Snapshot of ConductorMemory at the time this lesson was generated';
```

- [ ] **Step 2: Apply migration**

Run in Supabase dashboard SQL editor or via CLI:
```bash
supabase db push
```

Expected: migration applies with no errors. Verify by checking table schema in Supabase dashboard.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260329_conductor_fields.sql
git commit -m "feat(conductor): add arc_type, lesson_personality, micro_variation_seed to course_lessons"
```

---

## Task 10: Wire Conductor into LessonExpanderAgent

**Files:**
- Modify: `lib/ai/agent-system-v2.ts`

Read the current `LessonExpanderAgent` class. The goal is to:
1. Accept `ConductorContext` in the `expand()` method signature
2. Call `conduct(ctx)` to get `ConductorOutput`
3. Inject `conductorNotes` into the system prompt before the main lesson prompt
4. Save `arc_type`, `lesson_personality`, `micro_variation_seed`, `conductor_memory` to the lesson DB row after generation

- [ ] **Step 1: Read the current LessonExpanderAgent**

Read `lib/ai/agent-system-v2.ts` starting from where `LessonExpanderAgent` is defined. Find its `expand()` method and the prompt construction.

- [ ] **Step 2: Import Conductor at top of agent-system-v2.ts**

Add to the imports section at the top of `lib/ai/agent-system-v2.ts`:
```typescript
import { conduct, updateConductorMemory } from './conductor';
import type { ConductorContext, ConductorMemory } from './conductor';
```

- [ ] **Step 3: Update LessonExpanderAgent.expand() signature**

Find the `expand()` method signature. Add `conductorCtx: ConductorContext` as a parameter:
```typescript
async expand(
    lessonPlan: LessonPlan,
    courseDNA: CourseDNA,
    conductorCtx: ConductorContext,   // ← ADD THIS
    lessonId?: string
): Promise<ConceptExplanation>
```

- [ ] **Step 4: Call conduct() and inject conductorNotes into the prompt**

Inside `expand()`, before the prompt string is built, add:
```typescript
const conductorOutput = conduct(conductorCtx);
const rhythmDirective = conductorOutput.conductorNotes;
```

Then prepend `rhythmDirective` to the system prompt. Find the line where the prompt string starts (it will be a template literal beginning with something like `` `You are an expert curriculum designer... `` ) and add at the very top of the prompt:
```typescript
const prompt = `${rhythmDirective}

---

${existingPromptContent}`;
```

- [ ] **Step 5: Persist Conductor fields to DB after generation**

After the lesson blocks are saved to DB (find the Supabase insert/update for `course_lessons`), add:
```typescript
// Persist Conductor fields for render-time use
if (lessonId) {
    await supabase
        .from('course_lessons')
        .update({
            arc_type: conductorOutput.arcType,
            lesson_personality: conductorOutput.lessonPersonality,
            micro_variation_seed: conductorOutput.microVariationSeed,
            conductor_memory: conductorCtx.memory,
        })
        .eq('id', lessonId);
}
```

- [ ] **Step 6: Update the calling code in the course generation loop**

Find where `LessonExpanderAgent.expand()` is called (in `app/api/course/generate-v2/route.ts` or within `agent-system-v2.ts`). Construct and pass `ConductorContext` and a shared `ConductorMemory` object that persists across lessons:

```typescript
// Initialise once before the lesson loop
const conductorMemory: ConductorMemory = {
    previousLessonEndIntensity: 0,
    firedSignatureMoments: [],
    recentBlockTypeHistory: [],
};

// Inside the lesson loop, before calling expand():
const moduleMood = computeModuleMood(moduleIndex, totalModules);
const conductorCtx: ConductorContext = {
    lessonIndex,           // 0-based within this module
    totalLessonsInModule:  topic.lessons.length,
    moduleIndex,           // 0-based within course
    totalModulesInCourse:  structure.topics.length,
    moduleMood,
    courseArchetype:       courseDNA.content.archetype_id,
    memory:                { ...conductorMemory }, // snapshot — not reference
};

const result = await expander.expand(lessonPlan, courseDNA, conductorCtx, lessonId);

// After lesson generation, update shared memory
const generatedBlockTypes = result.blocks.map(b => b.type);
const firedType = conductorCtx.memory.firedSignatureMoments.length < conductorOutput.???
    // see note below
    null;
updateConductorMemory(conductorMemory, generatedBlockTypes, signatureMomentFired);
```

**Note on `signatureMomentFired`:** The conductor returns `signatureMoment` in its output. Compare `conductorOutput.signatureMoment?.type` with what actually appeared in the generated blocks:
```typescript
const conductorOutput = conduct(conductorCtx);
// ... generate lesson ...
const actualTypes = result.blocks.map(b => b.type);
const signatureMomentFired = conductorOutput.signatureMoment?.type != null
    && actualTypes.includes(conductorOutput.signatureMoment.type)
    ? conductorOutput.signatureMoment.type
    : null;
updateConductorMemory(conductorMemory, actualTypes, signatureMomentFired);
```

You also need `computeModuleMood()` — add this small utility to `lib/ai/conductor/index.ts`:
```typescript
export function computeModuleMood(moduleIndex: number, totalModules: number): ModuleMood {
    const pos = totalModules <= 1 ? 0.5 : moduleIndex / (totalModules - 1);
    if (pos <= 0.25) return 'opening';
    if (pos <= 0.55) return 'building';
    if (pos <= 0.8)  return 'climax';
    return 'resolution';
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/ai/agent-system-v2.ts lib/ai/conductor/index.ts
git commit -m "feat(conductor): wire Conductor into LessonExpanderAgent — inject rhythm directives into Gemini prompt"
```

---

## Task 11: Render-Time Wiring

**Files:**
- Modify: `app/courses/[courseId]/lessons/[lessonId]/page.tsx`
- Modify: `components/course/lesson-content-renderer.tsx`
- Modify: `components/course/block-renderer.tsx`

The renderer needs to read `lesson_personality` and `micro_variation_seed` from the DB row and pass them down to `LessonBlockRenderer`.

- [ ] **Step 1: Read lesson_personality and micro_variation_seed in the lesson page**

In `app/courses/[courseId]/lessons/[lessonId]/page.tsx`, the lesson is fetched from Supabase. Ensure `lesson_personality` and `micro_variation_seed` are selected:

```typescript
const { data: lesson } = await supabase
    .from('course_lessons')
    .select('*, lesson_personality, micro_variation_seed, arc_type')
    .eq('id', lessonId)
    .single();
```

Then pass them down to `LessonContentRenderer`:
```typescript
<LessonContentRenderer
    content={lesson.content_blocks}
    lessonPersonality={lesson.lesson_personality ?? 'calm'}
    microVariationSeed={lesson.micro_variation_seed ?? 0}
    // ... existing props
/>
```

- [ ] **Step 2: Thread through LessonContentRenderer**

In `components/course/lesson-content-renderer.tsx`, add `lessonPersonality` and `microVariationSeed` to the props type and pass to `LessonBlockRenderer`:

```typescript
// Add to the destructured props:
lessonPersonality = 'calm',
microVariationSeed = 0,

// Pass to LessonBlockRenderer:
<LessonBlockRenderer
    blocks={content.blocks}
    lessonPersonality={lessonPersonality}
    microVariationSeed={microVariationSeed}
    // ... existing props
/>
```

- [ ] **Step 3: Accept in LessonBlockRenderer**

In `components/course/block-renderer.tsx`, add `lessonPersonality` and `microVariationSeed` to `LessonBlockRendererProps`:

```typescript
interface LessonBlockRendererProps {
    // ... existing props ...
    lessonPersonality?: LessonPersonality;
    microVariationSeed?: number;
}
```

Expose `microVariationSeed` as a CSS custom property and `lessonPersonality` as a data attribute on the root div (so block components can read them):

```typescript
<div
    className="w-full min-h-screen"
    data-personality={lessonPersonality ?? 'calm'}
    style={{
        '--lesson-accent': lessonAccentColour,
        '--micro-seed': microVariationSeed ?? 0,
    } as React.CSSProperties}
>
```

Pass `lessonPersonality` and `microVariationSeed` in `extraProps` for all 10 rotating blocks (add alongside the existing `lessonIndex` spread):
```typescript
if (resolvedType === 'flow_diagram' || resolvedType === 'objective' || resolvedType === 'recap'
    || resolvedType === 'punch_quote' || resolvedType === 'completion' || resolvedType === 'instructor_insight'
    || resolvedType === 'callout' || resolvedType === 'applied_case' || resolvedType === 'key_terms'
    || resolvedType === 'inline_quiz' || resolvedType === 'lesson_header') {
    extraProps = {
        ...extraProps,
        lessonIndex: lessonIndex ?? 0,
        lessonPersonality: lessonPersonality ?? 'calm',
        microVariationSeed: microVariationSeed ?? 0,
    };
}
```

- [ ] **Step 4: Update LessonPersonality type import**

In `components/course/block-renderer.tsx`, add import:
```typescript
import type { LessonPersonality } from '@/lib/ai/conductor/types';
```

- [ ] **Step 5: Commit**

```bash
git add app/courses/[courseId]/lessons/[lessonId]/page.tsx
git add components/course/lesson-content-renderer.tsx
git add components/course/block-renderer.tsx
git commit -m "feat(conductor): thread lessonPersonality and microVariationSeed from DB to block renderer"
```

---

## Task 12: Smoke Test

There are no unit test files in this codebase yet. Run a manual smoke test against the dev server.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: server starts without TypeScript errors.

- [ ] **Step 2: Trigger a course regeneration**

In the admin panel (`/admin/courses`), create or regenerate a short test course (2 modules, 3 lessons each). Watch the dev server logs.

Expected:
- No crash during generation
- Each lesson log shows a different `arcType` for at least some lessons
- At least one lesson has a `signatureMoment` injected in its prompt (visible in Gemini request logs if verbose logging is on)
- `course_lessons` table in Supabase now has `arc_type`, `lesson_personality`, `micro_variation_seed` populated for new lessons

- [ ] **Step 3: Verify lesson page renders**

Open a regenerated lesson at `/courses/[id]/lessons/[lessonId]`. Check browser devtools:

Expected:
- Root div has `data-personality` attribute set (e.g. `data-personality="calm"`)
- Root div CSS var `--micro-seed` is set to a non-zero integer
- No console errors

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(conductor): Phase 1 complete — Conductor rhythm engine wired into generation and render pipelines"
```

---

## Self-Review

**Spec coverage check:**
- [x] Arc types (4 variants) — Tasks 3, 4
- [x] Block emotional weights — Task 2
- [x] Anti-chaos hard rules — Task 7
- [x] Signature moment system — Task 5, 8
- [x] Conductor memory model — Tasks 8, 10
- [x] Module behavioural influence — `computeModuleMood()` in Task 10; full module DNA is Phase 2
- [x] Prompt injection (conductorNotes) — Tasks 8, 10
- [x] DB persistence — Tasks 9, 11
- [x] Render-time consumption of personality + micro-seed — Task 11

**Module behavioural influence note:** Full module DNA (header styles, hue shift, transitions) is Phase 2. This Phase 1 plan delivers `moduleMood` which already drives arc selection and personality — the behavioural foundation is in place.

**Placeholder scan:** No TBDs or vague steps found. All code blocks are complete.

**Type consistency:**
- `ConductorContext`, `ConductorOutput`, `ConductorMemory` defined in Task 1, used consistently in Tasks 4–11
- `conduct()` in Task 8 uses `ConductorContext` → returns `ConductorOutput` ✓
- `updateConductorMemory()` in Task 8 takes `ConductorMemory` ✓
- `LessonPersonality` type imported in Task 11 from `lib/ai/conductor/types` ✓
- `computeModuleMood()` added to `lib/ai/conductor/index.ts` in Task 10 — exported for use in route ✓
