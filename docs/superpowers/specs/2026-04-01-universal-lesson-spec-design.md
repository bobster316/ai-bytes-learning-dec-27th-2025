# Universal Lesson Generation Spec v1.0 — Implementation Design

**Date:** 2026-04-01  
**Status:** Approved — ready for implementation plan  
**Spec version:** pedagogical_spec_version `1.0`  
**Schema version:** schema_version `2.0`

---

## Overview

The Universal Lesson Generation Spec (v1.0) introduces a mandatory 9-step pedagogical structure to every AI Bytes lesson. The current pipeline produces content that meets visual variety requirements but lacks consistent pedagogical architecture — learners can receive a lesson that looks polished but skips the hook, never surfaces a core teaching line, or has no mid-lesson comprehension pause.

This implementation adds a 6-layer stack that enforces the spec from type definition through to DB persistence, with a backfill script to upgrade existing lessons.

---

## Core Principle

> **Pedagogical components are mandatory. Render order is constraint-bounded and arc-aware.**

Required blocks must exist in every lesson. Their sequence follows dependency rules, not a rigid position index — arc types may adjust ordering within those rules, but never remove a requirement or bypass a dependency.

---

## Architecture — 6 Layers

```
LAYER 1  TYPE          lib/types/lesson-blocks.ts
         Responsibility: Defines the 4 new pedagogical block interfaces + DB migration columns.
         Consumed by: all other layers.

LAYER 2  COMPONENT     components/course/blocks/
         Responsibility: React components that render hook, teaching_line, mental_checkpoint
                         (and optionally prediction). Each carries data-analytics-tag.
         Consumed by: block-renderer.tsx switch.

LAYER 3  VALIDATOR     lib/ai/content-sanitizer.ts
         Responsibility: validateLessonPedagogy() checks required presence + dependency rules.
                         repairLessonSequence() attempts low-risk fixes.
         Called by: generate-v2/route.ts (post-generation gate) and inject-spec-blocks.ts (backfill gate).
         Reads: arc override rules from Layer 4 via ARC_DEFINITIONS.

LAYER 4  CONDUCTOR     lib/ai/conductor/arc-definitions.ts
         Responsibility: Holds approved sequenceOverride[] for tension_first and exploratory arcs.
                         Translates arc intent into plain-English SEQUENCE ADJUSTMENT notes.
         Consumed by: Layer 3 (override map) and Layer 5 (conductorNotes injected into prompt).

LAYER 5  GENERATOR     lib/ai/agent-system-v2.ts (LessonExpanderAgent)
         Responsibility: Produces structured block JSON. Receives Conductor notes + spec prompt.
                         Does not know about arc types — Conductor translates for it.
         Output fed to: Layer 3 for validation before DB insert.

LAYER 6  BACKFILL      scripts/inject-spec-blocks.ts
         Responsibility: One-time legacy upgrade. Runs smart extraction then placeholder fallback.
                         Calls Layer 3 validator before any DB write. Sets spec_migrated = true on success.
         Targets: lessons where schema_version IS NULL OR < '2.0'.
```

Approach: **Hybrid** — the spec's 9-step order is the canonical default. The Conductor can adjust sequencing for approved arc types (`tension_first`, `exploratory`) while all dependency rules remain in force.

---

## Layer 1 — New Block Types (`lib/types/lesson-blocks.ts`)

Four new pedagogical primitives are added to the block type union.

### `HookBlock`

```typescript
export interface HookBlock {
  type: 'hook';
  content: string;        // opening question, scenario, statistic, or contradiction
  hook_style: 'question' | 'scenario' | 'statistic' | 'contradiction';
  visual_prompt?: string;
  analytics_tag: 'hook'; // locked — read by tracking layer via data-analytics-tag
  id?: string;            // optional for targeted repair and analytics correlation
}
```

### `TeachingLineBlock`

```typescript
export interface TeachingLineBlock {
  type: 'teaching_line';
  line: string;    // the single core insight — exactly 1 sentence, max 25 words,
                   // no trailing colon, not phrased as a heading or label
  support: string; // 1-2 sentences expanding on the line
  analytics_tag: 'teaching_line';
  id?: string;
}
```

