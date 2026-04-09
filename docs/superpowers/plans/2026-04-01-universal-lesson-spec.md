# Universal Lesson Generation Spec v1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce a 9-step pedagogical structure across all AI Bytes lesson generation, validated at insert time and backfilled into existing lessons.

**Architecture:** 6-layer stack — Types → Components → Validator → Conductor → Generator prompt → Route gate — with a one-time backfill script for legacy lessons. The validator is constraint-based (dependency rules, not positional ordering) and is introduced behind an env-var gate before being enforced. All 4 new block types get React components and analytics tags.

**Tech Stack:** TypeScript, Next.js 16 App Router, Supabase (Postgres), Gemini 2.0 Flash, Vitest (unit tests — new devDependency), Playwright (existing e2e)

---

## Pre-Implementation Findings (READ BEFORE STARTING)

Two discrepancies between spec and codebase found during planning:

**1. `PredictionBlock` already exists** in `lib/types/lesson-blocks.ts` with a different schema:
```typescript
// EXISTING (keep this — do not change the interface)
interface PredictionBlock {
  type: "prediction";
  question: string;      // not "prompt"
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  reveal: string;
  accentColour?: "pulse" | "iris" | "amber";
}
```
The spec defined a different `prediction` interface (`prompt`/`hint`). **Resolution:** Keep the existing schema. Add only `analytics_tag?: 'prediction'` as optional. The validator checks `type === 'prediction'` only — no field inspection needed for ordering.

**2. `core_explanation` does not exist** as a block type. The spec document incorrectly called it "existing". It maps logically to the `text` block. **Resolution:** Add `core_explanation` as a new block type with the same fields as `text`. The renderer maps it to `TextSection`. The generator is instructed to use `core_explanation` for the primary explanatory block.

---

## File Map

### New files
| File | What it does |
|---|---|
| `components/course/blocks/hook.tsx` | Renders `hook` block — 4 style variants |
| `components/course/blocks/teaching-line.tsx` | Renders `teaching_line` block |
| `components/course/blocks/mental-checkpoint.tsx` | Renders `mental_checkpoint` block with interaction |
| `supabase/migrations/20260402_spec_v1_columns.sql` | Adds 5 columns to `course_lessons` |
| `scripts/inject-spec-blocks.ts` | Legacy backfill script |
| `lib/ai/conductor/__tests__/arc-overrides.test.ts` | Vitest unit tests for arc override logic |
| `lib/ai/content-sanitizer/__tests__/validator.test.ts` | Vitest unit tests for validateLessonPedagogy |
| `lib/ai/content-sanitizer/__tests__/repair.test.ts` | Vitest unit tests for repairLessonSequence |
| `vitest.config.ts` | Vitest configuration |

### Modified files
| File | What changes |
|---|---|
| `lib/types/lesson-blocks.ts` | Add `HookBlock`, `TeachingLineBlock`, `MentalCheckpointBlock`, `CoreExplanationBlock`; add `analytics_tag?` to `PredictionBlock`; extend `ContentBlock` union |
| `components/course/block-renderer.tsx` | Add 4 new entries to `BLOCK_COMPONENTS` + width sets |
| `lib/ai/content-sanitizer.ts` | Add `validateLessonPedagogy()`, `repairLessonSequence()`, phase map, constraint definitions, required-field defaults for new types |
| `lib/ai/conductor/types.ts` | Add `ArcConstraintOverride` discriminated union, `ArcDefinition` interface |
| `lib/ai/conductor/arc-definitions.ts` | Restructure from `Record<ArcType, Beat[]>` to `Record<ArcType, ArcDefinition>`; add `sequenceOverride` to `tension_first` and `exploratory` |
| `lib/ai/conductor/index.ts` | Update `ARC_DEFINITIONS[arcType]` → `ARC_DEFINITIONS[arcType].beats`; add SEQUENCE ADJUSTMENT to `buildConductorNotes()` |
| `lib/ai/agent-system-v2.ts` | Inject universal spec block into `LessonExpanderAgent` prompt |
| `app/api/course/generate-v2/route.ts` | Wire `validateLessonPedagogy` + `repairLessonSequence`; set new DB columns on insert |
| `package.json` | Add `vitest`, `@vitest/coverage-v8` as devDependencies |

---

## Phase 1 — Schema & Types

### Task 1: Install Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

```bash
cd "D:\ai-bytes-leaning-22nd-feb-2026 Backup"
npm install --save-dev vitest @vitest/coverage-v8
```

Expected: vitest appears in `package.json` devDependencies.

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest works**

Create `lib/ai/content-sanitizer/__tests__/validator.test.ts` (placeholder):
```typescript
import { describe, it, expect } from 'vitest';

describe('placeholder', () => {
  it('runs', () => {
    expect(true).toBe(true);
  });
});
```

Run: `npm test`
Expected: 1 test passes.

- [ ] **Step 5: Commit**
```bash
git add vitest.config.ts package.json package-lock.json lib/ai/content-sanitizer/__tests__/validator.test.ts
git commit -m "chore: add vitest for unit testing"
```

---

### Task 2: Add new block type interfaces

**Files:**
- Modify: `lib/types/lesson-blocks.ts`

- [ ] **Step 1: Write failing test** (validates the type exports exist at runtime via shape check)

In `lib/ai/content-sanitizer/__tests__/validator.test.ts`, replace the placeholder:
```typescript
import { describe, it, expect } from 'vitest';

// Shape-check: these will fail to compile if interfaces are wrong
describe('new block type shapes', () => {
  it('HookBlock has required fields', () => {
    const block = {
      type: 'hook' as const,
      id: 'blk_001',
      order: 1,
      content: 'What if every email you wrote was 40% more effective?',
      hook_style: 'question' as const,
      analytics_tag: 'hook' as const,
    };
    expect(block.type).toBe('hook');
    expect(block.analytics_tag).toBe('hook');
  });

  it('TeachingLineBlock has required fields', () => {
    const block = {
      type: 'teaching_line' as const,
      id: 'blk_002',
      order: 8,
      line: 'Prompt engineering is about giving context, not just commands.',
      support: 'A model responds to what it is told; give it a role and a constraint and it behaves differently.',
      analytics_tag: 'teaching_line' as const,
    };
    expect(block.type).toBe('teaching_line');
    expect(block.line.split(' ').length).toBeLessThanOrEqual(25);
  });

  it('MentalCheckpointBlock requires options for confidence_pick', () => {
    const block = {
      type: 'mental_checkpoint' as const,
      id: 'blk_003',
      order: 7,
      prompt: 'How confident are you that you could write a structured prompt right now?',
      checkpoint_style: 'confidence_pick' as const,
      response_mode: 'confidence' as const,
      options: ['Got it', 'Mostly', 'Lost me'],
      analytics_tag: 'mental_checkpoint' as const,
    };
    expect(block.options).toHaveLength(3);
  });

  it('CoreExplanationBlock has paragraphs array', () => {
    const block = {
      type: 'core_explanation' as const,
      id: 'blk_004',
      order: 3,
      heading: 'What Is Prompt Engineering?',
      paragraphs: ['Prompt engineering is the practice of writing instructions for AI models.'],
      analytics_tag: 'core_explanation' as const,
    };
    expect(Array.isArray(block.paragraphs)).toBe(true);
  });
});
```

Run: `npm test`
Expected: FAIL — types don't exist yet.

- [ ] **Step 2: Add new interfaces to `lib/types/lesson-blocks.ts`**

After the last interface (`InstructorInsightBlock`) and before the closing of the file, add:

```typescript
export interface HookBlock extends BaseBlock {
    type: 'hook';
    content: string;        // opening question, scenario, statistic, or contradiction
    hook_style: 'question' | 'scenario' | 'statistic' | 'contradiction';
    visual_prompt?: string;
    analytics_tag: 'hook';
    // is_placeholder and backfill_injected are runtime-only; not in the type interface
}

export interface TeachingLineBlock extends BaseBlock {
    type: 'teaching_line';
    line: string;           // exactly 1 sentence, max 25 words, no trailing colon
    support: string;        // 1-2 sentences expanding the line
    analytics_tag: 'teaching_line';
}

export interface MentalCheckpointBlock extends BaseBlock {
    type: 'mental_checkpoint';
    prompt: string;
    checkpoint_style: 'reflection' | 'predict' | 'confidence_pick';
    response_mode: 'reflective' | 'diagnostic' | 'confidence';
    options?: string[];     // required when checkpoint_style === 'confidence_pick'
    analytics_tag: 'mental_checkpoint';
}

export interface CoreExplanationBlock extends BaseBlock {
    type: 'core_explanation';
    heading?: string;
    paragraphs: string[];   // each paragraph 2-3 sentences max
    analytics_tag: 'core_explanation';
}
```

- [ ] **Step 3: Add `analytics_tag` to `PredictionBlock` (non-breaking)**

Find the existing `PredictionBlock` interface and add one optional field:

```typescript
export interface PredictionBlock extends BaseBlock {
    type: "prediction";
    question: string;
    options: [string, string, string];
    correctIndex: 0 | 1 | 2;
    reveal: string;
    accentColour?: "pulse" | "iris" | "amber";
    analytics_tag?: 'prediction';   // ← add this line only
}
```

- [ ] **Step 4: Add new types to the `ContentBlock` union**

Find:
```typescript
export type ContentBlock =
    | HeroVideoBlock
    ...
    | InstructorInsightBlock;
```

Replace with:
```typescript
export type ContentBlock =
    | HeroVideoBlock
    | LessonHeaderBlock
    | ObjectiveBlock
    | TextBlock
    | FullImageBlock
    | ImageTextRowBlock
    | TypeCardsBlock
    | CalloutBlock
    | IndustryTabsBlock
    | QuizBlock
    | CompletionBlock
    | KeyTermsBlock
    | InteractiveVisBlock
    | AppliedCaseBlock
    | RecapBlock
    | ExpandableBlock
    | VideoSnippetBlock
    | AudioRecapProminentBlock
    | PunchQuoteBlock
    | PredictionBlock
    | MindmapBlock
    | FlowDiagramBlock
    | ConceptIllustrationBlock
    | OpenExerciseBlock
    | InstructorInsightBlock
    | HookBlock
    | TeachingLineBlock
    | MentalCheckpointBlock
    | CoreExplanationBlock;
```

- [ ] **Step 5: Run test**

Run: `npm test`
Expected: All 4 shape tests pass.

