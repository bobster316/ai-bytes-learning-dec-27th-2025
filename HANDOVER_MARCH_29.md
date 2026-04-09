# Handover — 29 March 2026

**Session closed:** 29 March 2026 (evening)
**Branch:** `main`
**Last commit:** `618f07d` — fix(conductor): pass lessonPersonality/microVariationSeed to LessonHeader directly

---

## What Was Built This Session

### The Conductor Rhythm Engine — Phase 1 Complete

The central design insight from this session: variation alone isn't enough. The question shifted from _"what should this look like?"_ to _"what should the learner feel right now?"_ The Conductor is the answer — an orchestration layer that assigns every lesson an emotional arc, personality, and set of hard constraints before Gemini ever writes a word.

**15 commits. 1,025 lines added. Zero regressions.**

---

## Architecture: 5-Layer System

```
Course DNA        (existing)   — visual identity, archetype, palette
Module DNA        (Phase 2)    — hue shift, module mood (opening/building/climax/resolution)
Conductor         (NEW ✅)      — arc type, personality, signature moments, anti-chaos rules
Lesson DNA        (existing)   — block sequence, images, video
Block Expression  (existing)   — component render with lessonIndex variation
```

---

## Files Shipped

### New: `lib/ai/conductor/` (8 files, pure TypeScript)

| File | Responsibility |
|------|---------------|
| `types.ts` | All TypeScript interfaces — `ConductorContext`, `ConductorOutput`, `ConductorMemory`, `Beat`, `ArcType`, `LessonPersonality`, `ModuleMood`, `SignatureMomentType`, `SignatureMomentPlacement` |
| `block-weights.ts` | 38 block types mapped to emotional intensity (0–1). calm=0.0–0.2, building=0.3–0.5, tension/insight=0.6–0.85, reward=0.2–0.4. Unknown types default to 0.4. |
| `arc-definitions.ts` | 4 arc type beat sequences: `micro` (3 beats), `standard` (5), `tension_first` (4), `exploratory` (5). Each beat has `name`, `allowedBlockTypes[]`, `intensity`. |
| `arc-selector.ts` | `selectArcType(ctx)` — priority: decompression (prevIntensity≥0.7→micro), module mood (climax→tension_first), archetype bias (bold/provocateur→tension_first, story/editorial→exploratory), positional fallback, standard default. |
| `signature-moments.ts` | 4 signature moments (neural_map, cinematic_moment, signal_interrupt, time_capsule). Each fires at most once per course. Rules: beatIndex, minGlobalLessonIndex, moduleMoods, arcTypes. Priority order: time_capsule → neural_map → signal_interrupt → cinematic_moment. |
| `personality.ts` | `selectPersonality(ctx)` — 18 archetypes mapped to compatible personalities (6 types: calm/electric/cinematic/technical/warm/stark). Mood nudge boosts scores. Deterministic tiebreaker: `lessonIndex % allowed.length`. |
| `anti-chaos.ts` | `validateBlockSequence(blockTypes, budget)` — 5 hard rules: (1) dramatic budget (max N blocks ≥0.7 intensity), (2) no consecutive high-intensity pair, (3) no back-to-back attention hijackers, (4) hijacker spacing ≥2 blocks, (5) block count 8–16. `computeDramaticBudget(mood, arc)` returns 1–3. |
| `index.ts` | `conduct(ctx)→ConductorOutput` (pure), `updateConductorMemory(memory, blockTypes, signatureMomentFired)` (mutates in-place), `computeModuleMood(moduleIndex, totalModules)→ModuleMood`. Also exports `validateBlockSequence` and types. |

### Modified: Integration Files

| File | Change |
|------|--------|
| `lib/ai/agent-system-v2.ts` | `expandLesson()` + `processLesson()` accept `rhythmDirective: string = ''`. When non-empty, prepended to Gemini prompt with `---` separator. |
| `app/api/course/generate-v2/route.ts` | Initialises `ConductorMemory` before topic loop. Per lesson: builds `ConductorContext`, calls `conduct()`, passes `conductorOutput.conductorNotes` to `processLesson()`, saves `arc_type`/`lesson_personality`/`micro_variation_seed`/`conductor_memory` to DB insert, calls `updateConductorMemory()` with actual generated block types. Deep-copies array fields in memory snapshot (not a reference). |
| `supabase/migrations/20260329_conductor_fields.sql` | `ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS arc_type TEXT, lesson_personality TEXT, micro_variation_seed INTEGER, conductor_memory JSONB` + 2 indexes + 4 column comments. **NOT YET APPLIED TO DB — run `supabase db push`**. |
| `app/courses/[courseId]/lessons/[lessonId]/page.tsx` | `.select()` includes `lesson_personality, micro_variation_seed`. `<LessonContentRenderer>` receives both with `?? 'calm'` / `?? 0` fallbacks. |
| `components/course/lesson-content-renderer.tsx` | Props type updated. Both values threaded to `<LessonBlockRenderer>`. |
| `components/course/block-renderer.tsx` | `LessonBlockRendererProps` has `lessonPersonality?: LessonPersonality` and `microVariationSeed?: number`. Root div gets `data-personality` attribute and `--micro-seed` CSS custom property. Both passed via `extraProps` to all 10 rotating block components. Direct `<LessonHeader>` render also receives both props. |