Validator enforces `line` constraints as **warnings**, not hard errors. Overlong or heading-style `line` triggers a warning; if warnings exceed threshold, one regeneration retry is attempted. Lesson can still be inserted with `spec_compliant = false` if the second pass also fails.

### `MentalCheckpointBlock`

```typescript
export interface MentalCheckpointBlock {
  type: 'mental_checkpoint';
  prompt: string;
  checkpoint_style: 'reflection' | 'predict' | 'confidence_pick';
  response_mode: 'reflective' | 'diagnostic' | 'confidence';
  options?: string[]; // required when checkpoint_style === 'confidence_pick';
                      // must be absent for other styles unless explicitly needed
  analytics_tag: 'mental_checkpoint';
  id?: string;
}
```

### `PredictionBlock`

```typescript
export interface PredictionBlock {
  type: 'prediction';
  prompt: string;   // "What do you think happens when...?"
  hint?: string;
  analytics_tag: 'prediction';
  id?: string;
}
```

**Prediction compliance policy (three distinct contexts):**

| Context | Prediction status |
|---|---|
| Fresh generation prompt | Required — generator must produce it |
| Validator compliance (`spec_compliant`) | Strongly expected but not required — missing prediction = warning only |
| Legacy backfill | Not auto-generated — logged as warning, lesson can still reach `spec_compliant = true` without it |

This distinction is intentional. Prediction requires authorial intent about what the learner is predicting — it cannot be reliably inferred from existing block content.

### DB migration (`supabase/migrations/20260402_spec_v1_columns.sql`)

```sql
ALTER TABLE course_lessons
  ADD COLUMN schema_version           TEXT    DEFAULT '2.0',
  ADD COLUMN pedagogical_spec_version TEXT    DEFAULT '1.0',
  ADD COLUMN spec_compliant           BOOLEAN DEFAULT FALSE,
  ADD COLUMN spec_migrated            BOOLEAN DEFAULT FALSE,
  ADD COLUMN has_spec_placeholders    BOOLEAN DEFAULT FALSE;
```

**Column semantics:**

| Column | Meaning |
|---|---|
| `spec_compliant` | Validator passed at insert time — structural requirements met |
| `spec_migrated` | Lesson was upgraded by the backfill script from legacy content |
| `has_spec_placeholders` | One or more required blocks were inserted as placeholders (content needs editorial review) |

A lesson that is freshly generated and passes the validator: `spec_compliant = true`, `spec_migrated = false`, `has_spec_placeholders = false`.  
A legacy lesson upgraded by backfill with smart extraction: `spec_compliant = true`, `spec_migrated = true`, `has_spec_placeholders = false`.  
A legacy lesson upgraded by backfill with placeholder fallback: `spec_compliant = true`, `spec_migrated = true`, `has_spec_placeholders = true`.

### Analytics tracking

All 4 new block types carry a locked `analytics_tag` field. Components render `data-analytics-tag={block.analytics_tag}` on their root element. PostHog reads this attribute — no special-casing inside components.

| Tag | Events to track from day one |
|---|---|
| `hook` | impression, scroll-past (completion proxy), interaction depth (if hooks become tappable) |
| `teaching_line` | impression, visibility duration (bucketed: <5s / 5-15s / 15s+) |
| `mental_checkpoint` | impression, option selected, option value, abandon rate (impression with no interaction) |
| `prediction` | impression, response submitted |

---

## Layer 2 — New React Components (`components/course/blocks/`)

Three new files:
- `hook.tsx`
- `teaching-line.tsx`
- `mental-checkpoint.tsx`

All wired into `block-renderer.tsx` switch. `prediction` renders as a variant of an existing block type (to be decided during implementation) or as its own component — implementation detail deferred to plan.

---

## Layer 3 — Validator & Repair (`lib/ai/content-sanitizer.ts`)

### Function signatures

```typescript
function validateLessonPedagogy(
  blocks: ContentBlock[],
  arcType: ArcType
): ValidationResult

function repairLessonSequence(
  blocks: ContentBlock[],
  arcType: ArcType
): RepairResult
```

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];    // structural violations — must fix before insert
  warnings: ValidationWarning[]; // quality/ordering issues — trigger retry at threshold
}