- [ ] **Step 6: Commit**
```bash
git add lib/types/lesson-blocks.ts lib/ai/content-sanitizer/__tests__/validator.test.ts
git commit -m "feat(types): add HookBlock, TeachingLineBlock, MentalCheckpointBlock, CoreExplanationBlock"
```

---

### Task 3: Create DB migration

**Files:**
- Create: `supabase/migrations/20260402_spec_v1_columns.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260402_spec_v1_columns.sql
-- Adds pedagogical spec compliance tracking columns to course_lessons

ALTER TABLE course_lessons
  ADD COLUMN IF NOT EXISTS schema_version            TEXT    DEFAULT '2.0',
  ADD COLUMN IF NOT EXISTS pedagogical_spec_version  TEXT    DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS spec_compliant            BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS spec_migrated             BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_spec_placeholders     BOOLEAN DEFAULT FALSE;

-- Back-fill schema_version for existing lessons
UPDATE course_lessons
SET schema_version = '1.0',
    pedagogical_spec_version = '0.0'
WHERE schema_version = '2.0';
-- Note: the DEFAULT '2.0' above only applies to NEW rows.
-- Existing rows get NULL until this UPDATE runs, so we set them to 1.0 explicitly.
-- After applying this migration, run the inject-spec-blocks.ts backfill script.

COMMENT ON COLUMN course_lessons.spec_compliant IS
  'TRUE if validateLessonPedagogy passed at insert time or after backfill';
COMMENT ON COLUMN course_lessons.spec_migrated IS
  'TRUE if lesson was upgraded by inject-spec-blocks.ts backfill script';
COMMENT ON COLUMN course_lessons.has_spec_placeholders IS
  'TRUE if any required spec block was injected as a placeholder (needs editorial review)';
```

- [ ] **Step 2: Apply the migration**

```bash
cd "D:\ai-bytes-leaning-22nd-feb-2026 Backup"
npx supabase db push
```

Expected output includes: `Applying migration 20260402_spec_v1_columns.sql`

If Supabase CLI is not linked: run `npx supabase link` first with your project ref.

- [ ] **Step 3: Verify columns exist**

Run a quick check:
```bash
npx supabase db diff --linked
```
Expected: no pending migrations.

- [ ] **Step 4: Commit**
```bash
git add supabase/migrations/20260402_spec_v1_columns.sql
git commit -m "feat(db): add spec compliance columns to course_lessons"
```

---

## Phase 2 — Rendering Layer

### Task 4: Build `hook.tsx` component

**Files:**
- Create: `components/course/blocks/hook.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { motion } from "framer-motion";
import { useCourseDNA } from "../course-dna-provider";

// Mode 0 — Question card with accent border
function HookQuestion({ content, accent }: { content: string; accent: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            data-analytics-tag="hook"
            className="relative mb-6 rounded-2xl p-8 border"
            style={{ borderColor: `${accent}30`, background: `color-mix(in srgb, ${accent} 4%, #0f0f18)` }}
        >
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }} />
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] mb-4"
                style={{ color: `${accent}70` }}>Before we begin</p>
            <p className="font-display text-[1.35rem] font-bold text-white leading-snug">{content}</p>
        </motion.div>
    );
}

// Mode 1 — Scenario/statistic: big number or bold statement
function HookImpact({ content, hook_style, accent }: { content: string; hook_style: string; accent: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            data-analytics-tag="hook"
            className="relative mb-6 rounded-2xl overflow-hidden"
            style={{ background: `color-mix(in srgb, ${accent} 6%, #0e0e1a)` }}
        >
            <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                style={{ background: `radial-gradient(circle at 100% 0%, ${accent}10, transparent 65%)` }} />
            <div className="relative p-8">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] mb-4"
                    style={{ color: `${accent}70` }}>{hook_style}</p>
                <p className="font-display text-[1.4rem] font-bold text-white leading-snug">{content}</p>
            </div>
        </motion.div>
    );
}

// Mode 2 — Contradiction: split layout with opposing framing
function HookContradiction({ content, accent }: { content: string; accent: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            data-analytics-tag="hook"
            className="flex gap-5 mb-6 p-7 rounded-2xl border border-white/[0.06]"
        >
            <div className="w-1 rounded-full shrink-0 self-stretch"
                style={{ background: `linear-gradient(180deg, ${accent}, ${accent}30)` }} />
            <div>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] mb-3"
                    style={{ color: `${accent}70` }}>Consider this</p>
                <p className="font-display text-[1.3rem] font-bold text-white leading-snug">{content}</p>
            </div>
        </motion.div>
    );
}

export function Hook({ content, hook_style, lessonIndex }: any) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || '#00FFB3';
    const mode = (lessonIndex ?? 0) % 3;

    if (hook_style === 'contradiction') return <HookContradiction content={content} accent={accent} />;
    if (mode === 1 || hook_style === 'statistic' || hook_style === 'scenario') {
        return <HookImpact content={content} hook_style={hook_style} accent={accent} />;
    }
    return <HookQuestion content={content} accent={accent} />;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "D:\ai-bytes-leaning-22nd-feb-2026 Backup"
npx tsc --noEmit 2>&1 | grep "hook.tsx"
```

Expected: no errors for hook.tsx.

- [ ] **Step 3: Commit**
```bash
git add components/course/blocks/hook.tsx
git commit -m "feat(component): add Hook block component"
```

---

### Task 5: Build `teaching-line.tsx` component

**Files:**
- Create: `components/course/blocks/teaching-line.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { motion } from "framer-motion";
import { useCourseDNA } from "../course-dna-provider";

