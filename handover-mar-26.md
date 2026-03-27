# Handover — 26 March 2026

## What Was Done This Session

### Feature: Course Variation System (CourseDNA) — COMPLETE

Every generated course now has a distinct, deterministic visual identity and content personality. No two courses look or read identically.

All 12 tasks from the implementation plan were executed via subagent-driven development with spec compliance + code quality review after each task.

**Spec:** `docs/superpowers/specs/2026-03-26-course-variation-design.md`
**Plan:** `docs/superpowers/plans/2026-03-26-course-variation.md`

---

## Architecture Summary

### What CourseDNA Is

A JSON object (`CourseDNA`) generated deterministically from `courseId:title:difficulty` via SHA-256. It has two halves:

- **`content`** — writing personality injected into the AI generation prompt (archetype, writing style, example bias, question tone)
- **`render`** — visual identity applied by the frontend via React context (palette, background, typography, layout density, section divider)

### How It Flows

```
Course generation request
  → generateCourseDNA(courseId, title, difficulty)  ← SHA-256 → 7 seeds → picks values
  → Persisted to courses.course_dna (JSONB) + courses.dna_fingerprint (TEXT)
  → content.writing_style injected into LessonExpanderAgent prompt (v2 route only — see Known Gap)

Page load: /courses/[courseId]/...
  → app/courses/[courseId]/layout.tsx  ← Server Component, fetches course_dna from DB
  → getCourseDNARender(raw)            ← Zod parse, fallback to defaultRender on failure
  → <CourseDNAProvider render={render}>  ← wraps all course pages
  → useCourseDNA()  ← consumed by 8 components
```

---

## Files Created / Modified

| File | Status | What It Does |
|------|--------|--------------|
| `lib/types/course-upgrade.ts` | Modified | Added `CourseDNA` interface, `RawCourseDNA`, `CourseDNASchema` (Zod) |
| `lib/ai/course-dna-catalogue.ts` | Created | 6 archetypes, 12 palettes, 4 image aesthetics, 4 bg treatments, 3 typography personalities |
| `lib/ai/generate-course-dna.ts` | Created | `generateCourseDNA()`, `getCourseDNARender()`, `deriveDNAFingerprint()`, `archetypeOffset()`, `defaultRender` |
| `supabase/migrations/20260326_course_dna.sql` | Created | `ALTER TABLE courses ADD COLUMN course_dna JSONB, dna_fingerprint TEXT` |
| `lib/ai/agent-system-v2.ts` | Modified | `LessonExpanderAgent.expandLesson()` accepts `dnaContent` param; injects writing style/example bias/question tone into prompt |
| `app/api/course/generate/route.ts` | Modified | Generates DNA + fingerprint at generation time; persists to `courses` table (non-blocking) |
| `components/course/course-dna-provider.tsx` | Created | `CourseDNAContext`, `CourseDNAProvider`, `useCourseDNA()` hook |
| `app/courses/[courseId]/layout.tsx` | Created | Server Component; fetches DNA; renders `<CourseDNAProvider>` |
| `components/course/course-background.tsx` | Created | 4 bg treatments: `dark_mesh`, `grain_texture`, `subtle_grid`, `clean_flat` |
| `components/course/SectionDivider.tsx` | Created | 3 styles: `thin_rule`, `bold_number`, `dot_row` |
| `components/course/block-renderer.tsx` | Modified | Removed `LessonVariantContext`, added `useCourseDNA()` + `archetypeOffset()` |
| `components/course/lesson-progress-rail.tsx` | Modified | Removed `accent` prop; now calls `useCourseDNA()` internally |
| `components/course/lesson-content-renderer.tsx` | Modified | Removed inline blob divs/SVG grain; replaced with `<CourseBackground />` |
| `components/course/blocks/objective-card.tsx` | Modified | `accent` → `primary_colour` via `useCourseDNA()` |
| `components/course/blocks/text-section.tsx` | Modified | `accent` → `primary_colour` via `useCourseDNA()` |
| `components/course/blocks/type-cards.tsx` | Modified | `accent` → `primary_colour` via `useCourseDNA()` |
| `components/course/blocks/recap-slide.tsx` | Modified | Removed `variant`; `recapStyle` now from `archetypeOffset(palette_id, 3)` |

---

## Known Gap — Content Personality Not Active Yet

The content personality fields (`writing_style`, `example_bias`, `question_tone`) are wired into `LessonExpanderAgent.expandLesson()` in `lib/ai/agent-system-v2.ts`.

**However:** the main generation route (`app/api/course/generate/route.ts`) currently uses the v1 `AgentOrchestrator`, not `OrchestratorV2`. So the DNA content is persisted to the DB, but the prompt injection does not run.

**To activate:** Migrate the generation route from v1 `AgentOrchestrator` to `OrchestratorV2`. Once that migration happens, pass `courseDNA.content` as the last argument to `OrchestratorV2.processLesson()`. There is a `// TODO` comment in the route marking the exact spot.