interface RepairResult {
  repaired: boolean;
  changes: RepairChange[];
  riskLevel: 'low' | 'high';
  blocks: ContentBlock[];
}
```

The function is constraint-based, not a rigid positional checker (except where position is the actual constraint).

### Required presence (errors)

- `hook` must exist
- `core_explanation` must exist (at least one)
- `teaching_line` must exist
- `mental_checkpoint` must exist

### Dependency ordering rules

All positions are **1-indexed in configuration**; validator uses 0-based indices internally.

| Constraint | Rule | Arc override allowed |
|---|---|---|
| `hook_position_limit` | Hook must be in position 1 or 2 | `tension_first`: position 1-3; `exploratory`: position 1-4 |
| `contrast_before_hook` | Contrast blocks must not precede hook | `tension_first`: contrast may be first IF hook is still in position 1-3 AND prediction still precedes first core_explanation |
| `prediction_order` | `prediction` (if present) must precede first `core_explanation` | none |
| `core_before_checkpoint` | `core_explanation` must precede `mental_checkpoint` | none |
| `core_before_interaction` | `core_explanation` must precede `inline_quiz` | none |
| `process_position` | `process`/`flow_diagram` must appear after `core_explanation` and before closure phase | `exploratory`: flexible |
| `summary_position` | `recap_slide` and `key_terms` must be within last 2 blocks; `teaching_line` must be in Consolidation or Closure phase (not Discovery or Instruction) | none |

**`process_position` default:** "after `core_explanation`, before closure" — not required to be immediately adjacent. `strict: true` mode (optional, not default) means near-adjacent.

### Quality warnings

- `teaching_line.line` > 25 words → warning
- `teaching_line.line` ends with `:` → warning
- `teaching_line.line` matches `/^(introduction|overview|summary|key (points|takeaways)|in this lesson)/i` → warning
- `mental_checkpoint` has `options` present but `checkpoint_style !== 'confidence_pick'` → warning

### Repair — low-risk (auto-applied)

- `summary` not in last 2 blocks → move to last position
- `prediction` after `core_explanation` → swap to before
- `process` before `core_explanation` → move to after
- `hook` missing → inject placeholder at position 0
- `teaching_line` missing → inject after last `core_explanation`, or before first `inline_quiz`
- `mental_checkpoint` missing → inject after first `core_explanation` or `process`

All injected placeholders carry:
```typescript
is_placeholder: true,
placeholder_reason: 'missing_hook' | 'missing_teaching_line' | 'missing_mental_checkpoint',
backfill_injected: true   // used by backfill; runtime repair uses repair_injected: true
```

### Repair — high-risk (flagged, not auto-applied)

- `core_explanation` absent entirely
- More than 3 blocks need reordering
- Any repair would move a block across more than one pedagogical phase boundary

### Pedagogical phase boundaries

| Phase | Block types |
|---|---|
| **Discovery** | `hook`, `prediction` |
| **Instruction** | `core_explanation`, `process`, `flow_diagram`, `concept_illustration` |
| **Consolidation** | `mental_checkpoint`, `applied_case`, `industry_tabs`, `teaching_line` |
| **Closure** | `inline_quiz`, `recap_slide`, `key_terms`, `completion_card` |

Notes:
- `teaching_line` is allowed in Consolidation **or** Closure — it is not pinned to end-of-lesson
- Generic layout containers (`image_text_row`, `section_divider`) are excluded from phase mapping and do not trigger the phase boundary guard

### Route decision logic (`generate-v2/route.ts`)

```typescript
const validation = validateLessonPedagogy(cleanBlocks, arcType);

if (!validation.valid) {
  const repair = repairLessonSequence(cleanBlocks, arcType);
  if (repair.riskLevel === 'low') {
    cleanBlocks = repair.blocks; // auto-apply, log changes
  } else {
    // attempt exactly one regeneration retry
    // if second attempt also fails validation → insert with spec_compliant = false
    // log: validation errors, repair result, retry failure
  }
}
```

Maximum **1 regeneration retry**. Behaviour is deterministic — no unbounded retry loops.

---

## Layer 4 — Conductor Changes (`lib/ai/conductor/arc-definitions.ts`)

### Typed override surface (discriminated union)

```typescript
type ArcConstraintOverride =
  | { constraint: 'hook_position_limit';    newParams: { maxPosition: number } }
  | { constraint: 'contrast_before_hook';   newParams: { allowed: boolean } }
  | { constraint: 'process_position_strict'; newParams: { strict: boolean } }

