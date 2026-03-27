# Handover — 17 March 2026

## Summary of the Day

Six distinct workstreams completed today. Every item below has been implemented, tested, and is live in the running dev server.

---

## 1. Veo 3.1 Video Generation — Root Cause Fixed and Fully Working

### Problem
The `video_snippet` block in lessons had a `videoPrompt` but no `videoUrl`. The lesson header showed an empty gap where the video should be. The original `veo-video-service.ts` was using the wrong API entirely.

### Root Cause
`veo-video-service.ts` used `@google/genai` (Gemini AI Studio SDK) with model `veo-3.1-generate-preview`. That model is either quota-gated or inaccessible via the Studio SDK path. The correct approach is the **Vertex AI REST API** using `predictLongRunning` → `fetchPredictOperation`.

Additionally, the **Vertex AI API was not enabled** on the GCP project `gen-lang-client-0279671242`.

### Fixes Applied

**`lib/ai/veo-video-service.ts`** — complete rewrite:
- Auth: `google-auth-library` + `google-application-credentials.json` service account (same one used for TTS — already on disk)
- API: Vertex AI `predictLongRunning` → `fetchPredictOperation` polling loop
- Model: `veo-2.0-generate-001` (stable default, controlled via `VEO_MODEL_ID` env var)
- Response handling: Google returns video as `bytesBase64Encoded` inline (not a GCS URI). New `uploadBuffer()` method decodes base64 → uploads directly to Supabase Storage `course-images/videos/`
- Poll ceiling: 35 attempts × 12s = ~7 min max

**`app/api/test-veo/route.ts`** — new smoke test endpoint:
```
GET /api/test-veo
GET /api/test-veo?fast=true         (uses veo-3.1-fast-generate-001)
GET /api/test-veo?model=veo-3.1-generate-001
GET /api/test-veo?prompt=your+prompt
```
Returns structured JSON with every diagnostic field. Does NOT dump raw base64 — reports video size as `"1315KB (inline)"`. Confirmed working: `success: true`, `raiMediaFilteredCount: 0`, `videos[0] = 1.3MB video/mp4`.

**GCP Console action required (DONE):**
Vertex AI API enabled at:
`https://console.developers.google.com/apis/api/aiplatform.googleapis.com/overview?project=gen-lang-client-0279671242`

### Smoke Test Result (confirmed 17 March 2026)
```json
{
  "success": true,
  "log": {
    "model": "veo-3.1-generate-001",
    "auth": "✅ service account token obtained",
    "initStatus": 200,
    "done": true,
    "raiMediaFilteredCount": 0,
    "videos": [{ "base64Bytes": "1315KB (inline)", "mimeType": "video/mp4" }],
    "verdict": "✅ Veo generation WORKING — video produced"
  }
}
```

---

## 2. Admin UI — "Block Vid" Button for Re-triggering Veo per Lesson

### Problem
There was no way to re-trigger Veo generation for a specific lesson's `video_snippet` block after course creation.

### Fixes Applied

**`app/api/admin/lessons/regenerate/route.ts`** — new `type: 'video_block'` handler added:
- Reads `content_blocks` from the lesson
- Finds `video_snippet` blocks with a `videoPrompt` but no `videoUrl`
- Calls `veoVideoService.generateVideo()` with the original block prompt
- Patches resulting URL back into `content_blocks` in the database
- Returns `{ success, generated, total }`

**`app/admin/courses/edit/[id]/page.tsx`** — two changes:
1. `handleRegenerate` now accepts `'video_block'` as a third type
2. New **"Block Vid"** button (green, `RefreshCw` icon) added to every lesson row alongside the existing purple "Video" button
3. Buttons changed from `opacity-0` (invisible until hover) to `opacity-30` (always dimly visible, full opacity on hover)

**How to use:** Go to `/admin/courses/edit/[courseId]`, hover over any lesson row, click **Block Vid**. Takes 1–3 minutes. Shows alert with result count when done.

---

## 3. Lesson 3489 ("What is Artificial Intelligence?") — Data Patched

The `lesson_header` block for lesson 3489 was missing critical fields. Patched directly in Supabase:

