# Handover — Universal Lesson Spec v1.0 Implementation
**Date:** 3 April 2026  
**Branch:** main  
**Status:** Tasks 1–15 complete. Tasks 16–17 blocked on DB migration.

---

## What Was Built

The Universal Lesson Spec v1.0 — a 9-step pedagogical structure enforced across all AI Bytes lesson generation. Every lesson must now contain: hook → prediction → core_explanation → process → real-world anchor → contrast → mental_checkpoint → quiz → (teaching_line + recap).

---

## Commits This Session (in order)

| Commit | Message |
|--------|---------|
| `7f52370` | chore: add vitest for unit testing |
| `9ce172a` | feat(types): add HookBlock, TeachingLineBlock, MentalCheckpointBlock, CoreExplanationBlock |
| `306ebd1` | feat(db): add spec compliance columns to course_lessons |
| hook commit | feat(component): add Hook block component |
| teaching-line commit | feat(component): add TeachingLine block component |
| mental-checkpoint commit | feat(component): add MentalCheckpoint block component |
| `57c1f9d` | feat(renderer): wire hook, teaching_line, mental_checkpoint, core_explanation into block renderer |
| `9210bb8` | feat(sanitizer): add required-field defaults for 4 new spec block types |
| validator commit | feat(validator): implement validateLessonPedagogy and repairLessonSequence |
| conductor commit | feat(conductor): add ArcDefinition + sequenceOverride; inject SEQUENCE ADJUSTMENT into conductorNotes |
| `agent-system` commit | feat(generator): inject Universal Lesson Spec v1.0 into LessonExpanderAgent prompt |
| route commit | feat(route): wire pedagogical validator into generate-v2 with soft/enforce gate |
| backfill commit | feat(backfill): implement inject-spec-blocks.ts for legacy lesson spec upgrade |

---

## Files Changed

### New files
| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest unit test configuration |
| `components/course/blocks/hook.tsx` | Hook block — 3 visual modes (Question, Impact, Contradiction) |
| `components/course/blocks/teaching-line.tsx` | TeachingLine block — 3 visual modes |
| `components/course/blocks/mental-checkpoint.tsx` | MentalCheckpoint block — interactive confidence/reflect/predict |
| `supabase/migrations/20260402_spec_v1_columns.sql` | 5 new columns on course_lessons |
| `lib/ai/content-sanitizer/index.ts` | Barrel re-export for validateLessonPedagogy + repairLessonSequence |
| `lib/ai/content-sanitizer/__tests__/validator.test.ts` | 9 validator unit tests |
| `lib/ai/content-sanitizer/__tests__/repair.test.ts` | 4 repair unit tests |
| `lib/ai/conductor/__tests__/arc-overrides.test.ts` | 5 arc override unit tests |
| `scripts/inject-spec-blocks.ts` | Legacy lesson backfill script |

### Modified files
| File | What changed |
|------|-------------|
| `lib/types/lesson-blocks.ts` | +HookBlock, TeachingLineBlock, MentalCheckpointBlock, CoreExplanationBlock; `analytics_tag?` on PredictionBlock; ContentBlock union extended |
| `components/course/block-renderer.tsx` | hook/teaching_line/mental_checkpoint/core_explanation wired into BLOCK_COMPONENTS + WIDE_INNER |
| `lib/ai/content-sanitizer.ts` | +BLOCK_REQUIRED_FIELDS entries for 4 new types; +TYPE_MAP aliases; +validateLessonPedagogy(); +repairLessonSequence() |
| `lib/ai/conductor/types.ts` | +ArcConstraintOverride discriminated union; +ArcDefinition interface |
| `lib/ai/conductor/arc-definitions.ts` | Restructured from `Record<ArcType, Beat[]>` → `Record<ArcType, ArcDefinition>`; tension_first + exploratory now have sequenceOverride |
| `lib/ai/conductor/index.ts` | All `ARC_DEFINITIONS[arcType]` → `.beats`; SEQUENCE ADJUSTMENT injected into buildConductorNotes() |
| `lib/ai/agent-system-v2.ts` | UNIVERSAL_LESSON_SPEC constant added; injected between rhythmPrefix and SYSTEM: in expandLesson() |
| `app/api/course/generate-v2/route.ts` | validateLessonPedagogy + repairLessonSequence wired in; PEDAGOGY_GATE env var; 5 new columns in DB insert |
| `package.json` | vitest + @vitest/coverage-v8 devDependencies; "test" and "test:watch" scripts |

---

## Test Status

```
npm test  →  18 tests across 3 files — all PASSING
  - lib/ai/content-sanitizer/__tests__/validator.test.ts  (9 tests)
  - lib/ai/content-sanitizer/__tests__/repair.test.ts     (4 tests)
  - lib/ai/conductor/__tests__/arc-overrides.test.ts      (5 tests)
```

---

## CRITICAL — DB Migration NOT Applied Yet

The migration file exists at `supabase/migrations/20260402_spec_v1_columns.sql` but has **not** been pushed to the database.

**Run this first before anything else:**
```bash
cd "D:\ai-bytes-leaning-22nd-feb-2026 Backup"
npx supabase db push
```