interface ArcDefinition {
  name: ArcType;
  beats: Beat[];
  description: string;
  sequenceOverride?: ArcConstraintOverride[];
}
```

`prediction_position_strict` is **not** in the override surface. It was considered and excluded — the constraint is not expected to need arc-level adjustment.

### Approved overrides (only these two arcs)

```typescript
tension_first: {
  sequenceOverride: [
    { constraint: 'contrast_before_hook',   newParams: { allowed: true } },
    { constraint: 'hook_position_limit',    newParams: { maxPosition: 3 } },
    // When contrast_before_hook is active: hook must still be by position 3;
    // prediction must still precede the first core_explanation.
    // Valid opening: [contrast, hook, prediction, ...]
    // Invalid:       [contrast, flow_diagram, hook, ...]
  ]
}

exploratory: {
  sequenceOverride: [
    { constraint: 'hook_position_limit',      newParams: { maxPosition: 4 } },
    { constraint: 'process_position_strict',  newParams: { strict: false } },
  ]
}
```

### Override integrity guards

At startup (or build time), the override map is validated:
- Only `tension_first` and `exploratory` may carry `sequenceOverride`
- Unknown constraint IDs in overrides fail validation
- Overrides cannot add new required blocks or alter required block presence
- Overrides cannot move any required closure block (`teaching_line`, `recap_slide`, `key_terms`) into the Discovery phase

### Conductor → generator communication

`conductorNotes` is prepended to the LessonExpanderAgent prompt. For `tension_first` and `exploratory` arcs, `conductorNotes` includes a `SEQUENCE ADJUSTMENT` section with explicit plain-English reordering instructions. The generator does not need to know about arc types — Conductor translates arc intent into natural language.

---

## Layer 5 — Generator Prompt (`lib/ai/agent-system-v2.ts`)

The following block is injected into the LessonExpanderAgent prompt between Conductor notes and the block schema.

---

```
═══════════════════════════════════════════════════════════
PEDAGOGICAL STRUCTURE — UNIVERSAL LESSON SPEC v1.0
═══════════════════════════════════════════════════════════

Every lesson MUST include the following pedagogical components
in the default sequence below.

If a valid SEQUENCE ADJUSTMENT is provided by the Conductor
for an approved arc, follow that adjusted sequence while
preserving all dependency rules. Only reorder the components
named in the adjustment. Do not change required block
presence or field rules.

─────────────────────────────────────────────────────────
STEP 1 — HOOK  (block type: "hook")
  Role:    Create curiosity and cognitive buy-in before any
           teaching begins.
  Where:   Position 1 or 2 in the lesson.
  Purpose: The learner must feel a gap between what they
           know and what they are about to learn. Use a
           question, statistic, contradiction, or scenario.
           DO NOT open with a definition (e.g. "X is a...")
           DO NOT explain anything yet.
  Fields:  content, hook_style, visual_prompt (optional)

STEP 2 — PREDICTION  (block type: "prediction")
  Role:    Activate prior knowledge and create a stake.
  Where:   After the hook, before any core_explanation.
  Purpose: Ask the learner to guess or predict before the
           explanation arrives. The prediction does not need
           to be correct — it creates a mental anchor.
  Fields:  prompt, hint (optional)

STEP 3 — CORE EXPLANATION  (block type: "core_explanation")
  Role:    Deliver the concept in plain language.
  Where:   After hook and prediction.
  Purpose: One concept. No jargon without definition.
           Max 3 sentences per paragraph.
  Anti-patterns:
           - Do not repeat the hook in different words
           - Do not drift into generic motivational copy

STEP 4 — HOW IT WORKS  (block type: "process" or "flow_diagram")
  Role:    Show the mechanism, not just the idea.
  Where:   After core_explanation, before closure.
  Purpose: A causal mental model — what causes what, in
           what order. Use flow_diagram for sequential
           steps; process for non-sequential mechanisms.

