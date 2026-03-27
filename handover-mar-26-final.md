# Handover — 26 March 2026 (Final)

## Session Summary

This session continued directly from the previous session (handover-mar-26.md) which completed the CourseDNA system. Today's work activated the remaining wired-but-not-connected pieces, then diagnosed a video missing issue via a test course generation.

---

## What Was Done

### 1. DB Migration — Applied ✅

The `supabase/migrations/20260326_course_dna.sql` migration was applied manually via Supabase Studio SQL Editor:

```sql
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS course_dna       JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS dna_fingerprint  TEXT;
```

Result: "Success. No rows returned." All courses now have the `course_dna` column (defaulting to `{}`). Existing courses without DNA fall back to `defaultRender` (pulse_teal palette, dark_mesh background) with no errors.

---

### 2. SectionDivider Wired Into Block Renderer ✅

**File:** `components/course/block-renderer.tsx`

SectionDivider was built last session but not connected. Today it was inserted between major content blocks.

**What was added:**

```ts
// Module-scope constant (above component):
const SKIP_DIVIDER_TYPES = new Set([
    'objective', 'punch_quote', 'callout',
    'recap', 'quiz', 'key_terms', 'completion', 'audio_recap_prominent',
]);
```

Inside the component body, before the `.map()`:
```ts
let sectionDividerCounter = 0;
```

Inside `.map()`, before each `<section>`:
```tsx
const prevBlock = idx > 0 ? bodyBlocks[idx - 1] : null;
const showDivider =
    idx > 0 &&
    !SKIP_DIVIDER_TYPES.has(block.type) &&
    prevBlock != null &&
    !SKIP_DIVIDER_TYPES.has(prevBlock.type);
const dividerNumber = showDivider ? ++sectionDividerCounter : undefined;

// Inside React.Fragment:
{showDivider && <SectionDivider sectionNumber={dividerNumber} />}
```

**Logic:** Dividers appear between "content" blocks (text, image_text_row, type_cards, applied_case, instructor_insight, etc.) but never directly adjacent to structural openers (objective, punch_quote) or the end sequence (recap, quiz, key_terms, completion). The `bold_number` style shows an incrementing ghost section number.

---

### 3. CourseDNA Injected Into V2 Generation Route ✅

**File:** `app/api/course/generate-v2/route.ts`

Two changes:

**A) DNA generation + DB persist** (after course shell creation):
```ts
import { generateCourseDNA, deriveDNAFingerprint } from "@/lib/ai/generate-course-dna";

const courseDNA = generateCourseDNA(course.id, courseName, difficultyLevel);
const dnaFingerprint = deriveDNAFingerprint(course.id, courseName, difficultyLevel);
if (!DRY_RUN) {
    const { error: dnaError } = await supabase
        .from("courses")
        .update({ course_dna: courseDNA, dna_fingerprint: dnaFingerprint })
        .eq("id", course.id);
    if (dnaError) {
        console.warn("[API-V2] CourseDNA persist failed (non-blocking):", dnaError.message);
    }
}
```

**B) Content personality injected into LessonExpanderAgent**:
```ts
// Before:
let compiledLesson = await orchestrator.processLesson(lessonPlan, topic, manifest, globalLessonIndex, courseState);
// After:
let compiledLesson = await orchestrator.processLesson(lessonPlan, topic, manifest, globalLessonIndex, courseState, courseDNA.content);
```

`courseDNA.content` carries `writing_style`, `example_bias`, and `question_tone` — injected into the LessonExpanderAgent prompt so each course has a distinct content personality.

---

### 4. Video Investigation — Root Cause Identified ⚠️

#### How It Was Triggered

After the DB migration was applied, the user reported "videos are missing." A diagnostic test course was generated: **"AI Back Propagation"** → became **Course 823** "Demystifying Backpropagation: The Engine of Deep Learning."

#### What Was Found

**Course 823 / Lesson 3569 "The Forward and Backward Pass":**
- 18 blocks generated including **2 video_snippet blocks**
- Both video_snippet blocks have **valid Veo-generated URLs** (Supabase Storage, HTTP 200, ~3MB MP4 each)
- CourseDNA fingerprint present ✅
- `lesson.video_url` = **NULL** (v2 route never sets this column)

**Pre-existing Lesson 3473 "What is a Neural Network?":**
- 1 video_snippet block
- `videoUrl`: **MISSING** — has `videoPrompt` but no URL
- `lesson.video_url` = **NULL**

#### Root Cause — Two Distinct Issues

**Issue 1: OLD lessons** (pre-existing, e.g. lesson 3473)
- video_snippet blocks have a `videoPrompt` in `content_blocks` but `videoUrl` was never populated
- The async video background task either wasn't implemented when these were generated, or it failed silently
- These lessons render the "Visual Signal Lost" placeholder in video_snippet blocks

**Issue 2: `lesson.video_url` always NULL for v2 lessons**
- The v2 generation route never writes to `course_lessons.video_url`
- The lesson header "Watch Overview" button only renders when `videoUrl || videoOverviewUrl` is truthy
- All v2 lessons: no header overview video button appears, ever

#### What Is NOT Broken

New v2 lessons (course 823 onwards) work correctly — the async video background task fires after lesson save, fetches/generates videos, and patches `content_blocks.videoUrl` for each video_snippet block. These display correctly in the UI.

---

## Current State

| Item | Status |
|------|--------|
| DB migration applied | ✅ Done |
| SectionDivider wired | ✅ Done |
| CourseDNA in v2 route | ✅ Done — persist + content personality injection |
| Visual variation (palettes, backgrounds) | ✅ Active for all courses |
| Content personality (writing_style etc.) | ✅ Active for new v2 courses |
| New v2 video_snippet blocks | ✅ Working |
| Old lesson video_snippet blocks | ❌ Missing videoUrl — needs backfill |
| lesson.video_url for v2 lessons | ❌ Always NULL — header overview button never appears |