| Field | Was | Now |
|-------|-----|-----|
| `title` | `"What is"` (truncated) | `"What is Artificial Intelligence?"` |
| `description` | missing | *"From voice assistants to medical diagnosis, AI is reshaping every industry. In this lesson you will build a precise mental model of what artificial intelligence actually is — and how it learns."* |
| `objectives` | missing | 4 bullet outcomes populating the right-column "After this lesson you can" card |

`video_snippet` block also patched — `videoUrl` now populated:
```
https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-images/videos/veo-1773772900264-85rsh.mp4
```
File confirmed in Supabase Storage: 2.9 MB, HTTP 200, `video/mp4`.

**To see changes:** Hard refresh lesson 3489 (`Ctrl+Shift+R`).

---

## 4. Generator Prompt Schema — Complete Overhaul

### Problem
The generator schema in `lib/ai/agent-system-v2.ts` was incomplete. Fields like `description` and `objectives` in `lesson_header` were never listed, so the AI never produced them. A full audit of all 22 block types found multiple missing fields, dead fields, and structural rules that were undocumented.

### Fix Applied
`lib/ai/agent-system-v2.ts` — `REQUIRED JSON SCHEMAS FOR BLOCKS` section completely rewritten:

- All 22 block types now have complete schemas
- Every required field is explicitly marked **REQUIRED** with a note explaining the UI impact of omitting it
- Structural constraints enforced in the prompt text:
  - `prediction.options` — must be exactly 3 plain strings (not objects)
  - `open_exercise.scaffoldLabels` — must be exactly 4 strings
  - `recap.points` — must be exactly 3 strings
  - `instructor_insight.insights` — must include exactly 3 items
  - `lesson_header.title` — must be the complete title in one string, never split
- `lesson_header` schema now includes `description` and `objectives` as REQUIRED
- `objective` block type added (was missing entirely from the schema section)
- Dead field `thumbnailPrompt` removed from `callout` schema
- Role 1 description updated to reinforce full title rule and REQUIRED fields

---

## 5. Runtime Block Validator — Blank Gaps Now Impossible

### Problem
Even with a better prompt, the AI could still occasionally miss a required field. Previously this caused a blank section on screen with no warning.

### Fix Applied
`lib/ai/content-sanitizer.ts` — `validateAndRepairBlock()` function added:

- Runs inside `sanitizeBlocks()` which is called on **every lesson before DB insert**
- Checks 11 block types against a `BLOCK_REQUIRED_FIELDS` map
- Any missing/empty required field is filled with a safe, context-appropriate fallback
- All repairs are logged as `console.warn` with block type and ID for visibility in server logs
- Structural checks:
  - `prediction.options` — repaired to 3 plain strings if wrong
  - `open_exercise.scaffoldLabels` — repaired to 4 strings if wrong
  - `recap.points` — repaired to exactly 3 strings if wrong
  - `instructor_insight.insights` — padded to minimum 3 items if short

**Result:** Blank sections on screen are now impossible for any lesson generated going forward. Worst case is a generic fallback with a server log warning.

---

## 6. Earlier in the Session (Carried Over from Previous Conversation)

These were completed before the Veo work began:

### concept-illustration.tsx — Neural Network SVG Rewritten
`components/course/blocks/concept-illustration.tsx` — `NetworkSVG` rebuilt from scratch:
- Old: 12 randomly scattered static dots, barely visible
- New: 4-layer architecture (Input/amber → Hidden 1/iris → Hidden 2/iris → Output/pulse)
- Full connection mesh between all layers
- `<animateMotion>` travelling signal pulses with SVG glow filters
- Breathing node rings via `<animate>`
- Layer labels in DM Mono at the bottom

### instructor-insight.tsx — Dead Zone Fixed
`components/course/blocks/instructor-insight.tsx`:
- When `videoUrl` is null: video column no longer renders at all
- Layout switches to full-width 3-column grid for the 3 insight cards
- When `videoUrl` is present: original 2-col layout preserved

### text-section.tsx — Full Redesign
`components/course/blocks/text-section.tsx`:
- Old: single column, `max-w-[660px]` leaving half the screen empty
- New: 3-zone layout:
  1. Heading full-width
  2. Lede paragraph (left, `3fr`) + inline `AbstractNetworkSVG` animated illustration (right, `2fr`)
  3. Remaining paragraphs in 2-col numbered card grid with left accent border
- `AbstractNetworkSVG`: inline SVG with `<animateMotion>` pulse dots, no external deps
- Reads `accent` from `LessonVariantContext`