This adds 5 columns to `course_lessons`:
- `schema_version TEXT DEFAULT '2.0'`
- `pedagogical_spec_version TEXT DEFAULT '1.0'`
- `spec_compliant BOOLEAN DEFAULT FALSE`
- `spec_migrated BOOLEAN DEFAULT FALSE`
- `has_spec_placeholders BOOLEAN DEFAULT FALSE`

**Until this migration is applied:**
- New course generation will fail when trying to insert the new columns
- The backfill script dry-run will error with `column course_lessons.schema_version does not exist`

**Note:** There may also be a pending Conductor migration `20260329_conductor_fields.sql` — check if this was already applied. If not, run `supabase db push` and it will apply both.

---

## Tasks 16–17 — Still Pending

These must be completed manually after the migration is applied:

### Task 16: Full test suite + smoke test
```bash
npm test                    # 18 unit tests should pass
npx tsc --noEmit            # TypeScript full check — 2 pre-existing errors on agent-system-v2.ts lines 871-872 are OK (SyntaxError.rawText — pre-existing)
npm run dev                 # start dev server
```
Then navigate to any existing lesson — verify it renders without crashing.

Generate a new course via Admin → New Course. Check:
- Server logs show `[PedagogyGate] (soft) Lesson "..." has validation issues:` — expected until generator is trained to always include new blocks
- Lesson page renders (hook, mental_checkpoint, teaching_line visible if Gemini included them)

Check DB after generation:
```sql
SELECT id, title, spec_compliant, spec_migrated, has_spec_placeholders, schema_version
FROM course_lessons
ORDER BY created_at DESC
LIMIT 5;
```

### Task 17: Backfill + rollout
```bash
# Dry-run backfill (read-only)
npx tsx scripts/inject-spec-blocks.ts

# Review output — if it looks clean, apply:
npx tsx scripts/inject-spec-blocks.ts --apply
```

**Rollout sequence:**
1. Apply DB migration (`supabase db push`)
2. Deploy with `LESSON_PEDAGOGY_GATE=off` (already set in .env.local for local dev)
3. Generate 2–3 test courses, review `[PedagogyGate]` logs
4. If pass rate > 80%, switch to `LESSON_PEDAGOGY_GATE=enforce`
5. Run backfill script on legacy lessons

---

## Architecture Summary

```
LessonExpanderAgent (Gemini prompt)
  ├── rhythmPrefix (Conductor notes)
  ├── UNIVERSAL_LESSON_SPEC (9-step spec — NEW)
  └── SYSTEM: You are an elite UK instructional designer...

generate-v2/route.ts
  ├── sanitizeBlocks()           — existing
  ├── validateLessonPedagogy()   — NEW: checks required blocks + ordering
  ├── repairLessonSequence()     — NEW: low-risk auto-repair + placeholders
  └── supabase insert            — now includes 5 new spec columns

Conductor
  ├── ARC_DEFINITIONS[arc].beats           — existing (accessor changed from direct array)
  ├── ARC_DEFINITIONS[arc].sequenceOverride — NEW: typed arc overrides
  └── buildConductorNotes()               — now emits SEQUENCE ADJUSTMENT section

Block renderer
  └── 4 new block types: hook, teaching_line, mental_checkpoint, core_explanation
```

---

## Key Design Decisions

1. **Validator is constraint-based, not positional.** It checks required presence + dependency rules (core_explanation before mental_checkpoint, etc.), not strict ordering. This avoids false positives on arc reordering.

2. **`LESSON_PEDAGOGY_GATE=off` (soft mode) deployed first.** Logs validation results without blocking. Switch to `enforce` only after observing soft-mode logs.

3. **Repair is low-risk only.** `repairLessonSequence()` injects placeholders for missing blocks (hook, teaching_line, mental_checkpoint) only when risk is low. High-risk cases (missing core_explanation, >3 reorders) return `repaired: false` — flagged for manual review.

4. **`core_explanation` is a new block type** (not pre-existing). The renderer maps it to `TextSection`. The generator is now instructed to use it for the primary explanatory block.

5. **`PredictionBlock` schema was NOT changed.** Existing schema (`question/options/correctIndex/reveal`) kept intact. Only `analytics_tag?: 'prediction'` added as optional.

6. **ARC_DEFINITIONS restructure is a breaking change.** All consumers of `ARC_DEFINITIONS[arcType]` must use `.beats`. This was done in `index.ts`. If any other file references `ARC_DEFINITIONS` directly, update it.

---

## Pre-existing Issues (not introduced by this session)

- `lib/ai/agent-system-v2.ts` lines 871-872: TypeScript errors on `e.rawText` (SyntaxError type narrowing) — pre-existing, not related to this work
- `--legacy-peer-deps` used when installing vitest due to `@e2b/sdk` peer conflict with openai v6 — safe, no functional impact

---

## Environment Variables

| Var | Default | Effect |
|-----|---------|--------|
| `LESSON_PEDAGOGY_GATE` | `'off'` | `'off'` = log only; `'enforce'` = hard gate on failed validation |

Already added to `.env.local` as `LESSON_PEDAGOGY_GATE=off`.