---

## Fixes Needed (Prioritised)

### Fix A — Backfill Video URLs for Old Lessons (High Priority)

**Problem:** Lessons generated before the async video task was fully wired have `videoPrompt` in their video_snippet blocks but no `videoUrl`. They render as "Visual Signal Lost."

**Approach:** The admin re-trigger endpoint already exists at `app/api/admin/lessons/regenerate/route.ts`. It already handles video regeneration. A bulk backfill script should:

1. Query all lessons where `content_blocks` contains at least one video_snippet block where `videoUrl` is null/empty but `videoPrompt` is non-empty
2. For each such lesson, call the existing regenerate endpoint (or call the Pexels video service directly)
3. Update `content_blocks` with the returned URL

SQL to identify affected lessons:
```sql
SELECT id, topic_id, title
FROM course_lessons
WHERE content_blocks IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(content_blocks) AS block
    WHERE block->>'type' = 'video_snippet'
      AND (block->>'videoUrl' IS NULL OR block->>'videoUrl' = '')
      AND (block->>'videoPrompt' IS NOT NULL AND block->>'videoPrompt' != '')
  );
```

**Implementation location:** New script at `scripts/backfill-video-urls.ts` OR trigger via admin UI.

---

### Fix B — Populate lesson.video_url for V2 Lessons (Medium Priority)

**Problem:** The v2 route generates Veo videos for video_snippet blocks but never writes to `course_lessons.video_url`. The lesson header "Watch Overview" CTA never shows.

**Approach:** In `app/api/course/generate-v2/route.ts`, inside the async `videoTask()` function (after video_snippet blocks are updated), also set `lesson.video_url` to the first successfully-generated video URL:

```ts
// After patching content_blocks:
const firstVideoUrl = updatedBlocks.find(b => b.type === 'video_snippet' && b.videoUrl)?.videoUrl;
if (firstVideoUrl) {
    await supabase
        .from('course_lessons')
        .update({ video_url: firstVideoUrl })
        .eq('id', lesson.id);
}
```

Alternatively, if header overview videos should be distinct from inline concept videos, leave this as-is and accept that v2 lessons don't have header videos.

---

### Fix C — Generation Timeout (Low Priority)

During the diagnostic test, the curl request timed out at 300 seconds. Only 1 of 2 requested lessons was saved (lesson 3569). The second lesson "Calculating Gradients with the Chain Rule" was not generated.

This is a known limitation — `maxDuration = 300` in the route. For multi-lesson courses, this can be hit. The route already streams progress events. Options:
- Break generation into per-lesson requests from the client (retry if timed out)
- Increase `maxDuration` (Vercel Pro supports up to 800s)
- Move to a background job / queue architecture

---

## Architecture Reminder

```
generateCourseDNA(id, title, difficulty)
  → SHA-256 → 7 seeds → picks archetype + palette + 5 render dims
  → persisted: courses.course_dna (JSONB) + courses.dna_fingerprint (TEXT)
  → courseDNA.content → passed to OrchestratorV2.processLesson() → LessonExpanderAgent prompt

Page load:
  app/courses/[courseId]/layout.tsx (Server Component)
    → fetches course_dna from DB
    → getCourseDNARender(raw) — Zod parse, fallback to defaultRender
    → <CourseDNAProvider render={render}>
    → useCourseDNA() consumed in: block-renderer, SectionDivider, CourseBackground,
      objective-card, text-section, type-cards, recap-slide, lesson-progress-rail
```

---

## Key Files Modified This Session

| File | Change |
|------|--------|
| `components/course/block-renderer.tsx` | Wired SectionDivider — added SKIP_DIVIDER_TYPES, counter, showDivider logic |
| `app/api/course/generate-v2/route.ts` | Added CourseDNA generation, DB persist, and dnaContent param to processLesson |

---

## Remaining CourseDNA Work (From Original Handover)

| Item | Status |
|------|--------|
| Typography personality field (`typography` in DNA) | Unused — stored in DB but no frontend binding |
| Backfill existing courses with DNA | Untouched — existing courses get defaultRender |
| Test `getCourseDNARender` fallback with corrupted DNA | Untested |

---

## Test Reference

- **Dev server**: `npm run dev` (not auto-running)
- **New course**: Course 823 "Demystifying Backpropagation: The Engine of Deep Learning"
- **Test lesson (new, working videos)**: Lesson 3569 — `http://localhost:3000/courses/823/lessons/3569`
- **Test lesson (old, missing videos)**: Lesson 3473 — `http://localhost:3000/courses/772/lessons/3473`
- **V2 flag**: `NEXT_PUBLIC_USE_V2_GENERATOR=true`

---

## Branch / Commits

Branch: `main`

Commits this session:
```
(SectionDivider wire-up commit)
(CourseDNA v2 route injection commit)
```

No uncommitted changes at end of session.

---

## Suggested Starting Point for Next Session

1. **Implement Fix A** — backfill video URLs for old lessons. Start by running the SQL query above to count affected lessons, then write `scripts/backfill-video-urls.ts` to patch them via the Pexels video service.
2. **Decide on Fix B** — whether lesson header "Watch Overview" should auto-populate from video_snippet blocks for v2 lessons.
3. **Typography personality** — bind `typography` from CourseDNA to CSS custom properties (font-weight, letter-spacing) in CourseBackground or a new `CourseTypography` component.