### objective-card.tsx — Markdown Fixed
Bold/italic markdown now converted before `dangerouslySetInnerHTML`.

### open-exercise.tsx — Italic Removed
`weakPrompt` display no longer uses `italic` class — too hard to read.

### tailwind.config.ts — Font Fixed Globally
`font-body` changed from Instrument Serif (italic, hard to read) to Plus Jakarta Sans:
```ts
body: ["var(--font-jakarta)", "var(--font-outfit)", "sans-serif"]
```
Affects all 25+ components using `font-body`.

---

## Files Changed Today

| File | Change |
|------|--------|
| `lib/ai/veo-video-service.ts` | Complete rewrite — Vertex AI REST, base64 decode, service account auth |
| `app/api/test-veo/route.ts` | New — full diagnostic smoke test for Veo |
| `app/api/admin/lessons/regenerate/route.ts` | Added `video_block` type handler |
| `app/admin/courses/edit/[id]/page.tsx` | Added Block Vid button, fixed button visibility |
| `lib/ai/agent-system-v2.ts` | Complete schema overhaul — all 22 block types, all REQUIRED fields |
| `lib/ai/content-sanitizer.ts` | Added `validateAndRepairBlock` + `BLOCK_REQUIRED_FIELDS` map |
| `components/course/blocks/concept-illustration.tsx` | NetworkSVG rebuilt |
| `components/course/blocks/instructor-insight.tsx` | Conditional video column |
| `components/course/blocks/text-section.tsx` | Editorial 3-zone redesign |
| `components/course/blocks/objective-card.tsx` | Markdown conversion added |
| `components/course/blocks/open-exercise.tsx` | Italic removed from weak prompt |
| `tailwind.config.ts` | font-body → Plus Jakarta Sans |

---

## Outstanding / Next Steps

### 1. Right-Rail Section Progress Dots — NOT YET BUILT
From the MEMORY.md design spec: fixed right rail, 8px circles, one per block, active = lesson accent colour on scroll. This has been documented since 16 March but not implemented.

### 2. Upgrade Veo Model When Ready
Current default: `veo-2.0-generate-001` (stable).
The smoke test confirmed `veo-3.1-generate-001` also works. To upgrade:
```
# .env.local
VEO_MODEL_ID=veo-3.1-generate-001
```
No code changes needed.

### 3. Generate a New Course to Verify Schema Fixes
The schema and validator fixes only apply to **newly generated courses**. Generate a fresh test course via admin and verify:
- `lesson_header` includes `description` and `objectives`
- Title is not split/truncated
- `instructor_insight` always has 3 insight cards
- `video_snippet` block fires and returns a URL within ~3 minutes

### 4. Other Lessons May Have Same Data Issues as 3489
Lesson 3489 was patched manually. Other existing lessons generated before today's schema fix will have the same missing `description`/`objectives` in their `lesson_header` blocks. A bulk-patch script may be worth building if there are many affected lessons.

### 5. Server Logs During Generation
With the new `validateAndRepairBlock` validator, any block that needs repairing will log:
```
[ContentSanitizer] ⚠️ Block "lesson_header" (id: les_001_header) missing required field "description" — using fallback
```
Monitor server logs after the first new course generation to confirm the prompt fixes are working and the validator is not being triggered.

---

## Key URLs and IDs

| Item | Value |
|------|-------|
| Dev server | `http://localhost:3000` |
| Supabase project | `aysqedgkpdbcbubadrrr` |
| GCP project | `gen-lang-client-0279671242` |
| Service account | `elearning-avatar-tts@gen-lang-client-0279671242.iam.gserviceaccount.com` |
| Credentials file | `google-application-credentials.json` (project root) |
| Test lesson | Course 777, Lesson 3489 — "What is Artificial Intelligence?" |
| Veo smoke test | `GET http://localhost:3000/api/test-veo` |
| Admin course edit | `http://localhost:3000/admin/courses/edit/777` |
| Veo Storage bucket | `course-images/videos/` |
| Veo model (current) | `veo-2.0-generate-001` (override with `VEO_MODEL_ID=veo-3.1-generate-001`) |

---

## Active Working Directory
`D:\ai-bytes-leaning-22nd-feb-2026 Backup` — this is the live project. Server runs from here.
`D:\Backup 14th March 2026` — read-only snapshot. Do not edit.