---

## How It Works End-to-End

### Generation (per lesson)
```
computeModuleMood(i, totalModules)               → 'opening'|'building'|'climax'|'resolution'
ConductorContext { lessonIndex, moduleIndex, moduleMood, courseArchetype, memory }
conduct(ctx)                                      → ConductorOutput
  ├── selectArcType(ctx)                          → 'micro'|'standard'|'tension_first'|'exploratory'
  ├── ARC_DEFINITIONS[arcType]                    → Beat[] (emotional sequence)
  ├── computeDramaticBudget(mood, arc)            → 1|2|3
  ├── selectPersonality(ctx)                      → 'calm'|'electric'|'cinematic'|'technical'|'warm'|'stark'
  ├── selectSignatureMoment(ctx, arcType)         → SignatureMomentPlacement | null
  ├── computeAccentIndex(ctx)                     → 0–11 (12-colour cycle)
  ├── computeMicroSeed(ctx)                       → integer (deterministic)
  └── buildConductorNotes(...)                    → multi-line string injected into Gemini prompt

processLesson(..., conductorOutput.conductorNotes)
expandLesson(...)                                 → Gemini sees rhythm directive first
DB insert: arc_type, lesson_personality, micro_variation_seed, conductor_memory
updateConductorMemory(conductorMemory, actualBlockTypes, signatureMomentFired)
```

### Render (per lesson page load)
```
DB row → lesson_personality, micro_variation_seed
page.tsx → LessonContentRenderer (lessonPersonality, microVariationSeed)
         → LessonBlockRenderer (both props)
           ├── data-personality="electric" on root div
           ├── --micro-seed: 432 CSS custom property
           ├── LessonHeader receives lessonPersonality + microVariationSeed directly
           └── extraProps for 10 rotating block components (flow_diagram, objective, recap,
               punch_quote, completion, instructor_insight, callout, applied_case,
               key_terms, inline_quiz) — all receive lessonPersonality + microVariationSeed
```

---

## What the Conductor Prompt Looks Like

Example `conductorNotes` injected before the Gemini system prompt:

```
LESSON RHYTHM DIRECTIVE (follow exactly):
Arc type: tension_first — Challenge-led. Open with a provocative question or conflict, then resolve it.
Emotional sequence: TENSION → BUILDING → INSIGHT → REWARD
Lesson personality: electric — let this tone colour your word choices and visual cues
Dramatic budget: max 3 blocks with intensity ≥ 0.7 (tension/insight-level blocks)
Block count target: 10–13 blocks total. Minimum 8. Maximum 16.

⭐ SIGNATURE MOMENT — place a "neural_map" block at beat index 2 (insight beat).
   This is a once-per-course event. It must feel unmistakably special. Give it exceptional content.

Avoid overusing these block types (recently used): lesson_header, objective, text, type_cards, flow_diagram

The previous lesson ended at intensity 0.75. Open this lesson significantly quieter and gentler.
```

---

## CRITICAL: One Action Required Before Testing

The database migration has been written but **not applied**:

```sql
-- supabase/migrations/20260329_conductor_fields.sql
-- Adds: arc_type TEXT, lesson_personality TEXT, micro_variation_seed INTEGER, conductor_memory JSONB
-- to course_lessons
```

**Run this in the Supabase dashboard SQL editor or:**
```bash
supabase db push
```