export function TeachingLine({ line, support, lessonIndex }: any) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || '#00FFB3';
    const mode = (lessonIndex ?? 0) % 3;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            data-analytics-tag="teaching_line"
            className="my-8 max-w-[760px] mx-auto"
        >
            {/* Mode 0: horizontal rule + statement */}
            {mode === 0 && (
                <div>
                    <div className="h-px mb-5"
                        style={{ background: `linear-gradient(90deg, ${accent}50, transparent)` }} />
                    <p className="font-display text-[1.15rem] font-bold text-white leading-snug mb-3">{line}</p>
                    {support && <p className="font-body text-[0.9rem] text-white/60 leading-relaxed">{support}</p>}
                </div>
            )}
            {/* Mode 1: labelled insight card */}
            {mode === 1 && (
                <div className="rounded-xl border p-6"
                    style={{ borderColor: `${accent}20`, background: `color-mix(in srgb, ${accent} 3%, #0f0f18)` }}>
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] mb-3"
                        style={{ color: `${accent}70` }}>The key insight</p>
                    <p className="font-display text-[1.1rem] font-bold text-white leading-snug mb-2">{line}</p>
                    {support && <p className="font-body text-[0.875rem] text-white/55 leading-relaxed">{support}</p>}
                </div>
            )}
            {/* Mode 2: left accent bar */}
            {mode === 2 && (
                <div className="flex gap-5 pl-1">
                    <div className="w-[3px] rounded-full shrink-0 self-stretch"
                        style={{ background: accent }} />
                    <div>
                        <p className="font-display text-[1.15rem] font-bold text-white leading-snug mb-2">{line}</p>
                        {support && <p className="font-body text-[0.875rem] text-white/55 leading-relaxed">{support}</p>}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | grep "teaching-line.tsx"
```
Expected: no errors.

- [ ] **Step 3: Commit**
```bash
git add components/course/blocks/teaching-line.tsx
git commit -m "feat(component): add TeachingLine block component"
```

---

### Task 6: Build `mental-checkpoint.tsx` component

**Files:**
- Create: `components/course/blocks/mental-checkpoint.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCourseDNA } from "../course-dna-provider";

export function MentalCheckpoint({ prompt, checkpoint_style, response_mode, options }: any) {
    const { primary_colour } = useCourseDNA();
    const accent = primary_colour || '#00FFB3';
    const [selected, setSelected] = useState<string | null>(null);

    const defaultOptions = checkpoint_style === 'confidence_pick'
        ? (options ?? ['Got it', 'Mostly there', 'Lost me'])
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            data-analytics-tag="mental_checkpoint"
            className="my-6 rounded-2xl border border-white/[0.07] p-7 bg-white/[0.02]"
        >
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] mb-4 text-white/40">
                {checkpoint_style === 'confidence_pick' ? 'Confidence check'
                    : checkpoint_style === 'predict' ? 'Your prediction'
                    : 'Pause and reflect'}
            </p>
            <p className="font-body text-[1rem] text-white/85 leading-relaxed mb-5">{prompt}</p>

            {defaultOptions && (
                <div className="flex flex-wrap gap-3">
                    {defaultOptions.map((opt: string) => (
                        <button
                            key={opt}
                            onClick={() => setSelected(opt)}
                            className="px-4 py-2 rounded-lg border text-[0.875rem] font-medium transition-all duration-200"
                            style={selected === opt
                                ? { borderColor: accent, color: accent, background: `${accent}15` }
                                : { borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }
                            }
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
            {selected && (
                <p className="mt-4 text-[0.8rem] text-white/40 font-mono">
                    Response recorded — keep going.
                </p>
            )}
        </motion.div>
    );
}
```

- [ ] **Step 2: Verify it compiles**
```bash
npx tsc --noEmit 2>&1 | grep "mental-checkpoint.tsx"
```
Expected: no errors.

- [ ] **Step 3: Commit**
```bash
git add components/course/blocks/mental-checkpoint.tsx
git commit -m "feat(component): add MentalCheckpoint block component"
```

---

### Task 7: Wire all 4 new block types into block-renderer.tsx

**Files:**
- Modify: `components/course/block-renderer.tsx`

- [ ] **Step 1: Add imports** at the top of the import block (after the existing imports):

```typescript
import { Hook } from "./blocks/hook";
import { TeachingLine } from "./blocks/teaching-line";
import { MentalCheckpoint } from "./blocks/mental-checkpoint";
// core_explanation renders via the existing TextSection component
```

- [ ] **Step 2: Add to `BLOCK_COMPONENTS`**

Find the `BLOCK_COMPONENTS` object and add 3 entries:
```typescript
const BLOCK_COMPONENTS: Record<string, React.FC<any>> = {
    // ... existing entries ...
    hook:               Hook,
    teaching_line:      TeachingLine,
    mental_checkpoint:  MentalCheckpoint,
    core_explanation:   TextSection,   // renders identically to text blocks
};
```

- [ ] **Step 3: Add new types to `WIDE_INNER` set**

Find the `WIDE_INNER` Set and add the new types:
```typescript
const WIDE_INNER = new Set([
    // ... existing entries ...
    'hook', 'teaching_line', 'mental_checkpoint', 'core_explanation',
]);
```

- [ ] **Step 4: Verify it compiles**
```bash
npx tsc --noEmit 2>&1 | grep "block-renderer.tsx"
```
Expected: no errors.

- [ ] **Step 5: Commit**
```bash
git add components/course/block-renderer.tsx
git commit -m "feat(renderer): wire hook, teaching_line, mental_checkpoint, core_explanation into block renderer"
```

---

## Phase 3 — Validator & Repair Layer

### Task 8: Add required-field defaults to content-sanitizer.ts

**Files:**
- Modify: `lib/ai/content-sanitizer.ts`

- [ ] **Step 1: Add defaults for new block types**

Find the `BLOCK_REQUIRED_FIELDS` object in `content-sanitizer.ts` and add entries for the 4 new types:

```typescript
const BLOCK_REQUIRED_FIELDS: Record<string, Record<string, unknown>> = {
    // ... existing entries ...
    hook: {
        content:    'What is happening in AI that you might not have noticed yet?',
        hook_style: 'question',
        analytics_tag: 'hook',
    },
    teaching_line: {
        line:    'Understanding this concept changes how you approach the problems it solves.',
        support: 'Keep this in mind as you apply these ideas in practice.',
        analytics_tag: 'teaching_line',
    },
    mental_checkpoint: {
        prompt:           'How would you explain this concept in one sentence to a colleague?',
        checkpoint_style: 'reflection',
        response_mode:    'reflective',
        analytics_tag:    'mental_checkpoint',
    },
    core_explanation: {
        heading:    'Core Concept',
        paragraphs: ['This section covers the essential idea behind this topic.'],
        analytics_tag: 'core_explanation',
    },
};
```

- [ ] **Step 2: Add TYPE_MAP entries for sanitizer normalisation**

Find the `TYPE_MAP` section in `sanitizeBlocks` (the map that normalises compound block type names). Add entries:
```typescript
const TYPE_MAP: Record<string, string> = {
    // ... existing entries ...
    'HOOK': 'hook',
    'TEACHING_LINE': 'teaching_line',
    'MENTAL_CHECKPOINT': 'mental_checkpoint',
    'CORE_EXPLANATION': 'core_explanation',
    'core explanation': 'core_explanation',
};
```

- [ ] **Step 3: Commit**
```bash
git add lib/ai/content-sanitizer.ts
git commit -m "feat(sanitizer): add required field defaults for 4 new spec block types"
```

---

### Task 9: Implement `validateLessonPedagogy()`

**Files:**
- Modify: `lib/ai/content-sanitizer.ts`
- Modify: `lib/ai/content-sanitizer/__tests__/validator.test.ts`

- [ ] **Step 1: Write failing tests first**

Replace the contents of `lib/ai/content-sanitizer/__tests__/validator.test.ts` with:

```typescript
import { describe, it, expect } from 'vitest';
import { validateLessonPedagogy } from '../index';

// Minimal valid lesson with all required blocks
const VALID_BLOCKS = [
  { type: 'lesson_header', id: 'h', order: 0 },
  { type: 'hook',             id: 'b1', order: 1, content: 'What if?', hook_style: 'question', analytics_tag: 'hook' },
  { type: 'prediction',       id: 'b2', order: 2, question: 'What do you predict?', options: ['A','B','C'], correctIndex: 0, reveal: 'A is correct.' },
  { type: 'core_explanation', id: 'b3', order: 3, paragraphs: ['Core content here.'], analytics_tag: 'core_explanation' },
  { type: 'flow_diagram',     id: 'b4', order: 4, steps: [] },
  { type: 'applied_case',     id: 'b5', order: 5, scenario: 'Real case', challenge: 'c', resolution: 'r' },
  { type: 'mental_checkpoint',id: 'b6', order: 6, prompt: 'How confident?', checkpoint_style: 'confidence_pick', response_mode: 'confidence', options: ['Got it','Mostly','Lost me'], analytics_tag: 'mental_checkpoint' },
  { type: 'quiz',             id: 'b7', order: 7, title: 'Quiz', questions: [] },
  { type: 'teaching_line',    id: 'b8', order: 8, line: 'The model learns from patterns, not rules.', support: 'This is why it generalises.', analytics_tag: 'teaching_line' },
  { type: 'recap',            id: 'b9', order: 9, title: 'Recap', points: [] },
];

describe('validateLessonPedagogy — required presence', () => {
  it('returns valid for a correctly structured lesson', () => {
    const result = validateLessonPedagogy(VALID_BLOCKS as any, 'standard');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('errors when hook is missing', () => {
    const blocks = VALID_BLOCKS.filter(b => b.type !== 'hook');
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.constraint === 'hook_exists')).toBe(true);
  });

  it('errors when core_explanation is missing', () => {
    const blocks = VALID_BLOCKS.filter(b => b.type !== 'core_explanation');
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.constraint === 'core_explanation_exists')).toBe(true);
  });

  it('errors when teaching_line is missing', () => {
    const blocks = VALID_BLOCKS.filter(b => b.type !== 'teaching_line');
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.constraint === 'teaching_line_exists')).toBe(true);
  });

  it('errors when mental_checkpoint is missing', () => {
    const blocks = VALID_BLOCKS.filter(b => b.type !== 'mental_checkpoint');
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.constraint === 'mental_checkpoint_exists')).toBe(true);
  });
});

describe('validateLessonPedagogy — dependency ordering', () => {
  it('errors when hook appears after position 2 (standard arc)', () => {
    const blocks = [
      { type: 'lesson_header', id: 'h', order: 0 },
      { type: 'text', id: 't', order: 1, paragraphs: [] },
      { type: 'text', id: 't2', order: 2, paragraphs: [] },
      { type: 'hook', id: 'b1', order: 3, content: 'Late hook', hook_style: 'question', analytics_tag: 'hook' },
      { type: 'core_explanation', id: 'b3', order: 4, paragraphs: ['Core.'], analytics_tag: 'core_explanation' },
      { type: 'mental_checkpoint', id: 'b6', order: 5, prompt: 'Check?', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'teaching_line', id: 'b8', order: 6, line: 'One key idea here.', support: 'Support text.', analytics_tag: 'teaching_line' },
    ];
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.errors.some(e => e.constraint === 'hook_position_limit')).toBe(true);
  });

  it('allows hook at position 3 for tension_first arc', () => {
    const blocks = [
      { type: 'lesson_header', id: 'h', order: 0 },
      { type: 'concept_illustration', id: 'c', order: 1, concept: 'contrast', description: 'desc', style: 'cycle' },
      { type: 'text', id: 't', order: 2, paragraphs: [] },
      { type: 'hook', id: 'b1', order: 3, content: 'Hook after contrast', hook_style: 'contradiction', analytics_tag: 'hook' },
      { type: 'core_explanation', id: 'b3', order: 4, paragraphs: ['Core.'], analytics_tag: 'core_explanation' },
      { type: 'mental_checkpoint', id: 'b6', order: 5, prompt: 'Check?', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'teaching_line', id: 'b8', order: 6, line: 'One key idea here.', support: 'Support text.', analytics_tag: 'teaching_line' },
    ];
    const result = validateLessonPedagogy(blocks as any, 'tension_first');
    expect(result.errors.some(e => e.constraint === 'hook_position_limit')).toBe(false);
  });

  it('warns when teaching_line.line exceeds 25 words', () => {
    const blocks = [
      ...VALID_BLOCKS.filter(b => b.type !== 'teaching_line'),
      { type: 'teaching_line', id: 'b8', order: 8,
        line: 'This is a teaching line that is far too long and exceeds the maximum word count of twenty five words allowed by the spec.',
        support: 'Support text.', analytics_tag: 'teaching_line' },
    ];
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.warnings.some(w => w.constraint === 'teaching_line_length')).toBe(true);
  });

  it('errors when mental_checkpoint uses confidence_pick without options', () => {
    const blocks = [
      ...VALID_BLOCKS.filter(b => b.type !== 'mental_checkpoint'),
      { type: 'mental_checkpoint', id: 'b6', order: 6,
        prompt: 'How confident?', checkpoint_style: 'confidence_pick',
        response_mode: 'confidence', analytics_tag: 'mental_checkpoint'
        // options intentionally absent
      },
    ];
    const result = validateLessonPedagogy(blocks as any, 'standard');
    expect(result.errors.some(e => e.constraint === 'mental_checkpoint_options')).toBe(true);
  });
});
```

Run: `npm test`
Expected: FAIL — `validateLessonPedagogy` not exported yet.

- [ ] **Step 2: Implement `validateLessonPedagogy` in `lib/ai/content-sanitizer.ts`**

Add after the existing exports (before the file ends):

```typescript
// ─── Pedagogical Validator ───────────────────────────────────────────────────

import type { ArcType } from '@/lib/ai/conductor/types';

type PedagogicalPhase = 'discovery' | 'instruction' | 'consolidation' | 'closure' | 'structural';

const PHASE_MAP: Readonly<Record<string, PedagogicalPhase>> = {
    hook: 'discovery',
    prediction: 'discovery',
    core_explanation: 'instruction',
    text: 'instruction',          // text can serve as instruction
    flow_diagram: 'instruction',
    concept_illustration: 'instruction',
    type_cards: 'instruction',
    mental_checkpoint: 'consolidation',
    applied_case: 'consolidation',
    industry_tabs: 'consolidation',
    teaching_line: 'consolidation',  // allowed in consolidation OR closure
    image_text_row: 'consolidation',
    quiz: 'closure',
    inline_quiz: 'closure',
    recap: 'closure',
    key_terms: 'closure',
    completion: 'closure',
    // structural blocks: not counted for phase boundary guard
    lesson_header: 'structural',
    objective: 'structural',
    hero_video: 'structural',
    section_divider: 'structural',
    audio_recap_prominent: 'structural',
};

const PHASE_ORDER: PedagogicalPhase[] = ['discovery', 'instruction', 'consolidation', 'closure'];

function getPhase(blockType: string): PedagogicalPhase {
    return PHASE_MAP[blockType] ?? 'consolidation';
}

function phaseDistance(from: PedagogicalPhase, to: PedagogicalPhase): number {
    if (from === 'structural' || to === 'structural') return 0;
    const fromIdx = PHASE_ORDER.indexOf(from);
    const toIdx   = PHASE_ORDER.indexOf(to);
    return Math.abs(toIdx - fromIdx);
}