The visual variation (colours, backgrounds, layout density) is fully active immediately — existing and new courses both benefit from it as soon as the DB columns exist.

---

## Manual Step Required

**Apply the DB migration.** The file `supabase/migrations/20260326_course_dna.sql` has been created but must be applied manually:

1. Go to Supabase Studio → SQL Editor
2. Paste and run:
```sql
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS course_dna       JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS dna_fingerprint  TEXT;
```

Until this is applied, the layout Server Component will receive `null` for `course_dna` and fall back to `defaultRender` (pulse_teal palette, dark_mesh background) for all courses — no errors, just no variation.

---

## Key Implementation Details

### `archetypeOffset(seed, modulus)`
Replaces the old `lessonVariant.variant % N` pattern. Takes any string (typically `palette_id`), sums charCodes, mods by N. Used in:
- `block-renderer.tsx` — TypeCards layout cycling: `archetypeOffset(palette_id, 4)`
- `recap-slide.tsx` — recap style: `archetypeOffset(palette_id, 3)` → `"card"/"minimal"/"striped"`

### `SURFACE_DARK_BY_DENSITY`
Replaces the old `SURFACE_BG_SETS` 4-variant array. Now maps `layout_density` → which block types get dark backgrounds:
- `tight` — fewer dark surfaces (instructor_insight, industry_tabs, prediction, applied_case, interactive_vis, quiz, video_snippet)
- `balanced` — type_cards gets dark too
- `spacious` — type_cards AND prediction get dark

This is defined at **module scope** in `block-renderer.tsx` (not inside the component).

### `defaultRender`
The fallback when `course_dna` is empty `{}` or fails Zod validation. Pulse teal palette, dark_mesh background, balanced density. Lives in `lib/ai/generate-course-dna.ts` and is imported by `course-dna-provider.tsx` as the context default value.

### Next.js 16 `params`
In Server Components, `params` is `Promise<{...}>` and must be awaited. `app/courses/[courseId]/layout.tsx` does this correctly: `const { courseId } = await params`.

### `createClient()` from `lib/supabase/server`
Also async in this project — must be `await createClient()`. This is done correctly in the layout.

---

## Commit History (This Session)

```
b82b348 fix: move RECAP_STYLES to module scope to avoid per-render allocation
ac0bbff feat: migrate block components to CourseDNA context
82450a7 fix: move SURFACE_DARK_BY_DENSITY to module scope to avoid per-render allocation
77a2d3f feat: migrate block-renderer to CourseDNA context, remove LessonVariantContext
e0a9e81 feat: add SectionDivider component driven by CourseDNA context
0a58764 feat: extract background treatment into CourseBackground component
004cddd feat: add per-course Server Component layout with CourseDNAProvider
e5e5abf feat: add CourseDNAProvider context and useCourseDNA hook
f8f1cce fix: add error handling to CourseDNA persist in generate route
2078b69 feat: wire CourseDNA into generation pipeline (render immediate, content pending v2 migration)
4280705 feat: add course_dna and dna_fingerprint columns to courses table
36f9ee7 fix: add validation warning in getCourseDNARender, document fingerprint note
1a76526 feat: add generateCourseDNA() and supporting utilities
c6ef66a feat: add CourseDNA catalogue (archetypes + palettes)
6e88ba0 fix: move imports to top of course-upgrade.ts
66c280c feat: add CourseDNA interface, RawCourseDNA, and Zod schema
965e822 Add Course Variation System implementation plan
5574bae Fix spec review issues in course variation design doc
ab571ac Add Course Variation System design spec
```

---

## Suggested Next Steps

### High Priority

1. **Apply the DB migration** (Supabase Studio, SQL above) — blocks all visual variation from activating
2. **Live test two courses** — open two course lesson pages, confirm they have different accent colours, backgrounds, and layout density
3. **Migrate generation route to v2 orchestrator** — activates content personality injection; there is already a TODO comment in `app/api/course/generate/route.ts`

### Medium Priority

4. **Test `getCourseDNARender` fallback** — temporarily corrupt a `course_dna` value in the DB and confirm the page loads with the default pulse_teal palette (no crash)
5. **Add `SectionDivider` to the block renderer** — `SectionDivider.tsx` was built but is not yet inserted between blocks in `block-renderer.tsx`. It needs to be rendered between certain block type transitions (e.g., after `text_section` before `type_cards`)
6. **Typography personality** — `typography` field is stored in DNA but currently unused by the frontend. Would wire into font-weight or letter-spacing overrides per course

### Low Priority

7. **Backfill existing courses** — courses generated before this session have `course_dna = {}` and get `defaultRender`. A one-off backfill script could regenerate DNA for all existing courses using their stored `id`, `title`, `difficulty_level`

---

## Project State

Branch: `main`
No uncommitted changes.
Pre-existing TypeScript errors in unrelated files (admin pages, diagnostics route, old scratch scripts) — none introduced by this session.