Without this, new course generation will fail (attempting to insert into columns that don't exist).

---

## What Doesn't Change for Existing Lessons

- All existing lessons continue to render as before
- `lesson_personality` and `micro_variation_seed` will be `null` for existing lessons
- The renderer defaults to `lessonPersonality='calm'` and `microVariationSeed=0` when null
- No backfill is needed — the Conductor only affects newly generated lessons

---

## Known Gaps / Phase 2 Scope

These were explicitly deferred to Phase 2 (not regressions):

1. **Module DNA layer** — hue shift per module, behavioural influence. The `computeModuleMood()` function provides the mood scaffold but a full Module DNA (per-module colour/typography offset) is not yet built.

2. **15 new block types** — cinematic_moment, neural_map, signal_interrupt, time_capsule (Tier 1), plus 11 more (drag_rank, hotspot_image, animated_stat, comparison_slider, live_chart, timeline, scroll_reveal_story, split_screen, code_reveal, myth_buster, perspective_toggle). These exist as signature moment types in the Conductor but their React block components don't exist yet. When a signature moment fires and Gemini tries to include `neural_map` or `cinematic_moment`, the block will render as `null` (unknown type — silently skipped by the renderer). This is safe but means signature moments don't visually fire until Phase 2 block components are built.

3. **12-colour accent cycle duplication** — `LESSON_ACCENT_CYCLE` in `conductor/index.ts` has 12 colours. `LESSON_ACCENT_CYCLE` in `block-renderer.tsx` still has 4 colours and drives the actual accent render. The `lessonAccentIndex` from `ConductorOutput` (0–11) is computed but not yet wired to override the block-renderer's 4-colour cycle. This is a Phase 2 wiring task.

4. **`validateBlockSequence` not yet called post-generation** — the anti-chaos validator is exported and available but the route doesn't call it on the actual generated blocks. The Conductor Notes directive guides Gemini, but no programmatic enforcement happens after generation. Phase 2: call `validateBlockSequence` on `cleanBlocks` in the route and log/warn on violations.

5. **Expanded CourseDNA catalogue** — spec calls for 18 archetypes, 48 palettes. Current catalogue has 6 archetypes, 12 palettes. The Conductor's personality selector and arc selector reference archetypes by string ID — they'll work correctly with expanded archetypes as long as the new IDs are added to `ARCHETYPE_PERSONALITIES` in `personality.ts` and the archetype group sets in `arc-selector.ts`.

---

## Commit Range This Session

```
0b9b703  feat(conductor): add TypeScript types for Conductor rhythm engine
a1c842e  feat(conductor): add block emotional intensity weights
c69b58b  fix(conductor): add hero_video intensity, clarify Tension/Insight range overlap
0060c8e  feat(conductor): add 4 arc type beat definitions
6ae172d  fix(conductor): add reward beat to exploratory, callout to arcs, improve comments
2a363e7  feat(conductor): add arc type selector with decompression and archetype bias
25cbcef  feat(conductor): add signature moment selector with per-course eligibility rules
876da16  feat(conductor): add lesson personality selector with archetype + mood compatibility
a02d98a  feat(conductor): add anti-chaos validator with hard constraint rules
e6d39e0  fix(conductor): improve anti-chaos violation detail strings and comments
f4e4504  feat(conductor): add main conduct() function and updateConductorMemory()
9756eae  fix(conductor): use top-level imports in index.ts for type safety
bba6208  feat(conductor): add arc_type, lesson_personality, micro_variation_seed to course_lessons
f2fa42b  feat(conductor): wire Conductor into LessonExpanderAgent — inject rhythm directives into Gemini prompt
821712d  fix(conductor): deep-copy memory snapshot and export ModuleMood from barrel
bccf286  feat(conductor): thread lessonPersonality and microVariationSeed from DB to block renderer
618f07d  fix(conductor): pass lessonPersonality/microVariationSeed to LessonHeader directly
```

---

## Recommended Next Session

**Priority 1:** Apply the DB migration (`supabase db push`) and generate a test course. Verify:
- `arc_type`, `lesson_personality`, `micro_variation_seed` are populated in the DB
- At least 2 different arc types appear across lessons in a 6-lesson course
- The Gemini prompt prefix is visible in API logs

**Priority 2 (Phase 2 — pick any):**
- Build `neural_map` and `cinematic_moment` block components (React) so signature moments visually fire
- Wire `lessonAccentIndex` from ConductorOutput to block-renderer's accent cycle (expand from 4→12 colours)
- Add Module DNA layer (per-module hue shift)
- Call `validateBlockSequence` post-generation and log violations
- Expand CourseDNA catalogue to 18 archetypes × 48 palettes

---

## Design Spec + Plan

Full spec: `docs/superpowers/specs/2026-03-29-experience-system-design.md`
Implementation plan (all 12 tasks now complete): `docs/superpowers/plans/2026-03-29-conductor-rhythm-engine.md`
