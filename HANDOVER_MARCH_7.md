# Handover — 7 March 2026

## Session Summary

This session continued work on the AI Bytes Learning platform, focused on the **admin audio generation feature** for courses.

---

## What Was Built / Changed This Session

### 1. SSE Progress for Audio Generation
`app/admin/courses/page.tsx` — Changed from a simple boolean `generatingAudio: Set<string>` to a `Map<string, { done: number; total: number }>` that tracks real-time progress per course. Badge now shows **"X / Y modules"** live as generation proceeds.

### 2. Module Count Selector in Course Creation
`app/admin/courses/new/page.tsx` — Replaced a hidden test-mode slider with a visible **4-card module selector** (1–4 modules, each fixed at 2 lessons). Footer shows live cost estimate.

### 3. Per-Module Audio (not per-lesson)
`app/api/admin/courses/generate-audio/route.ts` — Rewrote to generate **one audio overview per topic (module)**, not per lesson. Prompt is a 90-second "trailer" style preview. Audio stored at `topics/{courseId}/{topicId}/overview.wav` in the `course-assets` bucket.

### 4. Fixed React Hooks Violation
`components/course/blocks/lesson-header.tsx` — `useTransform` was called conditionally inside JSX. Hoisted both calls to top level as `floatingBtnOpacity` and `floatingBtnDisplay`.

### 5. Fixed Audio Player Crash
`components/course/blocks/lesson-audio-player.tsx` — Added `loadError` state, async `togglePlay` with try/catch, `onError` on `<audio>` element, and error UI state.

### 6. Fixed SSE Error Swallowing Bug
`app/admin/courses/page.tsx` — Error events from SSE were being thrown inside a `try/catch` meant to skip malformed JSON lines, so they were silently swallowed. Fixed by capturing to `serverError` variable and breaking the read loop.

### 7. Lesson Page Uses Topic Audio
`app/courses/[courseId]/lessons/[lessonId]/page.tsx` — Updated to read `audio_url` from `course_topics` (via join) and pass it as `audioUrl` prop.

---

## Current Blocker: Gemini TTS Returning No Candidates

### Error
```
Quantum Mechanics Fundamentals: Cannot read properties of undefined (reading 'parts')
Quantum Algorithms and Applications: Cannot read properties of undefined (reading 'parts')
```

### Location
`app/api/admin/courses/generate-audio/route.ts`, line 102:
```typescript
const audioPart = audioResult.response.candidates[0].content.parts
    .find((p: any) => p.inlineData?.mimeType?.startsWith("audio/"));
```

`candidates[0]` exists but `.content` is `undefined` — Gemini returned a candidate with no content body.

### Likely Causes (in order of probability)

1. **The model name is wrong or the feature is in preview.** `gemini-2.5-flash-preview-tts` may have been renamed or may not be available yet on the free/standard API tier. Try `gemini-2.0-flash-exp` with audio modality.

2. **Safety filter blocked the content.** The response candidate exists but has `finishReason: "SAFETY"` or similar, so `.content` is null. Check `candidates[0].finishReason`.

3. **Multi-speaker TTS not available with the current API key.** The `multiSpeakerVoiceConfig` feature may require a specific API tier or the model doesn't support it. Try single-speaker first.

4. **`NEXT_PUBLIC_GEMINI_API_KEY` doesn't have TTS permissions.** This env var is the browser-exposed key — the server should ideally use `GEMINI_API_KEY` (without `NEXT_PUBLIC_`). Both may work but worth checking.

---

## Fix Needed (Next Session)

### Step 1 — Add null-safe access + diagnostic logging

In `app/api/admin/courses/generate-audio/route.ts`, replace lines 102–125 with:

```typescript
const candidate = audioResult.response?.candidates?.[0];
const finishReason = candidate?.finishReason;

// Log the full raw response for diagnosis
console.log("[BulkAudio] Raw response:", JSON.stringify({
    finishReason,
    hasContent: !!candidate?.content,
    partsCount: candidate?.content?.parts?.length,
    safetyRatings: candidate?.safetyRatings,
    promptFeedback: audioResult.response?.promptFeedback,
}, null, 2));

if (!candidate?.content?.parts) {
    throw new Error(`Gemini returned no audio content. Finish reason: ${finishReason || "no candidates"}`);
}

const audioPart = candidate.content.parts
    .find((p: any) => p.inlineData?.mimeType?.startsWith("audio/"));
```

### Step 2 — Try single-speaker first to isolate multi-speaker issue

Replace the `speechConfig` block with:
```typescript
speechConfig: {
    voiceConfig: {
        prebuiltVoiceConfig: { voiceName: "Sadaltager" }
    }
}
```
Remove `multiSpeakerVoiceConfig` entirely. If this works, multi-speaker can be added back.

### Step 3 — Run the SQL migration if not done yet

The `course_topics` table needs the `audio_url` column:
```sql
ALTER TABLE course_topics ADD COLUMN IF NOT EXISTS audio_url TEXT;
```
Run this in Supabase Dashboard → SQL Editor. Without this, the Supabase query itself fails silently.

### Step 4 — Check the model name

Current: `gemini-2.5-flash-preview-tts`

Check Google AI Studio / Gemini docs for the correct TTS model identifier. Alternatives to try:
- `gemini-2.0-flash-exp` (with audio responseModality)
- `gemini-2.5-flash-preview-tts` (may be correct — verify it's live)

---

## Files Modified This Session

| File | Change |
|------|--------|
| `app/admin/courses/new/page.tsx` | 4-card module selector (1–4 modules) |
| `app/admin/courses/page.tsx` | SSE progress map, "X / Y modules" badge, error capture fix |
| `app/api/admin/courses/generate-audio/route.ts` | SSE streaming, per-topic audio, error propagation |
| `app/admin/courses/edit/[id]/page.tsx` | Topic-level audio_url, removed per-lesson audio controls |
| `app/courses/[courseId]/lessons/[lessonId]/page.tsx` | Read audio_url from topic join |
| `components/course/blocks/lesson-header.tsx` | Hoisted useTransform hooks |
| `components/course/blocks/lesson-audio-player.tsx` | Error state, async togglePlay |

---

## How to Test Once Fixed

1. Go to `/admin/courses`
2. Find a course with modules (topics) — e.g. "Quantum Mechanics"
3. Click "Generate Audio" (or "Re-gen Audio" to force)
4. Badge should show "1 / 2 modules", "2 / 2 modules" as it progresses
5. Alert should say "Audio complete — 2 / 2 modules generated"
6. Open a lesson from that course → "Listen to AI Guide" button should appear in the header
7. Click it → audio player slides down and plays the module overview

---

## Env Vars to Check

- `NEXT_PUBLIC_GEMINI_API_KEY` — used for TTS (and everything else). Check it has TTS model access.
- Ideally add `GEMINI_API_KEY` (server-only, no NEXT_PUBLIC_ prefix) for server-side API calls.

---

## DB Column Status

- `course_topics.audio_url` — **needs migration** (may or may not exist — run `ALTER TABLE` above to be safe)
- `course_lessons.audio_url` — **no longer used** (removed from UI/queries this session)