type ConstraintId =
    | 'hook_exists'
    | 'core_explanation_exists'
    | 'teaching_line_exists'
    | 'mental_checkpoint_exists'
    | 'hook_position_limit'
    | 'prediction_order'
    | 'core_before_checkpoint'
    | 'core_before_interaction'
    | 'mental_checkpoint_options';

interface ValidationError   { constraint: ConstraintId; message: string; }
interface ValidationWarning { constraint: string; message: string; }

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

// Resolve the hook position limit for a given arc type (1-indexed)
function hookPositionLimit(arcType: ArcType): number {
    if (arcType === 'exploratory')    return 4;
    if (arcType === 'tension_first')  return 3;
    return 2;
}

export function validateLessonPedagogy(
    blocks: any[],
    arcType: ArcType
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Skip structural blocks for positional checks
    const pedagogical = blocks.filter(b => getPhase(b.type) !== 'structural');

    // ── Required presence ─────────────────────────────────────────────────────
    const types = new Set(blocks.map(b => b.type as string));

    if (!types.has('hook'))
        errors.push({ constraint: 'hook_exists', message: 'lesson is missing a hook block' });
    if (!types.has('core_explanation') && !types.has('text'))
        errors.push({ constraint: 'core_explanation_exists', message: 'lesson is missing a core_explanation block' });
    if (!types.has('teaching_line'))
        errors.push({ constraint: 'teaching_line_exists', message: 'lesson is missing a teaching_line block' });
    if (!types.has('mental_checkpoint'))
        errors.push({ constraint: 'mental_checkpoint_exists', message: 'lesson is missing a mental_checkpoint block' });

    // ── Hook position (1-indexed, counting all blocks) ────────────────────────
    const hookIdx = blocks.findIndex(b => b.type === 'hook'); // 0-based
    const maxHookPos = hookPositionLimit(arcType); // 1-indexed max
    if (hookIdx !== -1 && hookIdx >= maxHookPos) {
        errors.push({
            constraint: 'hook_position_limit',
            message: `hook is at position ${hookIdx + 1} (1-indexed) but ${arcType} arc allows max position ${maxHookPos}`,
        });
    }

    // ── Prediction before core_explanation ────────────────────────────────────
    const predIdx = blocks.findIndex(b => b.type === 'prediction');
    const coreIdx = blocks.findIndex(b => b.type === 'core_explanation' || b.type === 'text');
    if (predIdx !== -1 && coreIdx !== -1 && predIdx > coreIdx) {
        errors.push({
            constraint: 'prediction_order',
            message: 'prediction block must appear before the first core_explanation block',
        });
    }

    // ── core_explanation before mental_checkpoint ─────────────────────────────
    const checkIdx = blocks.findIndex(b => b.type === 'mental_checkpoint');
    if (coreIdx !== -1 && checkIdx !== -1 && coreIdx > checkIdx) {
        errors.push({
            constraint: 'core_before_checkpoint',
            message: 'core_explanation must appear before mental_checkpoint',
        });
    }

    // ── core_explanation before quiz/inline_quiz ──────────────────────────────
    const quizIdx = blocks.findIndex(b => b.type === 'quiz' || b.type === 'inline_quiz');
    if (coreIdx !== -1 && quizIdx !== -1 && coreIdx > quizIdx) {
        errors.push({
            constraint: 'core_before_interaction',
            message: 'core_explanation must appear before the quiz block',
        });
    }

    // ── mental_checkpoint options constraint ──────────────────────────────────
    const checkpoint = blocks.find(b => b.type === 'mental_checkpoint');
    if (checkpoint?.checkpoint_style === 'confidence_pick' && !checkpoint.options?.length) {
        errors.push({
            constraint: 'mental_checkpoint_options',
            message: 'mental_checkpoint with checkpoint_style "confidence_pick" requires options array',
        });
    }

    // ── Warnings ──────────────────────────────────────────────────────────────
    const teachingLine = blocks.find(b => b.type === 'teaching_line');
    if (teachingLine?.line) {
        const wordCount = teachingLine.line.trim().split(/\s+/).length;
        if (wordCount > 25)
            warnings.push({ constraint: 'teaching_line_length', message: `teaching_line.line is ${wordCount} words (max 25)` });
        if (teachingLine.line.endsWith(':'))
            warnings.push({ constraint: 'teaching_line_colon', message: 'teaching_line.line must not end with a colon' });
        if (/^(introduction|overview|summary|key (points|takeaways)|in this lesson)/i.test(teachingLine.line))
            warnings.push({ constraint: 'teaching_line_generic', message: 'teaching_line.line reads as a generic heading — use a specific insight instead' });
    }

    if (checkpoint && checkpoint.checkpoint_style !== 'confidence_pick' && checkpoint.options?.length) {
        warnings.push({ constraint: 'mental_checkpoint_options_unexpected', message: 'options array present but checkpoint_style is not confidence_pick' });
    }

    return { valid: errors.length === 0, errors, warnings };
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```
Expected: all validator tests pass.

- [ ] **Step 4: Commit**
```bash
git add lib/ai/content-sanitizer.ts lib/ai/content-sanitizer/__tests__/validator.test.ts
git commit -m "feat(validator): implement validateLessonPedagogy — constraint-based pedagogical validation"
```

---

### Task 10: Implement `repairLessonSequence()`

**Files:**
- Modify: `lib/ai/content-sanitizer.ts`
- Create: `lib/ai/content-sanitizer/__tests__/repair.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/ai/content-sanitizer/__tests__/repair.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { repairLessonSequence } from '../index';

describe('repairLessonSequence', () => {
  it('moves summary to last position if out of place', () => {
    const blocks: any[] = [
      { type: 'hook', id: 'h', order: 0, content: 'Q', hook_style: 'question', analytics_tag: 'hook' },
      { type: 'recap', id: 'r', order: 1, title: 'Recap', points: [] },
      { type: 'core_explanation', id: 'c', order: 2, paragraphs: ['Core.'], analytics_tag: 'core_explanation' },
      { type: 'mental_checkpoint', id: 'm', order: 3, prompt: 'P', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'teaching_line', id: 't', order: 4, line: 'Key insight in one sentence.', support: 'Support.', analytics_tag: 'teaching_line' },
    ];
    const result = repairLessonSequence(blocks, 'standard');
    expect(result.riskLevel).toBe('low');
    expect(result.blocks[result.blocks.length - 1].type).toBe('recap');
    expect(result.changes.some(c => c.action === 'move' && c.blockType === 'recap')).toBe(true);
  });

  it('injects placeholder hook at position 0 if missing', () => {
    const blocks: any[] = [
      { type: 'core_explanation', id: 'c', order: 0, paragraphs: ['Core.'], analytics_tag: 'core_explanation' },
      { type: 'mental_checkpoint', id: 'm', order: 1, prompt: 'P', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'teaching_line', id: 't', order: 2, line: 'Key insight here exactly.', support: 'Support.', analytics_tag: 'teaching_line' },
    ];
    const result = repairLessonSequence(blocks, 'standard');
    expect(result.riskLevel).toBe('low');
    expect(result.blocks[0].type).toBe('hook');
    expect((result.blocks[0] as any).is_placeholder).toBe(true);
    expect((result.blocks[0] as any).placeholder_reason).toBe('missing_hook');
    expect((result.blocks[0] as any).repair_injected).toBe(true);
  });

  it('marks high-risk when core_explanation is entirely absent', () => {
    const blocks: any[] = [
      { type: 'hook', id: 'h', order: 0, content: 'Q', hook_style: 'question', analytics_tag: 'hook' },
      { type: 'mental_checkpoint', id: 'm', order: 1, prompt: 'P', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'teaching_line', id: 't', order: 2, line: 'Key insight here exactly.', support: 'Support.', analytics_tag: 'teaching_line' },
    ];
    const result = repairLessonSequence(blocks, 'standard');
    expect(result.riskLevel).toBe('high');
  });

  it('marks high-risk when more than 3 blocks need reordering', () => {
    // lesson where core, checkpoint, teaching_line, and recap are all out of order
    const blocks: any[] = [
      { type: 'recap',            id: 'r', order: 0, title: 'Recap', points: [] },
      { type: 'teaching_line',    id: 't', order: 1, line: 'Key insight here.', support: 'Support.', analytics_tag: 'teaching_line' },
      { type: 'mental_checkpoint',id: 'm', order: 2, prompt: 'P', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' },
      { type: 'core_explanation', id: 'c', order: 3, paragraphs: ['Core.'], analytics_tag: 'core_explanation' },
      { type: 'hook',             id: 'h', order: 4, content: 'Q', hook_style: 'question', analytics_tag: 'hook' },
    ];
    const result = repairLessonSequence(blocks, 'standard');
    expect(result.riskLevel).toBe('high');
  });
});
```

Run: `npm test`
Expected: FAIL — `repairLessonSequence` not exported yet.

- [ ] **Step 2: Implement `repairLessonSequence` in `lib/ai/content-sanitizer.ts`**

Add after `validateLessonPedagogy`:

```typescript
interface RepairChange {
    action: 'move' | 'inject_placeholder';
    blockType: string;
    fromIndex?: number;
    toIndex: number;
    reason: string;
}

export interface RepairResult {
    repaired: boolean;
    changes: RepairChange[];
    riskLevel: 'low' | 'high';
    blocks: any[];
}

const SUMMARY_TYPES = new Set(['recap', 'key_terms', 'completion', 'teaching_line']);
const CLOSURE_TYPES = new Set(['quiz', 'inline_quiz', 'recap', 'key_terms', 'completion']);

function makePlaceholder(type: 'hook' | 'teaching_line' | 'mental_checkpoint', order: number): any {
    const base = {
        id: `placeholder_${type}_${Date.now()}`,
        order,
        is_placeholder: true,
        repair_injected: true,
        placeholder_reason: `missing_${type}` as const,
    };
    if (type === 'hook') return { ...base, type: 'hook', content: '', hook_style: 'question', analytics_tag: 'hook' };
    if (type === 'teaching_line') return { ...base, type: 'teaching_line', line: '', support: '', analytics_tag: 'teaching_line' };
    return { ...base, type: 'mental_checkpoint', prompt: '', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint' };
}

export function repairLessonSequence(
    blocks: any[],
    arcType: ArcType
): RepairResult {
    let result = [...blocks];
    const changes: RepairChange[] = [];
    let riskLevel: 'low' | 'high' = 'low';

    // ── High-risk: core_explanation entirely absent ───────────────────────────
    const hasCore = result.some(b => b.type === 'core_explanation' || b.type === 'text');
    if (!hasCore) {
        return { repaired: false, changes: [], riskLevel: 'high', blocks };
    }

    // ── Low-risk: move summary blocks to end if out of place ─────────────────
    const summaryMovedTypes = new Set<string>();
    SUMMARY_TYPES.forEach(summType => {
        const idx = result.findIndex(b => b.type === summType);
        if (idx === -1) return;
        const isNearEnd = idx >= result.length - 2;
        if (!isNearEnd) {
            const [block] = result.splice(idx, 1);
            result.push(block);
            changes.push({ action: 'move', blockType: summType, fromIndex: idx, toIndex: result.length - 1, reason: `${summType} not in last 2 positions` });
            summaryMovedTypes.add(summType);
        }
    });

    // ── Low-risk: move prediction before core_explanation ─────────────────────
    const predIdx = result.findIndex(b => b.type === 'prediction');
    const coreIdx = result.findIndex(b => b.type === 'core_explanation' || b.type === 'text');
    if (predIdx !== -1 && coreIdx !== -1 && predIdx > coreIdx) {
        const [pred] = result.splice(predIdx, 1);
        result.splice(coreIdx, 0, pred);
        changes.push({ action: 'move', blockType: 'prediction', fromIndex: predIdx, toIndex: coreIdx, reason: 'prediction must precede core_explanation' });
    }

    // ── High-risk guard: too many blocks moved ────────────────────────────────
    if (changes.filter(c => c.action === 'move').length > 3) {
        riskLevel = 'high';
    }

    // ── High-risk guard: any move crosses more than 1 phase boundary ──────────
    for (const change of changes) {
        if (change.action === 'move' && change.fromIndex !== undefined) {
            const fromPhase = getPhase(change.blockType);
            const toBlock = result[change.toIndex];
            const toPhase = toBlock ? getPhase(toBlock.type) : 'closure';
            if (phaseDistance(fromPhase, toPhase) > 1) {
                riskLevel = 'high';
            }
        }
    }

    // ── If already high-risk, return without injecting placeholders ───────────
    if (riskLevel === 'high') {
        return { repaired: false, changes, riskLevel, blocks };
    }

    // ── Low-risk: inject placeholder blocks for missing required types ─────────
    if (!result.some(b => b.type === 'hook')) {
        const placeholder = makePlaceholder('hook', 0);
        result.unshift(placeholder);
        changes.push({ action: 'inject_placeholder', blockType: 'hook', toIndex: 0, reason: 'hook block missing' });
    }

    if (!result.some(b => b.type === 'teaching_line')) {
        const lastCoreIdx = result.reduce((best, b, i) => (b.type === 'core_explanation' || b.type === 'text') ? i : best, -1);
        const insertAt = lastCoreIdx !== -1 ? lastCoreIdx + 1 : Math.max(0, result.length - 2);
        const placeholder = makePlaceholder('teaching_line', insertAt);
        result.splice(insertAt, 0, placeholder);
        changes.push({ action: 'inject_placeholder', blockType: 'teaching_line', toIndex: insertAt, reason: 'teaching_line block missing' });
    }

    if (!result.some(b => b.type === 'mental_checkpoint')) {
        const firstCoreIdx = result.findIndex(b => b.type === 'core_explanation' || b.type === 'text');
        const insertAt = firstCoreIdx !== -1 ? firstCoreIdx + 1 : Math.max(0, result.length - 3);
        const placeholder = makePlaceholder('mental_checkpoint', insertAt);
        result.splice(insertAt, 0, placeholder);
        changes.push({ action: 'inject_placeholder', blockType: 'mental_checkpoint', toIndex: insertAt, reason: 'mental_checkpoint block missing' });
    }

    // Re-assign order values to reflect new positions
    result = result.map((b, i) => ({ ...b, order: i }));

    return {
        repaired: changes.length > 0,
        changes,
        riskLevel,
        blocks: result,
    };
}
```

- [ ] **Step 3: Export from sanitizer index**

Make sure both functions are exported. If `content-sanitizer.ts` is a single file (not a directory), the exports are already at file level. Add to the top-level exports comment:

```typescript
//   import { validateLessonPedagogy, repairLessonSequence } from '@/lib/ai/content-sanitizer';
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```
Expected: all validator + repair tests pass.

- [ ] **Step 5: Commit**
```bash
git add lib/ai/content-sanitizer.ts lib/ai/content-sanitizer/__tests__/repair.test.ts
git commit -m "feat(validator): implement repairLessonSequence — low/high-risk repair with placeholder injection"
```

---

## Phase 4 — Conductor Integration

### Task 11: Add `ArcConstraintOverride` type and `ArcDefinition` interface

**Files:**
- Modify: `lib/ai/conductor/types.ts`

- [ ] **Step 1: Write failing test**

Create `lib/ai/conductor/__tests__/arc-overrides.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ARC_DEFINITIONS } from '../arc-definitions';

describe('arc override integrity', () => {
  it('only tension_first and exploratory have sequenceOverride', () => {
    const overrideArcs = Object.entries(ARC_DEFINITIONS)
      .filter(([, def]) => def.sequenceOverride && def.sequenceOverride.length > 0)
      .map(([name]) => name);
    expect(overrideArcs.sort()).toEqual(['exploratory', 'tension_first']);
  });

  it('tension_first override allows contrast_before_hook', () => {
    const overrides = ARC_DEFINITIONS.tension_first.sequenceOverride ?? [];
    const cbh = overrides.find(o => o.constraint === 'contrast_before_hook');
    expect(cbh).toBeDefined();
    expect((cbh as any).newParams.allowed).toBe(true);
  });

  it('tension_first sets hook max position to 3', () => {
    const overrides = ARC_DEFINITIONS.tension_first.sequenceOverride ?? [];
    const hpl = overrides.find(o => o.constraint === 'hook_position_limit');
    expect(hpl).toBeDefined();
    expect((hpl as any).newParams.maxPosition).toBe(3);
  });

  it('exploratory sets hook max position to 4', () => {
    const overrides = ARC_DEFINITIONS.exploratory.sequenceOverride ?? [];
    const hpl = overrides.find(o => o.constraint === 'hook_position_limit');
    expect(hpl).toBeDefined();
    expect((hpl as any).newParams.maxPosition).toBe(4);
  });

  it('all arcs have beats array', () => {
    for (const [name, def] of Object.entries(ARC_DEFINITIONS)) {
      expect(Array.isArray(def.beats), `${name} must have beats array`).toBe(true);
    }
  });
});
```

Run: `npm test`
Expected: FAIL — `ARC_DEFINITIONS[x].sequenceOverride` does not exist yet (ARC_DEFINITIONS is currently `Record<ArcType, Beat[]>`, not `Record<ArcType, ArcDefinition>`).

- [ ] **Step 2: Add types to `lib/ai/conductor/types.ts`**

Add at the end of the file:

```typescript
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
```

- [ ] **Step 3: Restructure `lib/ai/conductor/arc-definitions.ts`**

The current file exports `ARC_DEFINITIONS` as `Record<ArcType, readonly Beat[]>`. This must change to `Record<ArcType, ArcDefinition>`.

Replace the entire file with:

```typescript
// lib/ai/conductor/arc-definitions.ts
import type { ArcType, Beat, ArcDefinition } from './types';

export const ARC_DEFINITIONS: Readonly<Record<ArcType, ArcDefinition>> = {

    /**
     * MICRO — 3 beats
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
     * Opens with challenge. Hook may appear up to position 3 (1-indexed).
     * Contrast block may precede the hook.
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
            // contrast block may appear before the hook
            { constraint: 'contrast_before_hook', newParams: { allowed: true } },
            // hook must still appear by position 3 (1-indexed)
            { constraint: 'hook_position_limit',  newParams: { maxPosition: 3 } },
        ],
    },

    /**
     * EXPLORATORY — 5 beats (no hard tension)
     * NOTE: Two 'building' beats are intentional. Use beatIndex (array position) not beat.name.
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
            // hook may appear later — up to position 4 (1-indexed)
            { constraint: 'hook_position_limit',      newParams: { maxPosition: 4 } },
            // process blocks don't need to be near-adjacent to core_explanation
            { constraint: 'process_position_strict',  newParams: { strict: false } },
        ],
    },
};
```

- [ ] **Step 4: Fix `conductor/index.ts` references to `ARC_DEFINITIONS`**

In `lib/ai/conductor/index.ts`, find:
```typescript
const beatSequence = [...ARC_DEFINITIONS[arcType]];
```
Replace with:
```typescript
const beatSequence = [...ARC_DEFINITIONS[arcType].beats];
```

Also find (in `buildConductorNotes`):
```typescript
beats[output.signatureMoment.beatIndex]?.name ?? 'insight'
```
This now references the `beats` array directly — it should still work since `beats` is passed in. Verify no other direct array indexing of `ARC_DEFINITIONS[arcType]` remains.

Search for all usages:
```bash
grep -n "ARC_DEFINITIONS\[" "D:/ai-bytes-leaning-22nd-feb-2026 Backup/lib/ai/conductor/index.ts"
grep -n "ARC_DEFINITIONS\[" "D:/ai-bytes-leaning-22nd-feb-2026 Backup/lib/ai/conductor/arc-selector.ts"
```

Update any that treat the value as an array directly to use `.beats`.

- [ ] **Step 5: Run all tests**

```bash
npm test
```
Expected: all arc override tests pass; all previous tests still pass.

- [ ] **Step 6: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 7: Commit**
```bash
git add lib/ai/conductor/types.ts lib/ai/conductor/arc-definitions.ts lib/ai/conductor/index.ts
git add lib/ai/conductor/__tests__/arc-overrides.test.ts
git commit -m "feat(conductor): add ArcDefinition + sequenceOverride to tension_first and exploratory arcs"
```

---

### Task 12: Add SEQUENCE ADJUSTMENT to `buildConductorNotes()`

**Files:**
- Modify: `lib/ai/conductor/index.ts`

- [ ] **Step 1: Import ArcDefinition**

At the top of `conductor/index.ts`, ensure `ArcDefinition` is imported:
```typescript
import type { ConductorContext, ConductorOutput, ConductorMemory, ModuleMood, ArcType, Beat, SignatureMomentType, ArcDefinition } from './types';
```

- [ ] **Step 2: Add SEQUENCE ADJUSTMENT to `buildConductorNotes`**

Find the `buildConductorNotes` function. After the existing `lines` array is built and before `return lines.join('\n')`, add:

```typescript
// Inject SEQUENCE ADJUSTMENT for arcs with overrides
const arcDef = ARC_DEFINITIONS[arcType];
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
```

- [ ] **Step 3: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | grep "conductor/index"
```
Expected: no errors.

- [ ] **Step 4: Commit**
```bash
git add lib/ai/conductor/index.ts
git commit -m "feat(conductor): inject SEQUENCE ADJUSTMENT into conductorNotes for approved arcs"
```

---

## Phase 5 — Generator Prompt Integration

### Task 13: Inject Universal Spec into `LessonExpanderAgent` prompt

**Files:**
- Modify: `lib/ai/agent-system-v2.ts`

- [ ] **Step 1: Add the spec constant**

Near the top of `agent-system-v2.ts` (after the imports), add the spec block as a constant:

```typescript
// ─── Universal Lesson Generation Spec v1.0 ──────────────────────────────────
// Injected into every LessonExpanderAgent call after the conductor notes.
const UNIVERSAL_LESSON_SPEC = `
═══════════════════════════════════════════════════════════
PEDAGOGICAL STRUCTURE — UNIVERSAL LESSON SPEC v1.0
═══════════════════════════════════════════════════════════

Every lesson MUST include the following pedagogical components
in the default sequence below.

If a valid SEQUENCE ADJUSTMENT is provided by the Conductor
above, follow that adjusted sequence while preserving all
dependency rules. Only reorder the components named in the
adjustment. Do not change required block presence or field rules.

─────────────────────────────────────────────────────────
STEP 1 — HOOK  (block type: "hook")
  Role:    Create curiosity before any teaching begins.
  Where:   Position 1 or 2 in the lesson (after lesson_header/objective).
  Purpose: The learner must feel a gap between what they know and what
           they are about to learn. Use a question, statistic,
           contradiction, or scenario.
           DO NOT open with a definition (e.g. "X is a…")
           DO NOT explain anything yet.
  Fields:  { "type": "hook", "content": "...", "hook_style": "question"|"scenario"|"statistic"|"contradiction", "analytics_tag": "hook" }

STEP 2 — PREDICTION  (block type: "prediction")
  Role:    Activate prior knowledge and create a stake.
  Where:   After the hook, before any core_explanation.
  Purpose: Ask the learner to guess before the explanation arrives.
           The prediction does not need to be correct.
  Fields:  { "type": "prediction", "question": "What do you predict?", "options": ["A","B","C"], "correctIndex": 0, "reveal": "The answer is..." }

STEP 3 — CORE EXPLANATION  (block type: "core_explanation")
  Role:    Deliver the concept in plain language.
  Where:   After hook and prediction.
  Purpose: One concept. No jargon without definition. Max 3 sentences per paragraph.
  Anti-patterns:
           - Do not repeat the hook in different words
           - Do not drift into generic motivational copy
  Fields:  { "type": "core_explanation", "heading": "...", "paragraphs": ["..."], "analytics_tag": "core_explanation" }

STEP 4 — HOW IT WORKS  (block type: "process" or "flow_diagram")
  Role:    Show the mechanism, not just the idea.
  Where:   After core_explanation, before closure.
  Purpose: A causal mental model. Use flow_diagram for sequential steps.

STEP 5 — REAL-WORLD ANCHOR  (block type: "applied_case" or "industry_tabs")
  Role:    Ground the concept in a recognisable context.
  Where:   After process, in the consolidation phase.
  Purpose: A real or clearly realistic context. Avoid vague hypotheticals.

STEP 6 — CONTRAST  (block type: appropriate explanatory block)
  Role:    Sharpen understanding by showing what the concept is NOT.
  Where:   After the real-world anchor. tension_first arc may place this first.
  Purpose: A before/after, old-way/new-way, or misconception/correction pair.

STEP 7 — MENTAL CHECKPOINT  (block type: "mental_checkpoint")
  Role:    Mid-lesson comprehension pause (NOT a graded quiz).
  Where:   After core_explanation and process — before quiz and summary.
  Purpose: A moment for the learner to self-assess.
  Fields:  { "type": "mental_checkpoint", "prompt": "...", "checkpoint_style": "reflection"|"predict"|"confidence_pick", "response_mode": "reflective"|"diagnostic"|"confidence", "options": ["Got it","Mostly","Lost me"], "analytics_tag": "mental_checkpoint" }
           Note: options required only when checkpoint_style is "confidence_pick".

STEP 8 — INTERACTION  (block type: "quiz" with EXACTLY 3 questions)
  Role:    Graded knowledge check.
  Where:   After mental_checkpoint, before summary blocks.
  Purpose: Tests recall or application — must connect to core_explanation content.

STEP 9 — SUMMARY SEQUENCE
  teaching_line (REQUIRED):
    { "type": "teaching_line", "line": "...", "support": "...", "analytics_tag": "teaching_line" }
    The single most important sentence. Exactly 1 sentence. Max 25 words.
    No trailing colon. Not phrased as a heading or label.

  recap (STRONGLY EXPECTED):
    3-4 bullet recap of what was covered.

  key_terms (INCLUDE ONLY if technical vocabulary was introduced):
    Do not force this block into lessons with no terminology.
─────────────────────────────────────────────────────────

Do not leave any required pedagogical fields empty.
Generate complete, learner-facing content for every required block.
Before finalising, verify all required components are present exactly once.
═══════════════════════════════════════════════════════════

`;
```

- [ ] **Step 2: Inject the spec into the prompt**

In the `expandLesson` method, find where `rhythmPrefix` is used:
```typescript
const rhythmPrefix = rhythmDirective ? `${rhythmDirective}\n\n---\n\n` : '';
const prompt = rhythmPrefix + `SYSTEM: You are an elite UK instructional designer...`
```

Change to:
```typescript
const rhythmPrefix = rhythmDirective ? `${rhythmDirective}\n\n---\n\n` : '';
const prompt = rhythmPrefix + UNIVERSAL_LESSON_SPEC + `SYSTEM: You are an elite UK instructional designer...`
```

- [ ] **Step 3: Verify the BANNED_WORDS_INSTRUCTION is still present**

Search for it in the prompt:
```bash
grep -n "BANNED_WORDS_INSTRUCTION" "D:/ai-bytes-leaning-22nd-feb-2026 Backup/lib/ai/agent-system-v2.ts"
```
Expected: at least one occurrence. If it's included via a variable, ensure that variable is still referenced in the prompt string.

- [ ] **Step 4: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | grep "agent-system-v2"
```
Expected: no errors.

- [ ] **Step 5: Commit**
```bash
git add lib/ai/agent-system-v2.ts
git commit -m "feat(generator): inject Universal Lesson Spec v1.0 into LessonExpanderAgent prompt"
```

---

## Phase 6 — Route Integration

### Task 14: Add env-var feature gate + wire validator into generate-v2 route

**Files:**
- Modify: `app/api/course/generate-v2/route.ts`

The validator is introduced behind `LESSON_PEDAGOGY_GATE`:
- Unset or `"off"` → validator runs, results logged only (soft mode — observe without breaking)
- `"enforce"` → validator gates insertion (hard mode)

Set `LESSON_PEDAGOGY_GATE=off` in `.env.local` initially. Switch to `"enforce"` once soft-mode logs look clean.

- [ ] **Step 1: Add env-var gate check at top of route**

After the imports in `route.ts`, add:
```typescript
const PEDAGOGY_GATE = (process.env.LESSON_PEDAGOGY_GATE ?? 'off') as 'off' | 'enforce';
```

- [ ] **Step 2: Import the validator and repair functions**

Add to the imports:
```typescript
import { validateLessonPedagogy, repairLessonSequence } from '@/lib/ai/content-sanitizer';
import type { ValidationResult } from '@/lib/ai/content-sanitizer';
```

- [ ] **Step 3: Find where lessons are inserted into the DB**

Search for:
```typescript
await supabase.from('course_lessons').insert({
```

In that block, add the validator call BEFORE the insert. The exact location will be after `const cleanBlocks = sanitizeBlocks(...)` and `const cleanLessonTitle = sanitizeText(...)`:

```typescript
// ── Pedagogical validation gate ───────────────────────────────────────────
let validatedBlocks = cleanBlocks;
let specCompliant = false;
let hasSpecPlaceholders = false;

const arcType = conductorOutput?.arcType ?? 'standard';
let validation = validateLessonPedagogy(validatedBlocks, arcType);

if (!validation.valid && PEDAGOGY_GATE !== 'off') {
    const repair = repairLessonSequence(validatedBlocks, arcType);
    if (repair.riskLevel === 'low') {
        console.log(`[PedagogyGate] Auto-repaired lesson "${cleanLessonTitle}" — ${repair.changes.length} change(s):`, repair.changes.map(c => c.reason).join('; '));
        validatedBlocks = repair.blocks;
        hasSpecPlaceholders = repair.blocks.some((b: any) => b.is_placeholder);
        // Re-validate after repair
        validation = validateLessonPedagogy(validatedBlocks, arcType);
    } else {
        console.warn(`[PedagogyGate] High-risk repair needed for "${cleanLessonTitle}" — flagging for review`);
        // High-risk: one retry attempt (caller will handle if needed)
    }
}

if (validation.valid) {
    specCompliant = true;
} else {
    if (PEDAGOGY_GATE === 'enforce') {
        console.error(`[PedagogyGate] Lesson "${cleanLessonTitle}" failed validation:`, validation.errors);
        // In enforce mode: insert anyway with spec_compliant=false, do not throw
        // (throwing would fail the entire course generation)
    } else {
        // Soft mode: just log
        console.warn(`[PedagogyGate] (soft) Lesson "${cleanLessonTitle}" has validation issues:`, validation.errors);
    }
}

if (validation.warnings.length > 0) {
    console.log(`[PedagogyGate] Warnings for "${cleanLessonTitle}":`, validation.warnings.map(w => w.message).join('; '));
}
// ── End pedagogical validation ────────────────────────────────────────────
```

- [ ] **Step 4: Use `validatedBlocks` in the insert and add new columns**

In the `supabase.from('course_lessons').insert({...})` call, replace `content_blocks: cleanBlocks` with `content_blocks: validatedBlocks`, and add the new columns:

```typescript
const { data: lData, error: lErr } = await supabase.from('course_lessons').insert({
    topic_id: topicId,
    title: cleanLessonTitle,
    content_blocks: validatedBlocks,   // ← was cleanBlocks
    // ... other existing fields ...
    schema_version: '2.0',
    pedagogical_spec_version: '1.0',
    spec_compliant: specCompliant,
    spec_migrated: false,
    has_spec_placeholders: hasSpecPlaceholders,
});
```

- [ ] **Step 5: Add env var to `.env.local`**

```bash
echo "LESSON_PEDAGOGY_GATE=off" >> "D:/ai-bytes-leaning-22nd-feb-2026 Backup/.env.local"
```

- [ ] **Step 6: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | grep "generate-v2"
```
Expected: no errors.

- [ ] **Step 7: Commit**
```bash
git add app/api/course/generate-v2/route.ts .env.local
git commit -m "feat(route): wire pedagogical validator into generate-v2 with soft/enforce gate"
```

---

## Phase 7 — Backfill Script

### Task 15: Implement `scripts/inject-spec-blocks.ts`

**Files:**
- Create: `scripts/inject-spec-blocks.ts`

- [ ] **Step 1: Create the script**

```typescript
/**
 * inject-spec-blocks.ts
 *
 * Upgrades legacy lessons to Universal Lesson Spec v1.0.
 * Targets only lessons where schema_version IS NULL OR schema_version < '2.0'.
 *
 * Run:  npx tsx scripts/inject-spec-blocks.ts          (dry-run)
 *       npx tsx scripts/inject-spec-blocks.ts --apply  (write to DB)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { validateLessonPedagogy, repairLessonSequence } from '../lib/ai/content-sanitizer';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APPLY = process.argv.includes('--apply');

// ── Definitional sentence detection ──────────────────────────────────────────
const DEFINITIONAL_PATTERN = /^([\w\s]+ is |a [\w\s]+ is |the [\w\s]+ is |[\w\s]+ refers to )/i;
const GENERIC_SENTENCE_PATTERN = /^(in the next section|as we have seen|as mentioned|to summarise|in summary|this section)/i;

// ── Smart extraction: try to find a good hook from existing blocks ────────────
function extractHook(blocks: any[]): { block: any; removeSourceAt?: number } | null {
    // Candidate 1: first block is callout or punch_quote
    const first = blocks[0];
    if (first && (first.type === 'callout' || first.type === 'punch_quote')) {
        const content = first.body || first.quote || first.text || '';
        if (!content) return null;
        const hookStyle = content.trim().endsWith('?') ? 'question'
            : /\d/.test(content) ? 'statistic'
            : 'scenario';
        return {
            block: { type: 'hook', content, hook_style: hookStyle, analytics_tag: 'hook', backfill_injected: true },
            removeSourceAt: 0,
        };
    }

    // Candidate 2: first core_explanation or text block has ≥ 2 sentences
    const firstCore = blocks.find(b => b.type === 'core_explanation' || b.type === 'text');
    if (firstCore) {
        const paragraphs: string[] = firstCore.paragraphs ?? [];
        const firstPara = paragraphs[0] ?? '';
        const sentences = firstPara.split(/(?<=[.!?])\s+/);
        const firstSentence = sentences[0]?.trim() ?? '';
        if (
            firstSentence.length > 20 &&
            sentences.length >= 2 &&
            !DEFINITIONAL_PATTERN.test(firstSentence)
        ) {
            const hookStyle = firstSentence.endsWith('?') ? 'question' : 'scenario';
            return {
                block: { type: 'hook', content: firstSentence, hook_style: hookStyle, analytics_tag: 'hook', backfill_injected: true },
                // Don't remove from source — just add the hook at position 0
            };
        }
    }

    return null;
}

// ── Smart extraction: try to find a good teaching_line ───────────────────────
function extractTeachingLine(blocks: any[]): { block: any; removeSourceAt?: number } | null {
    // Candidate 1: punch_quote block
    const pqIdx = blocks.findIndex(b => b.type === 'punch_quote');
    if (pqIdx !== -1) {
        const pq = blocks[pqIdx];
        const line = pq.quote ?? '';
        const support = pq.attribution ?? '';
        const wordCount = line.trim().split(/\s+/).length;
        if (wordCount >= 4 && wordCount <= 25 && !line.endsWith(':') && !GENERIC_SENTENCE_PATTERN.test(line)) {
            return {
                block: { type: 'teaching_line', line, support, analytics_tag: 'teaching_line', backfill_injected: true },
                removeSourceAt: pqIdx,
            };
        }
    }

    // Candidate 2: last sentence of last core_explanation
    const lastCoreIdx = blocks.reduce((best, b, i) => (b.type === 'core_explanation' || b.type === 'text') ? i : best, -1);
    if (lastCoreIdx !== -1) {
        const core = blocks[lastCoreIdx];
        const paragraphs: string[] = core.paragraphs ?? [];
        const lastPara = paragraphs[paragraphs.length - 1] ?? '';
        const sentences = lastPara.split(/(?<=[.!?])\s+/);
        const lastSentence = sentences[sentences.length - 1]?.trim() ?? '';
        const wordCount = lastSentence.split(/\s+/).length;
        if (
            wordCount >= 4 &&
            wordCount <= 25 &&
            !lastSentence.endsWith(':') &&
            !GENERIC_SENTENCE_PATTERN.test(lastSentence) &&
            !DEFINITIONAL_PATTERN.test(lastSentence)
        ) {
            return {
                block: { type: 'teaching_line', line: lastSentence, support: '', analytics_tag: 'teaching_line', backfill_injected: true },
            };
        }
    }

    return null;
}

// ── Main lesson processor ─────────────────────────────────────────────────────
async function processLesson(lesson: any): Promise<{ changed: boolean; reason?: string }> {
    let blocks: any[] = [];
    try {
        blocks = Array.isArray(lesson.content_blocks)
            ? lesson.content_blocks
            : typeof lesson.content_blocks === 'string'
                ? JSON.parse(lesson.content_blocks)
                : [];
    } catch { return { changed: false, reason: 'could not parse content_blocks' }; }

    const types = new Set(blocks.map((b: any) => b.type as string));
    const missing: string[] = [];
    if (!types.has('hook'))              missing.push('hook');
    if (!types.has('teaching_line'))     missing.push('teaching_line');
    if (!types.has('mental_checkpoint')) missing.push('mental_checkpoint');

    if (missing.length === 0) {
        // Run validator to set compliance flags even if blocks are present
        const validation = validateLessonPedagogy(blocks, 'standard');
        if (APPLY) {
            await supabase.from('course_lessons').update({
                schema_version: '2.0',
                pedagogical_spec_version: '1.0',
                spec_compliant: validation.valid,
                spec_migrated: true,
                has_spec_placeholders: false,
            }).eq('id', lesson.id);
        }
        console.log(`  ✅ Lesson ${lesson.id} already has all spec blocks (spec_compliant: ${validation.valid})`);
        return { changed: true, reason: 'already compliant — flags updated' };
    }

    console.log(`\n📋 Lesson ${lesson.id} — "${lesson.title}"`);
    console.log(`  MISSING: ${missing.join(', ')}`);

    let updatedBlocks = [...blocks];
    let hasPlaceholders = false;

    // ── Hook ──
    if (missing.includes('hook')) {
        const extracted = extractHook(updatedBlocks);
        if (extracted) {
            if (extracted.removeSourceAt !== undefined) {
                updatedBlocks.splice(extracted.removeSourceAt, 1);
            }
            updatedBlocks.unshift(extracted.block);
            console.log(`  → hook: extracted from existing block ✓`);
        } else {
            const placeholder = { type: 'hook', content: '', hook_style: 'question', analytics_tag: 'hook', is_placeholder: true, placeholder_reason: 'missing_hook', backfill_injected: true };
            updatedBlocks.unshift(placeholder);
            hasPlaceholders = true;
            console.log(`  → hook: placeholder injected at position 0`);
        }
    }

    // ── Teaching line ──
    if (missing.includes('teaching_line')) {
        const extracted = extractTeachingLine(updatedBlocks);
        if (extracted) {
            if (extracted.removeSourceAt !== undefined) {
                updatedBlocks.splice(extracted.removeSourceAt, 1);
            }
            const lastCoreIdx = updatedBlocks.reduce((best, b, i) => (b.type === 'core_explanation' || b.type === 'text') ? i : best, -1);
            const insertAt = lastCoreIdx !== -1 ? lastCoreIdx + 1 : Math.max(0, updatedBlocks.length - 2);
            updatedBlocks.splice(insertAt, 0, extracted.block);
            console.log(`  → teaching_line: extracted from existing block ✓`);
        } else {
            const placeholder = { type: 'teaching_line', line: '', support: '', analytics_tag: 'teaching_line', is_placeholder: true, placeholder_reason: 'missing_teaching_line', backfill_injected: true };
            const lastCoreIdx = updatedBlocks.reduce((best, b, i) => (b.type === 'core_explanation' || b.type === 'text') ? i : best, -1);
            const insertAt = lastCoreIdx !== -1 ? lastCoreIdx + 1 : Math.max(0, updatedBlocks.length - 2);
            updatedBlocks.splice(insertAt, 0, placeholder);
            hasPlaceholders = true;
            console.log(`  → teaching_line: placeholder injected`);
        }
    }

    // ── Mental checkpoint ──
    if (missing.includes('mental_checkpoint')) {
        const placeholder = { type: 'mental_checkpoint', prompt: '', checkpoint_style: 'reflection', response_mode: 'reflective', analytics_tag: 'mental_checkpoint', is_placeholder: true, placeholder_reason: 'missing_mental_checkpoint', backfill_injected: true };
        const firstCoreIdx = updatedBlocks.findIndex(b => b.type === 'core_explanation' || b.type === 'text');
        const insertAt = firstCoreIdx !== -1 ? firstCoreIdx + 1 : Math.max(0, updatedBlocks.length - 3);
        updatedBlocks.splice(insertAt, 0, placeholder);
        hasPlaceholders = true;
        console.log(`  → mental_checkpoint: placeholder injected after block ${insertAt - 1}`);
    }

    // ── Prediction warning ──
    if (!types.has('prediction')) {
        console.log(`  → prediction: not present — warning only (not auto-generated)`);
    }

    // ── Validate before write ──
    const validation = validateLessonPedagogy(updatedBlocks, 'standard');
    if (!validation.valid) {
        console.log(`  ⚠️  validateLessonPedagogy: FAIL — skipping write`);
        console.log(`     Errors:`, validation.errors.map(e => e.message).join('; '));
        return { changed: false, reason: 'validation failed after backfill' };
    }

    console.log(`  → validateLessonPedagogy: PASS`);
    console.log(`  → Would write ${missing.length} block(s), has_spec_placeholders: ${hasPlaceholders}${APPLY ? '' : ' [dry-run]'}`);

    if (APPLY) {
        // Re-index order values
        updatedBlocks = updatedBlocks.map((b, i) => ({ ...b, order: i }));
        const { error } = await supabase.from('course_lessons').update({
            content_blocks: updatedBlocks,
            schema_version: '2.0',
            pedagogical_spec_version: '1.0',
            spec_compliant: true,
            spec_migrated: true,
            has_spec_placeholders: hasPlaceholders,
        }).eq('id', lesson.id);
        if (error) {
            console.error(`  ❌ DB update failed: ${error.message}`);
            return { changed: false, reason: error.message };
        }
        console.log(`  ✅ Updated`);
    }

    return { changed: true };
}

async function main() {
    console.log('─────────────────────────────────────────────────────');
    console.log('🔬 Universal Lesson Spec v1.0 — Backfill Script');
    console.log(APPLY
        ? '⚠️  --apply flag set — changes WILL be written to DB'
        : '🧪 Dry-run — no DB changes. Pass --apply to write.');
    console.log('─────────────────────────────────────────────────────');

    // Target: legacy lessons only (schema_version IS NULL or < '2.0')
    const { data, error } = await supabase
        .from('course_lessons')
        .select('id, title, content_blocks, schema_version')
        .or('schema_version.is.null,schema_version.lt.2.0')
        .eq('spec_migrated', false);

    if (error) { console.error('DB fetch error:', error); return; }

    const lessons = data ?? [];
    console.log(`Found ${lessons.length} legacy lessons to process.\n`);

    let passReady = 0;
    let skipped = 0;
    let placeholderCount = 0;
    let manualReview = 0;

    for (const lesson of lessons) {
        const result = await processLesson(lesson);
        if (result.changed) passReady++;
        else { skipped++; manualReview++; }
        const blocks = Array.isArray(lesson.content_blocks) ? lesson.content_blocks : [];
        if (blocks.some((b: any) => b.is_placeholder)) placeholderCount++;
    }

    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('Summary');
    console.log(`  Lessons scanned:        ${lessons.length}`);
    console.log(`  Lessons pass-ready:     ${passReady}`);
    console.log(`  Lessons skipped:        ${skipped}`);
    console.log(`  Placeholder injections: ${placeholderCount}`);
    console.log(`  Manual review required: ${manualReview}`);
    console.log('─────────────────────────────────────────────────────────────');
    if (!APPLY && lessons.length > 0) {
        console.log('Run with --apply to write changes.');
    }
    console.log('');
}

main().catch(console.error);
```

- [ ] **Step 2: Run dry-run against DB**

```bash
cd "D:\ai-bytes-leaning-22nd-feb-2026 Backup"
npx tsx scripts/inject-spec-blocks.ts
```

Expected: dry-run output showing which lessons need updating. Review output carefully before applying.

- [ ] **Step 3: Review output; apply if clean**

If the dry-run output looks correct:
```bash
npx tsx scripts/inject-spec-blocks.ts --apply
```

- [ ] **Step 4: Commit**
```bash
git add scripts/inject-spec-blocks.ts
git commit -m "feat(backfill): implement inject-spec-blocks.ts for legacy lesson spec upgrade"
```

---

## Phase 8 — Testing

### Task 16: Run full test suite

- [ ] **Step 1: Run all unit tests**
```bash
npm test
```
Expected: all tests pass (validator, repair, arc overrides).

- [ ] **Step 2: TypeScript full compile check**
```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Start dev server and verify pages load**
```bash
npm run dev
```

Navigate to an existing lesson page. Verify:
- Lesson still renders (no crash from new block types)
- No console errors in browser devtools

- [ ] **Step 4: E2E smoke test (Playwright)**

If a Playwright test file exists for lesson rendering, run it:
```bash
npx playwright test --grep "lesson"
```

Expected: existing lesson rendering tests still pass.

- [ ] **Step 5: Manual end-to-end generation test**

In the admin UI, generate a new course (Admin → New Course). After generation completes, navigate to the generated lesson and verify:
- `hook` block renders at the top of the lesson
- `mental_checkpoint` block renders mid-lesson
- `teaching_line` block renders near the end
- Server logs show `[PedagogyGate]` lines for the generated lesson

- [ ] **Step 6: Check DB columns were set**

In Supabase dashboard or via SQL:
```sql
SELECT id, title, spec_compliant, spec_migrated, has_spec_placeholders, schema_version
FROM course_lessons
ORDER BY created_at DESC
LIMIT 5;
```

Expected: newly generated lessons have `schema_version = '2.0'`, `spec_compliant = true` or `false` (depending on how the first generation goes).

---

## Phase 9 — Rollout

### Task 17: Safe deployment sequence

- [ ] **Step 1: Confirm migration applied in production**

The migration `20260402_spec_v1_columns.sql` must be applied to the production Supabase instance before any code is deployed. The new DB columns have `DEFAULT FALSE` / `DEFAULT '2.0'` — safe to add with no downtime.

```bash
npx supabase db push --linked
```

- [ ] **Step 2: Deploy code with `LESSON_PEDAGOGY_GATE=off`**

In your deployment environment (Vercel or equivalent), add:
```
LESSON_PEDAGOGY_GATE=off
```

This ensures the validator runs and logs but does not block any generation. Monitor server logs for `[PedagogyGate]` entries.

- [ ] **Step 3: Generate 2-3 test courses; review logs**

After deploying with gate off:
- Generate a new course via Admin UI
- Check server/Vercel function logs for `[PedagogyGate]` lines
- Count validation errors vs. passes
- If pass rate > 80%, proceed to enforce mode

- [ ] **Step 4: Run backfill on production**

```bash
npx tsx scripts/inject-spec-blocks.ts            # dry-run first
npx tsx scripts/inject-spec-blocks.ts --apply    # write if dry-run looks clean
```

- [ ] **Step 5: Switch to enforce mode**

Update env var:
```
LESSON_PEDAGOGY_GATE=enforce
```

Redeploy. From this point, failed validations are logged with ERROR level and lessons are inserted with `spec_compliant = false`.

- [ ] **Step 6: PostHog monitoring checks**

Verify these events are being tracked in PostHog after deploying new components:
- `hook` block: `data-analytics-tag="hook"` visible in DOM
- `teaching_line` block: `data-analytics-tag="teaching_line"` visible
- `mental_checkpoint` block: `data-analytics-tag="mental_checkpoint"` visible; button clicks fire

If PostHog capture is event-based (using `data-analytics-tag` attribute scanning), no code changes needed. If it requires explicit `posthog.capture()` calls, add those to the 3 new components.

- [ ] **Step 7: Rollback plan**

If the validator causes unexpected generation failures:
1. Set `LESSON_PEDAGOGY_GATE=off` → immediate soft-mode fallback (no redeploy needed)
2. If block components cause render crashes: the `BLOCK_COMPONENTS` map falls back to rendering `undefined` for unknown types (block-renderer skips them) — no catastrophic failure
3. DB columns: all nullable with `DEFAULT FALSE` — safe to leave even if feature is rolled back

---

## Dependency Checklist (ordered)

- [ ] Task 1 — Vitest installed
- [ ] Task 2 — Block type interfaces added (`lib/types/lesson-blocks.ts`)
- [ ] Task 3 — DB migration applied
- [ ] Task 4 — `hook.tsx` component
- [ ] Task 5 — `teaching-line.tsx` component
- [ ] Task 6 — `mental-checkpoint.tsx` component
- [ ] Task 7 — Block renderer wired
- [ ] Task 8 — Sanitizer defaults for new types
- [ ] Task 9 — `validateLessonPedagogy()` implemented and tested
- [ ] Task 10 — `repairLessonSequence()` implemented and tested
- [ ] Task 11 — `ArcConstraintOverride` + `ArcDefinition` types + arc-definitions restructured
- [ ] Task 12 — SEQUENCE ADJUSTMENT in `conductorNotes`
- [ ] Task 13 — Spec block injected into generator prompt
- [ ] Task 14 — Route wired with validator gate
- [ ] Task 15 — Backfill script created + dry-run executed
- [ ] Task 16 — Full test suite passes
- [ ] Task 17 — Rollout sequence complete

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `ARC_DEFINITIONS` restructure breaks `arc-selector.ts` or other consumers | Medium | High | Grep all usages before committing; tsc --noEmit catches type errors |
| Generator ignores new spec block or produces wrong field names | High | Medium | Soft gate (off mode) logs all failures before enforcement; one retry built in |
| `core_explanation` block type not produced by existing generator | High | Medium | Sanitizer's TYPE_MAP normalises; validator accepts `text` as fallback for core_explanation presence |
| Backfill overwrites valid lesson content | Low | High | Dry-run always first; script never writes without validator pass; skip on failure |
| `PredictionBlock` schema mismatch (existing `question` vs spec's `prompt`) | Known | Low | Documented in Pre-Implementation Findings; validator checks `type` only, not fields |
| Migration fails on existing column if re-run | Low | Low | `ADD COLUMN IF NOT EXISTS` guards against duplicate column errors |
| New block components crash on missing optional props | Medium | Medium | All components use `?? fallback` for all optional fields |
| PostHog events not captured if using explicit API | Medium | Low | Verify after deploy; fallback to manual `capture()` call in components |

---

## Recommended First PR Scope

**PR 1: Types + Migration + Components (Phases 1–2)**

Merge Tasks 1–7 as a single PR. This is purely additive:
- New TypeScript interfaces (no existing code broken)
- New DB columns with safe defaults
- New React components (not yet rendered by any lesson)
- 4 new entries in `BLOCK_COMPONENTS` (only renders if a block has the new `type` value)

Zero risk of breaking existing lessons. Gives the team visibility on the new block shapes before the generator is changed.

**PR 2: Validator + Conductor (Phases 3–4)**

Merge Tasks 8–12. Introduces the validator (soft mode) and restructures `ARC_DEFINITIONS`. The restructure is the highest-risk change in the project. Review `arc-selector.ts` and all other conductor consumers carefully before merging.

**PR 3: Generator + Route (Phases 5–6)**

Merge Tasks 13–14. Changes the Gemini prompt and wires the validator into the route. Keep `LESSON_PEDAGOGY_GATE=off` for the first week of production to build a baseline.

**PR 4: Backfill + Rollout (Phases 7–9)**

Run the backfill script separately, verify results, then switch the gate to `enforce`.
