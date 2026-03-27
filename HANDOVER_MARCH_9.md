# Handover — 9 March 2026

## Session Overview

Session continued from the March 8 handover. The primary goals were:
1. Validate lesson block rendering via Playwright ✅
2. Fix AI cliché words in all generation output ✅
3. Improve generation quality prompts ✅
4. Fix thumbnail text overflow ✅
5. Fix dashboard SSR auth redirect ✅

---

## Environment State

| Item | Status |
|------|--------|
| Dev server | Running on port 3000 (start with `npm run dev`) |
| Course 753 | Complete — "Prompt Engineering Demystified: A Beginner's Guide", 2 lessons × 22–25 blocks each |
| ElevenLabs quota | ~20 credits remaining — resets **14 March 2026** |
| Middleware | **NOW ACTIVE** — `middleware.ts` created from `proxy.ts` |
| Content sanitizer | Active — applied to all generated blocks before DB save |
| Thumbnail text | Fixed — adaptive font sizing (84/66/52px) |

---

## What Was Done This Session

### 1. Content Quality — AI Cliché Word Removal ✅

**New file**: `lib/ai/content-sanitizer.ts`
- `sanitizeText()`: Replaces 40+ banned phrases (demystify, leverage, deep dive, etc.) with plain English
- `sanitizeBlocks()`: Recursively sanitises all string fields in generated content blocks
- `BANNED_WORDS_INSTRUCTION`: Embeds into generation prompts

**Updated prompts**:
- `lib/ai/agent-system-v2.ts` (LessonExpanderAgent) — full banned words section added
- `lib/ai/prompts/enhanced-planning-prompt.ts` — anti-AI phrase list expanded

**Applied in route**:
- `app/api/course/generate-v2/route.ts` — `sanitizeBlocks()` runs on all blocks before DB insert

---

### 2. Thumbnail Text Overflow Fix ✅

**File**: `lib/ai/image-service.ts` — `generateCourseThumbnailWithTitle()`

Adaptive font sizing based on title length:
- `totalChars > 55 || longestWord > 15` → 52px
- `totalChars > 38 || longestWord > 12` → 66px
- Default → 84px
- Fallback reduction if > 4 lines: `Math.max(38, fontSize * 0.8)`

`charWidth = fontSize * 0.58` — used to calculate `maxCharsPerLine = floor(usableWidth / charWidth)`

**File**: `components/courses/course-card.tsx`
- Added `line-clamp-2` to the title overlay
- Adaptive Tailwind font size: `text-sm` (>40 chars), `text-base` (>25), `text-lg` (default)

---

### 3. Veo Fire-and-Forget Fix ✅

**File**: `app/api/course/generate-v2/route.ts`

Moved Veo video generation from blocking `await` inside the lesson loop to a non-blocking `Promise.all(...).then(async () => supabase.update(...))` after the lesson DB insert. This prevents the 10+ minute generation timeout.

Also removed the broken Gemini TTS block (`gemini-2.5-flash-preview-tts`) which was crashing with `candidates[0].content = undefined`.

---

### 4. `esc()` Null-Safe Fix ✅

**File**: `lib/utils/lesson-renderer-v2.ts` line 41–42

Changed `s.replace(...)` to `(s || '').replace(...)` to prevent crash when a block field is undefined.

---

### 5. Dashboard SSR Auth Redirect Fix ✅

**Root cause**: No active middleware was protecting `/dashboard`. The `proxy.ts` file (at the project root) contained the correct middleware logic but was not named `middleware.ts`, so Next.js was not running it.

**Fix 1 — Activated middleware**: Created `middleware.ts` at project root (same content as `proxy.ts`).
- Protects `/dashboard`, `/my-courses`, `/my-learning`, `/account`
- Redirects unauthenticated users to `/auth/signin?redirect=<original-path>`
- Uses Supabase SSR cookie-based auth (`createServerClient`)

**Fix 2 — Signin page redirect support**: Updated `app/auth/signin/page.tsx`
- Now reads `?redirect=` query param via `useSearchParams()`
- After successful login, sends user to the original destination (not always `/dashboard`)

**Fix 3 — Playwright auth uses cookies**: Updated `scripts/playwright-validate.mjs`
- Now injects session as a proper cookie via `context.addCookies()` in addition to localStorage
- Cookie name: `sb-${projectRef}-auth-token` on `localhost`
- Middleware reads cookies (SSR), not localStorage — this was the source of the Playwright redirect failure

---

## Lesson Block Rendering (Confirmed Working) ✅

Course 753 generates 22–25 blocks per lesson including:
- `learning_objective`, `lesson_meta_header`
- `section_heading`, `body_text` (2–3 sentence paragraphs)
- `image_block` (up to 4 per lesson — capped to avoid timeout)
- `callout_tip`, `callout_warning`
- `comparison_card`, `key_terms`
- `inline_quiz` (4 options, correct_index, explanation)
- `completion_card`

Progressive disclosure is **working correctly** — only the first 2 sections are shown on load, rest revealed as user progresses.

---

## Audio Generation (ElevenLabs) ⏳

**Status**: Quota exhausted (~20 credits remaining)
**Voice**: Sterling's voice (`dcf6B8jyMjZTlgLMxo1h`), `eleven_multilingual_v2`
**Script generation**: Gemini Flash → SSML pause markers → ElevenLabs TTS
**Storage**: `course-assets` Supabase bucket → `topics/{courseId}/{topicId}/overview.mp3`
**Trigger**: Admin → Courses → three-dot menu → "Generate Audio"
**Quota resets**: **14 March 2026**

---

## Known Issues / Next Steps

| Issue | Status | Notes |
|-------|--------|-------|
| ElevenLabs quota | ⏳ Waiting | Resets 14 March |
| Veo video blocks | ⚠️ Async only | Videos fire-and-forget; may not be in DB immediately |
| V1 agent prompts | Pending | `lib/ai/agent-system.ts` and `lib/ai/groq.ts` not yet updated with banned words |
| Dashboard validation | Pending | Re-run Playwright after middleware + cookie fix to confirm ✅ |
| Image 4-cap | Active | Capped at 4 images/lesson for speed; can increase once generation is stable |

---

## Key Files

| File | What Changed |
|------|-------------|
| `middleware.ts` | **NEW** — route protection for dashboard, my-courses, etc. |
| `app/auth/signin/page.tsx` | Reads `?redirect=` param, sends user to original destination post-login |
| `scripts/playwright-validate.mjs` | Cookie injection for SSR auth in tests |
| `lib/ai/content-sanitizer.ts` | **NEW** — AI cliché word replacement utility |
| `lib/ai/agent-system-v2.ts` | Banned words section in LessonExpanderAgent prompt |
| `lib/ai/prompts/enhanced-planning-prompt.ts` | Expanded anti-AI phrase ban |
| `app/api/course/generate-v2/route.ts` | sanitizeBlocks, Veo async, image 4-cap |
| `lib/utils/lesson-renderer-v2.ts` | Null-safe `esc()` function |
| `lib/ai/image-service.ts` | Adaptive thumbnail font sizing |
| `components/courses/course-card.tsx` | line-clamp-2 + adaptive font size for title |

---

## How to Resume

```bash
cd "d:\ai-bytes-leaning-22nd-feb-2026 Backup"
npm run dev
```

Test a full generation:
```bash
node scripts/playwright-validate.mjs
```

After 14 March (quota reset), test audio:
- Go to `/admin/courses`
- Find a course → three-dot menu → "Generate Audio"
- Check `course_topics.audio_url` in Supabase

Check lesson rendering for course 753:
- http://localhost:3000/courses/753/lessons/3428