STEP 5 — REAL-WORLD ANCHOR  (block type: "applied_case" or "industry_tabs")
  Role:    Ground the concept in a recognisable context.
  Where:   After process, in Consolidation.
  Purpose: One concrete example from a real industry, role,
           or clearly realistic scenario the learner can
           picture themselves in. Prefer real contexts;
           avoid vague hypotheticals.

STEP 6 — CONTRAST  (block type: appropriate explanatory block)
  Role:    Sharpen understanding by showing what the concept
           is NOT.
  Where:   After the real-world anchor. tension_first arc
           may place this first per Conductor notes.
  Purpose: A before/after, old-way/new-way, or misconception/
           correction pair. Use whichever block type best
           expresses the contrast — typically concept_illustration.

STEP 7 — MENTAL CHECKPOINT  (block type: "mental_checkpoint")
  Role:    Mid-lesson comprehension pause.
  Where:   After core_explanation and process — before
           inline_quiz and summary.
  Purpose: NOT a graded quiz. A moment for the learner to
           self-assess. Must come after enough instruction
           to have something to check against.
  Fields:  prompt, checkpoint_style, response_mode,
           options (required only for confidence_pick)

STEP 8 — INTERACTION  (block type: "inline_quiz")
  Role:    Graded knowledge check.
  Where:   After mental_checkpoint, before summary.
  Purpose: One question. Tests recall or application.
           Must connect to core_explanation content.

STEP 9 — SUMMARY  (blocks: "teaching_line" + "recap_slide" + "key_terms" if needed)
  Role:    Consolidate and close.
  Where:   Final blocks of the lesson.

  teaching_line (REQUIRED):
    The single most important sentence the learner should
    remember. Exactly one sentence. Max 25 words. No
    trailing colon. Not phrased as a heading or label.

  recap_slide (STRONGLY EXPECTED):
    3-4 bullet recap of what was covered.

  key_terms (INCLUDE ONLY if technical vocabulary was
    introduced that benefits from explicit definition):
    Do not force this block into lessons with no terminology.
─────────────────────────────────────────────────────────

Do not leave any required pedagogical fields empty.
Generate complete, learner-facing content for every
required block — the validator cannot fill gaps for you.

Before finalising your output, verify that all required
pedagogical components are present exactly once.
═══════════════════════════════════════════════════════════
```

---

The existing `BANNED_WORDS_INSTRUCTION` and `ANTI-AI PHRASE BAN` sections remain in the prompt unchanged. The spec block sits between Conductor notes and the block schema.

---

## Layer 6 — Backfill Script (`scripts/inject-spec-blocks.ts`)

Same interface as `fix-banned-words-in-titles.ts`: dry-run by default, `--apply` to write.

### Target scope — legacy lessons only

```sql
WHERE (schema_version IS NULL OR schema_version < '2.0')
  AND spec_migrated IS NOT TRUE
```

This prevents the script from touching newly generated but temporarily non-compliant lessons. Backfill is a legacy upgrade tool, not a catch-all repair job.

### Per-lesson process

1. Parse `content_blocks`
2. Detect missing spec blocks: `hook`, `teaching_line`, `mental_checkpoint`
3. For each missing block, attempt smart extraction; fall back to placeholder
4. Run `validateLessonPedagogy()` on the result
5. If valid: write blocks, set compliance flags
6. If invalid after backfill: log failure, skip write — lesson stays for manual review

### Smart extraction rules

**`hook` missing:**
- Candidate 1: First block is `callout_box` or `punch_quote` → convert to `hook`; set `hook_style` by content shape (`?` → `question`; contains a number → `statistic`; else → `scenario`)
- Candidate 2: First `core_explanation` has ≥ 2 sentences AND first sentence is not definitional (does not match `/^(X is|A .+ is|.+ refers to)/i`) → extract first sentence as `hook.content`, remove from explanation
- Fallback: placeholder at position 0, `is_placeholder: true`, `placeholder_reason: 'missing_hook'`, `backfill_injected: true`

**`teaching_line` missing:**
- Candidate 1: Any `punch_quote` block → its `quote` field becomes `teaching_line.line`, supporting text becomes `support`; remove original `punch_quote`
- Candidate 2: Last sentence of last `core_explanation` — extracted only if all four guards pass: (a) exactly one sentence, (b) ≤ 25 words, (c) not a generic heading pattern, (d) not transitional copy (`"In the next section..."`, `"As we have seen..."`)
- Fallback: placeholder after last `core_explanation`, or before first `inline_quiz` if none

**`mental_checkpoint` missing:**
- No smart extraction possible
- Always a placeholder: after first `core_explanation` or `process` block; if neither, before first `inline_quiz`
- `placeholder_reason: 'missing_mental_checkpoint'`

**`prediction` missing:**
- Not auto-generated in backfill
- Logged as a warning in dry-run output
- Lesson can reach `spec_compliant = true` without prediction (per compliance policy above)

### Provenance fields on all injected/converted blocks

```typescript
is_placeholder?: boolean;
placeholder_reason?: 'missing_hook' | 'missing_teaching_line' | 'missing_mental_checkpoint';
backfill_injected?: boolean;  // backfill script insertions
// Note: runtime repair layer uses repair_injected?: boolean — separate provenance
```

### Deterministic placement rules

| Block | Insertion position |
|---|---|
| `hook` | Position 0 (first block) |
| `teaching_line` | After last `core_explanation`; if none, before first `inline_quiz`; if none, second-to-last |
| `mental_checkpoint` | After first `core_explanation` or `process`; if neither, before first `inline_quiz` |

Phase boundary guard applies: if the deterministic position would cross more than one phase boundary, insert at the nearest valid position within the correct phase and log the deviation.

### DB writes on success

```sql
UPDATE course_lessons SET
  content_blocks           = $cleanedBlocks,
  spec_compliant           = TRUE,
  spec_migrated            = TRUE,
  has_spec_placeholders    = $hasPlaceholders,
  pedagogical_spec_version = '1.0',
  schema_version           = '2.0'
WHERE id = $lessonId;
```

### Dry-run output format

```
📋 Lesson 3578 — "What Is a Neural Network?" (course 834)
  MISSING: hook, mental_checkpoint
  → hook: extracted from punch_quote at position 0 ✓
  → mental_checkpoint: placeholder injected after block 3 (core_explanation) ✓
  → prediction: not present — warning only (no auto-generation)
  → validateLessonPedagogy: PASS
  → Would write 2 changes, has_spec_placeholders: true [dry-run]

📋 Lesson 3583 — "Bias in AI Systems" (course 834)
  MISSING: teaching_line
  → teaching_line: last sentence of core_explanation extracted (18 words) ✓
  → validateLessonPedagogy: PASS
  → Would write 1 change, has_spec_placeholders: false [dry-run]

⚠️  Lesson 3601 — "Reinforcement Learning Basics" (course 831)
  MISSING: hook, teaching_line, mental_checkpoint
  → hook: placeholder injected at position 0
  → teaching_line: placeholder injected (no valid extraction candidate)
  → mental_checkpoint: placeholder injected after block 2 (core_explanation)
  → validateLessonPedagogy: PASS
  → Would write 3 changes, has_spec_placeholders: true [dry-run]

─────────────────────────────────────────────────────────────
Summary
  Lessons scanned:           12
  Lessons pass-ready:         9
  Lessons skipped (invalid):  1
  Placeholder injections:     5
  Manual review required:     1
─────────────────────────────────────────────────────────────
Run with --apply to write changes.
```

---

## What Is Not Changing

- The Conductor rhythm engine (arc selection, beat weights, signature moments) — unchanged
- The CourseDNA system — unchanged
- The block-renderer.tsx switch structure — 3 new cases added only
- The generate-v2 route structure — only the validator call is added
- All 22 existing block components — unchanged

---

## Open Items (Deferred to Implementation Plan)

1. `prediction` block renderer — determine whether it warrants its own component or reuses an existing one
2. `hook` component visual design — 4 `hook_style` values may need 4 distinct visual treatments or a single flexible layout
3. `mental_checkpoint` UI interaction model — how does "confidence_pick" render on mobile
4. Whether `teaching_line` gets its own variation modes (like the 10 blocks in the variation system)
