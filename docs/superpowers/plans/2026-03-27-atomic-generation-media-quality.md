# Atomic Generation + Media Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make course generation atomic — any image or video API failure causes the entire course to be rolled back and deleted, with a clear typed error surfaced to the client; simultaneously improve video prompt quality so Veo-generated clips are content-specific.

**Architecture:** A new `MediaGenerationError` class carries structured failure metadata. `GeminiImageService` and `VeoVideoService` return typed results instead of `null`. Video generation moves from a fire-and-forget background task to a synchronous step inside the lesson loop, before the DB save. The outer `catch` in the route deletes the course (DB cascade + Supabase Storage cleanup) and streams the structured error to the client. Video prompts are restructured from a 1000-word image-style mandate to a strict 5-sentence motion-arc formula in `agent-system-v2.ts`.

**Tech Stack:** Next.js 15 API route (Node.js runtime), Supabase Storage REST API, Vertex AI Veo, Gemini Image API, TypeScript strict mode.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/ai/media-errors.ts` | **CREATE** | `MediaGenerationError` class, `ImageGenerationResult`, `VideoGenerationResult` types, `normaliseProviderError()` |
| `lib/ai/gemini-image-service.ts` | **MODIFY** | `generateImage()` returns `ImageGenerationResult` instead of `GeminiImage \| null` |
| `lib/ai/veo-video-service.ts` | **MODIFY** | `generateVideo()` returns `VideoGenerationResult` instead of `VeoVideo \| null` |
| `lib/ai/agent-system-v2.ts` | **MODIFY** | Split image/video prompt mandates; `VisualEnrichmentAgent.enrichBlock()` uses motion-arc structure for video; inject lesson title into all video prompts |
| `app/api/course/generate-v2/route.ts` | **MODIFY** | Sync video generation (before DB save), fail-fast image validation, budget guard, atomic rollback with storage cleanup, remove lesson-level swallow-and-continue |

---

## Task 1: Create `lib/ai/media-errors.ts`

**Files:**
- Create: `lib/ai/media-errors.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/ai/media-errors.ts

export type MediaApiSource =
    | 'gemini-image'
    | 'veo'
    | 'pexels'
    | 'supabase-storage';

export type MediaGenerationStage =
    | 'image_generation'
    | 'video_generation'
    | 'upload'
    | 'validation'
    | 'fallback';

export type MediaErrorCode =
    | 'quota_exceeded'
    | 'content_policy_violation'
    | 'auth_failed'
    | 'timeout'
    | 'empty_result'
    | 'upload_failed'
    | 'budget_exceeded';

export class MediaGenerationError extends Error {
    constructor(
        public readonly api: MediaApiSource,
        public readonly errorCode: MediaErrorCode,
        public readonly errorMessage: string,
        public readonly stage: MediaGenerationStage,
        public readonly retryable: boolean,
        public readonly lessonTitle: string,
        public readonly blockType?: string,
        public readonly slotLabel?: string,
    ) {
        super(
            `[${api}] ${errorCode} — ${errorMessage}` +
            ` (lesson: "${lessonTitle}"` +
            (blockType ? `, block: ${blockType}` : '') +
            (slotLabel ? `, slot: ${slotLabel}` : '') +
            ')'
        );
        this.name = 'MediaGenerationError';
    }
}

export interface ImageGenerationResult {
    url: string | null;
    alt: string | null;
    caption: string | null;
    errorCode: string | null;
    errorMessage: string | null;
}

export interface VideoGenerationResult {
    url: string | null;
    source: 'veo' | 'pexels' | null;
    errorCode: string | null;
    errorMessage: string | null;
}

const RETRYABLE_PATTERNS: Array<[RegExp, MediaErrorCode, string, boolean]> = [
    [/quota|rate.?limit|429/i,                        'quota_exceeded',           'API quota exceeded — retry after cooldown',                  true],
    [/content|policy|safety|blocked|rai/i,            'content_policy_violation', 'Content blocked by provider safety filter',                   false],
    [/auth|401|403|credential|token|permission/i,     'auth_failed',              'Authentication or authorisation failed',                      false],
    [/timeout|timed.?out|deadline/i,                  'timeout',                  'Provider request timed out',                                  true],
    [/empty|no image|no video|no candidates|0 result/i,'empty_result',            'Provider returned no usable result',                          true],
    [/upload|storage/i,                               'upload_failed',            'Failed to upload media to storage',                           true],
];

export function normaliseProviderError(rawError: string): {
    errorCode: MediaErrorCode;
    errorMessage: string;
    retryable: boolean;
} {
    for (const [pattern, code, message, retryable] of RETRYABLE_PATTERNS) {
        if (pattern.test(rawError)) {
            return { errorCode: code, errorMessage: message, retryable };
        }
    }
    // Unknown — truncate raw error for client, keep retryable false
    return {
        errorCode: 'empty_result',
        errorMessage: rawError.substring(0, 200),
        retryable: false,
    };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "D:/ai-bytes-leaning-22nd-feb-2026 Backup"
npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

Expected: no errors for the new file (other pre-existing errors are fine to ignore).

- [ ] **Step 3: Commit**

```bash
git add lib/ai/media-errors.ts
git commit -m "feat: add MediaGenerationError, ImageGenerationResult, VideoGenerationResult types"
```

---

## Task 2: Update `GeminiImageService.generateImage()`

**Files:**
- Modify: `lib/ai/gemini-image-service.ts`

- [ ] **Step 1: Add import at top of file**

Add after the existing imports (after line 9, before the `const GEMINI_API_KEY` line):

```typescript
import type { ImageGenerationResult } from './media-errors';
```

- [ ] **Step 2: Change the method signature and return type**

Find the `generateImage` method signature (currently line 52):
```typescript
async generateImage(prompt: string, index: number = 0): Promise<GeminiImage | null> {
```

Replace with:
```typescript
async generateImage(prompt: string, index: number = 0): Promise<ImageGenerationResult> {
```

- [ ] **Step 3: Replace the not-initialised guard**

Find (currently lines 53-56):
```typescript
if (!this.client) {
    console.warn('[GeminiImageService] Client not initialized, skipping');
    return null;
}
```

Replace with:
```typescript
if (!this.client) {
    console.warn('[GeminiImageService] Client not initialized, skipping');
    return { url: null, alt: null, caption: null, errorCode: 'auth_failed', errorMessage: 'Gemini client not initialised — GEMINI_API_KEY missing' };
}
```

- [ ] **Step 4: Replace the successful return path**

Find the block that returns the successful result (currently lines 105-119):
```typescript
if (publicUrl) {
    return {
        url: publicUrl,
        alt: cleanCaption,
        caption: cleanCaption
    };
} else {
    // Fallback to data URI if upload fails (though not ideal for large images)
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    return {
        url: dataUri,
        alt: cleanCaption,
        caption: cleanCaption
    };
}
```

Replace with:
```typescript
if (publicUrl) {
    return { url: publicUrl, alt: cleanCaption, caption: cleanCaption, errorCode: null, errorMessage: null };
}
return { url: null, alt: null, caption: null, errorCode: 'upload_failed', errorMessage: 'Image generated but Supabase Storage upload failed' };
```

- [ ] **Step 5: Replace the "no image data" warning return**

Find (currently lines 123-125):
```typescript
console.warn('[GeminiImageService] No image data in response');
return null;
```

Replace with:
```typescript
console.warn('[GeminiImageService] No image data in response');
return { url: null, alt: null, caption: null, errorCode: 'empty_result', errorMessage: 'Gemini returned no image data — possible content filter or model error' };
```

- [ ] **Step 6: Replace the catch block**

Find (currently lines 127-130):
```typescript
} catch (error: any) {
    console.error(`[GeminiImageService] ❌ Generation failed:`, error.message || error);
    return null;
}
```

Replace with:
```typescript
} catch (error: any) {
    const raw = error?.message || String(error);
    console.error(`[GeminiImageService] ❌ Generation failed:`, raw);
    // Surface the raw error — route will normalise it into a MediaGenerationError
    return { url: null, alt: null, caption: null, errorCode: 'empty_result', errorMessage: raw };
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep "gemini-image-service" | head -10
```

Expected: no errors for this file.

- [ ] **Step 8: Commit**

```bash
git add lib/ai/gemini-image-service.ts
git commit -m "feat: gemini-image-service returns typed ImageGenerationResult instead of null"
```

---

## Task 3: Update `VeoVideoService.generateVideo()`

**Files:**
- Modify: `lib/ai/veo-video-service.ts`

- [ ] **Step 1: Add import at top of file**

After the existing `import { GoogleAuth }` line:
```typescript
import type { VideoGenerationResult } from './media-errors';
```

- [ ] **Step 2: Change the method signature**

Find (currently line 48):
```typescript
async generateVideo(prompt: string, caption: string): Promise<VeoVideo | null> {
```

Replace with:
```typescript
async generateVideo(prompt: string, caption: string): Promise<VideoGenerationResult> {
```

- [ ] **Step 3: Replace the no-token guard**

Find (currently lines 49-53):
```typescript
const token = await this.getAccessToken();
if (!token) {
    console.warn("[VeoService] No access token — skipping generation");
    return null;
}
```

Replace with:
```typescript
const token = await this.getAccessToken();
if (!token) {
    console.warn("[VeoService] No access token — cannot generate");
    return { url: null, source: null, errorCode: 'auth_failed', errorMessage: 'Veo: failed to obtain Google Cloud access token — check GOOGLE_APPLICATION_CREDENTIALS' };
}
```

- [ ] **Step 4: Replace the HTTP error return**

Find (currently lines 76-80):
```typescript
if (!initRes.ok) {
    const errBody = await initRes.text();
    console.error(`[VeoService] predictLongRunning failed HTTP ${initRes.status}:`, errBody);
    return null;
}
```

Replace with:
```typescript
if (!initRes.ok) {
    const errBody = await initRes.text();
    console.error(`[VeoService] predictLongRunning failed HTTP ${initRes.status}:`, errBody);
    return { url: null, source: null, errorCode: 'empty_result', errorMessage: `Veo HTTP ${initRes.status}: ${errBody.substring(0, 200)}` };
}
```

- [ ] **Step 5: Replace the missing operation name return**

Find (currently lines 83-87):
```typescript
const operationName: string = initData?.name;
if (!operationName) {
    console.error("[VeoService] No operation name in response:", initData);
    return null;
}
```

Replace with:
```typescript
const operationName: string = initData?.name;
if (!operationName) {
    console.error("[VeoService] No operation name in response:", initData);
    return { url: null, source: null, errorCode: 'empty_result', errorMessage: 'Veo: predictLongRunning returned no operation name' };
}
```

- [ ] **Step 6: Replace the poll failure and operation error returns**

Find (currently lines 92-98):
```typescript
const finalData = await this.pollOperation(operationName, token);
if (!finalData) return null;

if (finalData.error) {
    console.error("[VeoService] Operation error:", finalData.error);
    return null;
}
```

Replace with:
```typescript
const finalData = await this.pollOperation(operationName, token);
if (!finalData) {
    return { url: null, source: null, errorCode: 'timeout', errorMessage: `Veo: operation timed out after ${POLL_MAX_ATTEMPTS} polls (${(POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS / 1000).toFixed(0)}s)` };
}

if (finalData.error) {
    const raw = JSON.stringify(finalData.error).substring(0, 200);
    console.error("[VeoService] Operation error:", finalData.error);
    return { url: null, source: null, errorCode: 'empty_result', errorMessage: `Veo operation error: ${raw}` };
}
```

- [ ] **Step 7: Replace the no-videos return**

Find (currently lines 100-105):
```typescript
const videos = finalData.response?.videos;
if (!Array.isArray(videos) || videos.length === 0) {
    const filtered = finalData.response?.raiMediaFilteredCount;
    console.warn(`[VeoService] No videos returned. raiMediaFilteredCount=${filtered}`, finalData.response?.raiMediaFilteredReasons);
    return null;
}
```

Replace with:
```typescript
const videos = finalData.response?.videos;
if (!Array.isArray(videos) || videos.length === 0) {
    const filtered = finalData.response?.raiMediaFilteredCount;
    const reasons = finalData.response?.raiMediaFilteredReasons;
    console.warn(`[VeoService] No videos returned. raiMediaFilteredCount=${filtered}`, reasons);
    const isRai = filtered && filtered > 0;
    return {
        url: null, source: null,
        errorCode: isRai ? 'content_policy_violation' : 'empty_result',
        errorMessage: isRai
            ? `Veo: video blocked by RAI safety filter — reasons: ${JSON.stringify(reasons)}`
            : 'Veo: operation completed but returned no video data',
    };
}
```

- [ ] **Step 8: Replace the missing URL return and the successful upload return**

Find (currently lines 107-130):
```typescript
const videoEntry = videos[0];
const gcsUri: string | undefined = videoEntry?.gcsUri || videoEntry?.uri;
const base64Data: string | undefined = videoEntry?.bytesBase64Encoded;

let publicUrl: string | null = null;

if (base64Data) {
    // Vertex AI returned the video inline as base64 — decode and upload directly
    console.log("[VeoService] Video returned as base64 — uploading directly");
    const videoBuffer = Buffer.from(base64Data, "base64");
    publicUrl = await this.uploadBuffer(videoBuffer);
} else if (gcsUri) {
    // Video stored in GCS — download then upload to Supabase
    console.log("[VeoService] Video ready at GCS:", gcsUri);
    publicUrl = await this.downloadAndUpload(gcsUri, token);
} else {
    console.error("[VeoService] Video entry has neither gcsUri nor base64 data:", videoEntry);
    return null;
}

if (!publicUrl) return null;

console.log("[VeoService] ✅ Uploaded to Supabase:", publicUrl);
return { url: publicUrl, caption };
```

Replace with:
```typescript
const videoEntry = videos[0];
const gcsUri: string | undefined = videoEntry?.gcsUri || videoEntry?.uri;
const base64Data: string | undefined = videoEntry?.bytesBase64Encoded;

let publicUrl: string | null = null;

if (base64Data) {
    console.log("[VeoService] Video returned as base64 — uploading directly");
    const videoBuffer = Buffer.from(base64Data, "base64");
    publicUrl = await this.uploadBuffer(videoBuffer);
} else if (gcsUri) {
    console.log("[VeoService] Video ready at GCS:", gcsUri);
    publicUrl = await this.downloadAndUpload(gcsUri, token);
} else {
    console.error("[VeoService] Video entry has neither gcsUri nor base64 data:", videoEntry);
    return { url: null, source: null, errorCode: 'empty_result', errorMessage: 'Veo: video entry contains neither GCS URI nor base64 data' };
}

if (!publicUrl) {
    return { url: null, source: null, errorCode: 'upload_failed', errorMessage: 'Veo: video generated but Supabase Storage upload failed' };
}

console.log("[VeoService] ✅ Uploaded to Supabase:", publicUrl);
return { url: publicUrl, source: 'veo', errorCode: null, errorMessage: null };
```

- [ ] **Step 9: Replace the catch block**

Find (currently lines 132-135):
```typescript
} catch (err: any) {
    console.error("[VeoService] ❌ Unexpected error:", err.message || err);
    return null;
}
```

Replace with:
```typescript
} catch (err: any) {
    const raw = err?.message || String(err);
    console.error("[VeoService] ❌ Unexpected error:", raw);
    return { url: null, source: null, errorCode: 'empty_result', errorMessage: `Veo unexpected error: ${raw.substring(0, 200)}` };
}
```

- [ ] **Step 10: Verify TypeScript compiles**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep "veo-video-service" | head -10
```

Expected: no errors for this file.

- [ ] **Step 11: Commit**

```bash
git add lib/ai/veo-video-service.ts
git commit -m "feat: veo-video-service returns typed VideoGenerationResult with error detail"
```

---

## Task 4: Update Video Prompt Instructions in `agent-system-v2.ts`

**Files:**
- Modify: `lib/ai/agent-system-v2.ts`

This task has three sub-changes: (A) the schema doc string, (B) the LessonExpanderAgent mandate, (C) the VisualEnrichmentAgent.

- [ ] **Step 1: Update the video_snippet schema doc string**

Find (line ~319):
```typescript
'video_snippet':          'video_snippet — AI-generated cinematic video clip. REQUIRED: type: "video_snippet", id, title, caption, videoPrompt: MINIMUM 1000 WORDS (SCENE/MOTION/LIGHTING/PEDAGOGICAL LINK/RESTRICTIONS), video_search_query, duration: "8s".',
```

Replace with:
```typescript
'video_snippet':          'video_snippet — AI-generated cinematic video clip. REQUIRED: type: "video_snippet", id, title, caption, videoPrompt: EXACTLY 5 SENTENCES using the motion-arc structure — S1: name the exact lesson concept being demonstrated (must include the lesson title), S2: primary visible objects / UI / interfaces / data flows in frame, S3: motion arc — what state the scene STARTS in, what CHANGES during 8 seconds, what the final state IS, S4: camera movement and environment / lighting, S5: exclusions (no metaphors, no human faces) and fidelity target (photorealistic / cinematic). video_search_query: 3-5 words safe for Pexels stock search. duration: "8s".',
```

- [ ] **Step 2: Update the LessonExpanderAgent visual mandate**

Find (line ~422):
```
>>> ONLY imagePrompt and videoPrompt fields MUST BE MINIMUM 1000 WORDS of technical blueprint.
```

Replace with:
```
>>> IMAGE PROMPTS (imagePrompt fields) MUST BE MINIMUM 1000 WORDS of technical blueprint following the 6-part formula below.
>>> VIDEO PROMPTS (videoPrompt fields) MUST BE EXACTLY 5 SENTENCES using the motion-arc structure: S1 names the lesson concept and lesson title, S2 describes visible objects/interfaces, S3 describes the motion arc (start state → transformation → end state), S4 describes camera movement and environment, S5 states exclusions and fidelity target.
```

- [ ] **Step 3: Update the retry rejection message**

Find (line ~471):
```typescript
messages.push({ role: 'user', parts: [{ text: `Rejection: ${validation.failures.join(', ')}. FIX ALL. REMEMBER: Prompts MUST be 1000+ words.` }] });
```

Replace with:
```typescript
messages.push({ role: 'user', parts: [{ text: `Rejection: ${validation.failures.join(', ')}. FIX ALL. REMEMBER: Image prompts MUST be 1000+ words. Video prompts MUST follow the 5-sentence motion-arc structure (S1 names lesson concept + title, S2 visible objects, S3 start→change→end, S4 camera, S5 exclusions).` }] });
```

- [ ] **Step 4: Replace `VisualEnrichmentAgent.enrichBlock()` with split image/video logic**

Find the entire `enrichBlock` method (lines ~496-521):
```typescript
async enrichBlock(block: any, lessonTitle: string, domainStr: string): Promise<string> {
    const type = block.type === 'video_snippet' ? 'VIDEO SNIPPET' : 'IMAGE BLOCK';
    const prompt = `SYSTEM: You are a Lead Visual Architect for AI Bytes Learning.
GOAL: Expand the provided ${type} trigger into a MINIMUM 1000-WORD technical blueprint.

CONTEXT:
LESSON: "${lessonTitle}"
DOMAIN: "${domainStr}"
BLOCK TITLE: "${block.title || block.caption || 'Technical Detail'}"

VISUAL ACCURACY — ABSOLUTE LAW:
1. MINIMUM 1000 WORDS of technical description.
2. NO analogies. NO metaphors. NO kitchens, gardens, pottery, or cities.
3. USE THE 6-PART TECHNICAL FORMULA:
    - GEOMETRY: Precise shapes, wireframes, vertices, architectural layouts.
    - PHYSICS: Refractive indices, subsurface scattering, material properties (brushed metal, silicon).
    - LITE & OPTICS: Specific lighting (rim, three-point, lens flare), 35mm focal length.
    - DATA VISUALISATION: Literal tensors, weight matrices, code streams, signal noise.
    - MOTION (For Video): Frame-by-frame camera movement (pan/tilt/zoom), playback speed, temporal shifts.
    - PEDAGOGICAL ALIGNMENT: Direct literal mapping to the lesson objective.

RETURN ONLY THE TEXT OF THE ENRICHED PROMPT. NO INTROS. NO OUTROS.`;

    const result = await this.makeRequest(prompt, false); // isJson: false
    return result || block.imagePrompt || block.videoPrompt || '';
}
```

Replace with:
```typescript
async enrichBlock(block: any, lessonTitle: string, domainStr: string): Promise<string> {
    const isVideo = block.type === 'video_snippet';

    if (isVideo) {
        const prompt = `SYSTEM: You are a Video Director for AI Bytes Learning.
GOAL: Rewrite the provided video prompt into EXACTLY 5 SENTENCES using the motion-arc structure.

CONTEXT:
LESSON: "${lessonTitle}"
DOMAIN: "${domainStr}"
BLOCK TITLE: "${block.title || block.caption || 'Technical Detail'}"

MOTION-ARC STRUCTURE (strictly 5 sentences, no more, no less):
S1: State the exact concept from the lesson "${lessonTitle}" that this video demonstrates. Name "${lessonTitle}" explicitly in this sentence.
S2: Describe the primary visible objects, interfaces, hardware, data flows, or physical setup visible in frame at the start.
S3: Describe the motion arc — what state the scene STARTS in, what visibly TRANSFORMS or MOVES during the 8-second clip, and what the final state IS at the end.
S4: Describe the camera behaviour (movement type, framing, lens, environment, and lighting mood).
S5: State exclusions (no metaphors, no human faces, no abstract domain substitutions, no kitchen/garden/nature scenes) and the fidelity target (photorealistic, cinematic, temporally stable).

RULES:
- Must reference "${lessonTitle}" by name in S1.
- S3 must describe a real temporal transformation — not just what is visible, but what actively CHANGES over the 8 seconds.
- No analogies. No metaphors. No domain substitutions.
- Return ONLY the 5 sentences as plain text. No labels (do not write "S1:", "S2:" etc.), no intros, no outros.`;

        const result = await this.makeRequest(prompt, false);
        return result || block.videoPrompt || '';
    }

    // Image prompt enrichment — 1000-word mandate unchanged
    const prompt = `SYSTEM: You are a Lead Visual Architect for AI Bytes Learning.
GOAL: Expand the provided IMAGE BLOCK trigger into a MINIMUM 1000-WORD technical blueprint.

CONTEXT:
LESSON: "${lessonTitle}"
DOMAIN: "${domainStr}"
BLOCK TITLE: "${block.title || block.caption || 'Technical Detail'}"

VISUAL ACCURACY — ABSOLUTE LAW:
1. MINIMUM 1000 WORDS of technical description.
2. NO analogies. NO metaphors. NO kitchens, gardens, pottery, or cities.
3. USE THE 6-PART TECHNICAL FORMULA:
    - GEOMETRY: Precise shapes, wireframes, vertices, architectural layouts.
    - PHYSICS: Refractive indices, subsurface scattering, material properties (brushed metal, silicon).
    - LITE & OPTICS: Specific lighting (rim, three-point, lens flare), 35mm focal length.
    - DATA VISUALISATION: Literal tensors, weight matrices, code streams, signal noise.
    - PEDAGOGICAL ALIGNMENT: Direct literal mapping to the lesson objective.

RETURN ONLY THE TEXT OF THE ENRICHED PROMPT. NO INTROS. NO OUTROS.`;

    const result = await this.makeRequest(prompt, false);
    return result || block.imagePrompt || '';
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep "agent-system-v2" | head -10
```

Expected: no errors for this file.

- [ ] **Step 6: Commit**

```bash
git add lib/ai/agent-system-v2.ts
git commit -m "feat: split image/video prompt mandates, add motion-arc structure for Veo prompts"
```

---

## Task 5: Route — Synchronous Video, Fail-Fast Images, Budget Guard

**Files:**
- Modify: `app/api/course/generate-v2/route.ts`

- [ ] **Step 1: Add imports at the top of the route**

Add after the existing imports (after line 19, before `export const runtime`):
```typescript
import { MediaGenerationError, normaliseProviderError } from '@/lib/ai/media-errors';
import type { ImageGenerationResult } from '@/lib/ai/media-errors';
```

- [ ] **Step 2: Add the storage path extractor helper and budget constant**

Add after the imports, before `export const runtime = 'nodejs'`:
```typescript
const GENERATION_BUDGET_MS = 240_000; // 240 s — leaves 60 s buffer before the 300 s Vercel limit

function extractStoragePath(publicUrl: string): string | null {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;
    const prefix = `${supabaseUrl}/storage/v1/object/public/course-images/`;
    return publicUrl.startsWith(prefix) ? publicUrl.slice(prefix.length) : null;
}
```

- [ ] **Step 3: Initialise tracking variables inside the outer `try` block**

In the `(async () => { ... })()` IIFE, at the top of the outer `try` block (immediately after `try {`), add:
```typescript
const uploadedStoragePaths: string[] = [];
const generationStart = Date.now();
```

- [ ] **Step 4: Replace the image generation try/catch with fail-fast logic**

Find the image generation block (lines ~368-404):
```typescript
if (!DRY_RUN && rawPrompts.length > 0) {
    try {
        // ...
        const generatedImages = await Promise.all(rawPrompts.map(async (p, idx) => {
            const img = await geminiImageService.generateImage(p.prompt, globalLessonIndex * 10 + idx);
            return img ? img : { url: '', alt: p.prompt, caption: '' }; // Fallback to empty if Gemini fails to avoid crash
        }));
        // ...
    }
    catch (e) { console.error("[API-V2] Image gen failed:", e); }
}
```

Replace the entire block with:
```typescript
if (!DRY_RUN && rawPrompts.length > 0) {
    const baseProgress = 20 + Math.floor((lessonsProcessed / Math.max(1, totalLessons)) * 55);
    await sendEvent({ stage: 'generating', progress: baseProgress, message: `🖼️ Generating ${rawPrompts.length} images for "${lessonPlan.lessonTitle}"...` });
    console.time(`[API-V2] Image Fetching (${rawPrompts.length} total) - ${lessonPlan.lessonTitle}`);

    const generatedImages = await Promise.all(
        rawPrompts.map(async (p, idx) => {
            const result: ImageGenerationResult = await geminiImageService.generateImage(p.prompt, globalLessonIndex * 10 + idx);
            if (!result.url) {
                const { errorCode, errorMessage, retryable } = normaliseProviderError(result.errorMessage || 'unknown');
                throw new MediaGenerationError(
                    'gemini-image',
                    errorCode,
                    errorMessage,
                    'image_generation',
                    retryable,
                    lessonPlan.lessonTitle,
                    (p as any).blockType || 'unknown',
                    (p as any).slotLabel || `image_slot_${idx + 1}`,
                );
            }
            return result;
        })
    );

    console.timeEnd(`[API-V2] Image Fetching (${rawPrompts.length} total) - ${lessonPlan.lessonTitle}`);

    // Map URLs back into block objects
    generatedImages.forEach((img, idx) => {
        if (rawPrompts[idx] && img.url) {
            rawPrompts[idx].ref.imageUrl = img.url;
            if ((rawPrompts[idx] as any).isHero) {
                rawPrompts[idx].ref.heroImageUrl = img.url;
            }
        }
    });

    allFetchedImages = [...generatedImages];

    allFetchedImages.forEach(img => {
        if (img?.url) {
            if (!courseState.used_image_urls.includes(img.url)) {
                courseState.used_image_urls.push(img.url);
            }
            // Track for rollback
            const storagePath = extractStoragePath(img.url);
            if (storagePath) uploadedStoragePaths.push(storagePath);
        }
    });
    CourseStateManager.saveState(courseState);
}
```

- [ ] **Step 5: Add slot labels to rawPrompts**

Find each `rawPrompts.push(...)` call inside the `compiledLesson.blocks.forEach(...)` block and add a `slotLabel` and `blockType` property to each. Replace the entire `forEach` that builds `rawPrompts` (lines ~324-362):

```typescript
if (!DRY_RUN && compiledLesson.blocks) {
    compiledLesson.blocks.forEach((block: any) => {
        const type = block.type || block.blockType;
        if (type === 'lesson_header' && block.heroPrompt) {
            rawPrompts.push({ ref: block, prompt: sanitizeVisualPrompt(block.heroPrompt, lt, ct), isHero: true, slotLabel: 'hero_image', blockType: 'lesson_header' } as any);
        } else if (type === 'full_image' && block.imagePrompt) {
            rawPrompts.push({ ref: block, prompt: sanitizeVisualPrompt(block.imagePrompt, lt, ct), slotLabel: 'full_image', blockType: 'full_image' });
        } else if (type === 'image_text_row' && block.imagePrompt) {
            rawPrompts.push({ ref: block, prompt: sanitizeVisualPrompt(block.imagePrompt, lt, ct), slotLabel: 'image_text_row', blockType: 'image_text_row' });
        } else if (type === 'concept_illustration' && block.imagePrompt) {
            rawPrompts.push({ ref: block, prompt: sanitizeVisualPrompt(block.imagePrompt, lt, ct), slotLabel: 'concept_illustration', blockType: 'concept_illustration' });
        } else if (type === 'type_cards' && block.cards) {
            block.cards.forEach((card: any, cardIdx: number) => {
                if (card.imagePrompt) rawPrompts.push({ ref: card, prompt: sanitizeVisualPrompt(card.imagePrompt, lt, ct), slotLabel: `type_card_${cardIdx + 1}`, blockType: 'type_cards' });
            });
        } else if (type === 'industry_tabs' && block.tabs) {
            block.tabs.forEach((tab: any, tabIdx: number) => {
                if (tab.imagePrompt) rawPrompts.push({ ref: tab, prompt: sanitizeVisualPrompt(tab.imagePrompt, lt, ct), slotLabel: `industry_tab_${tabIdx + 1}`, blockType: 'industry_tabs' });
            });
        } else if (type === 'quiz' && block.questions) {
            block.questions.forEach((q: any, qIdx: number) => {
                if (q.imageContext?.imagePrompt) rawPrompts.push({ ref: q.imageContext, prompt: sanitizeVisualPrompt(q.imageContext.imagePrompt, lt, ct), slotLabel: `quiz_image_${qIdx + 1}`, blockType: 'quiz' });
            });
        }
    });
}
```

- [ ] **Step 6: Replace the async videoTask with synchronous video generation**

Find the entire block from `if (videoBlocks.length > 0) {` (line ~427) through `videoTask().catch(...)` (line ~534) and the `}` that closes it. Replace with:

```typescript
if (!DRY_RUN && videoBlocks.length > 0) {
    const baseProgress = 20 + Math.floor((lessonsProcessed / Math.max(1, totalLessons)) * 55);
    await sendEvent({ stage: 'generating', progress: baseProgress + 1, message: `🎬 Generating ${videoBlocks.length} video(s) for "${lessonPlan.lessonTitle}"...` });

    for (const v of videoBlocks) {
        // Budget guard — fail before hitting the serverless execution limit
        const elapsed = Date.now() - generationStart;
        if (elapsed > GENERATION_BUDGET_MS) {
            throw new MediaGenerationError(
                'veo',
                'budget_exceeded',
                `Execution budget exceeded (${Math.round(elapsed / 1000)}s elapsed, ${GENERATION_BUDGET_MS / 1000}s limit) — reduce lessons per course or increase maxDuration`,
                'video_generation',
                false,
                lessonPlan.lessonTitle,
                'video_snippet',
            );
        }

        const rawVideoPrompt = v.videoPrompt || `Show the literal technology of ${lessonPlan.lessonTitle} in action.`;
        const videoCaption = v.caption || v.title || 'Visual insight';

        console.log(`[API-V2] 🎬 Generating video: "${videoCaption}" for lesson "${lessonPlan.lessonTitle}"`);
        const veoResult = await veoVideoService.generateVideo(rawVideoPrompt, videoCaption);

        let finalUrl: string | null = null;
        let videoSource: string = 'unknown';

        if (veoResult.url) {
            finalUrl = veoResult.url;
            videoSource = 'veo';
        } else {
            // Veo failed — try Pexels waterfall
            console.warn(`[API-V2] ⚠️ Veo failed (${veoResult.errorCode}: ${veoResult.errorMessage}) — falling back to Pexels`);
            await sendEvent({ stage: 'generating', progress: baseProgress + 1, message: `⚠️ Veo unavailable — trying Pexels for "${videoCaption}"` });

            const safeQuery = extractSafePexelsQuery(v, lessonPlan.lessonTitle);
            const pexelsRes = await videoService.fetchVideoWaterfall(safeQuery, (compiledLesson as any).analogy_domain || 'Technology', courseState);

            if (pexelsRes?.url) {
                finalUrl = pexelsRes.url;
                videoSource = `pexels-tier${pexelsRes.tier}`;
            } else {
                // Both Veo and Pexels failed — throw to abort course generation
                const { errorCode, errorMessage, retryable } = normaliseProviderError(veoResult.errorMessage || 'unknown');
                throw new MediaGenerationError(
                    'veo',
                    errorCode,
                    `Veo failed and Pexels waterfall exhausted. Veo reason: ${veoResult.errorMessage || 'unknown'}`,
                    'fallback',
                    retryable,
                    lessonPlan.lessonTitle,
                    'video_snippet',
                    v.title || v.id || 'video_block',
                );
            }
        }

        // Patch the block in-memory with the resolved URL
        v.videoUrl = finalUrl;
        videoSource && console.log(`[API-V2] ✅ Video resolved via ${videoSource}: ${finalUrl}`);

        // Track for rollback (Veo uploads to Supabase Storage)
        if (videoSource.startsWith('veo') && finalUrl) {
            const storagePath = extractStoragePath(finalUrl);
            if (storagePath) uploadedStoragePaths.push(storagePath);
        }

        if (!courseState.used_video_urls) courseState.used_video_urls = [];
        (courseState.used_video_urls as any[]).push({ query: rawVideoPrompt.substring(0, 100), url: finalUrl, source: videoSource });
        CourseStateManager.saveState(courseState);
    }
}
```

- [ ] **Step 7: Remove the lesson-level try/catch**

Find the wrapping `try { ... } catch (lessonGenErr: any) { ... }` around the lesson expansion block (lines ~244-548). The catch currently reads:
```typescript
} catch (lessonGenErr: any) {
    console.error(`[API-V2] Lesson Expansion Failed for ${lessonPlan.lessonTitle}`, lessonGenErr);
    if (!DRY_RUN) {
        await dbV2.updateNodeState(supabase, courseId, manifestNodeId, 'lesson', 'failed', lessonGenErr.message);
    }
    // For V2, we continue generating the rest of the manifest, marking this one as failed.
    // We do not crash the whole process.
}
```

**Remove the entire try/catch wrapper** — delete the `try {` at the top and the full `} catch (lessonGenErr: any) { ... }` block. The lesson expansion code remains but errors now bubble directly to the outer catch which triggers full rollback.

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep "generate-v2" | head -15
```

Expected: no type errors for this file.

- [ ] **Step 9: Commit**

```bash
git add app/api/course/generate-v2/route.ts
git commit -m "feat: synchronous video generation, fail-fast image validation, budget guard"
```

---

## Task 6: Atomic Rollback with Storage Cleanup

**Files:**
- Modify: `app/api/course/generate-v2/route.ts`

- [ ] **Step 1: Replace the outer catch block**

Find the outer `catch (error: any)` block (currently lines ~591-598):
```typescript
} catch (error: any) {
    console.error('[API-V2] ERROR:', error);
    try {
        fs.appendFileSync(path.join(process.cwd(), 'v2-error.log'), new Date().toISOString() + ' ' + (error.stack || error.message) + '\n');
    } catch (e) { }
    if (generationId && !DRY_RUN) await dbV2.markGenerationComplete(supabase, generationId, false, error.message);
    await sendEvent({ stage: 'error', message: error.message || 'Internal Server Error' });
}
```

Replace with:
```typescript
} catch (error: any) {
    const isMediaError = error instanceof MediaGenerationError;

    // Full internal log — always log the raw error
    console.error('[API-V2] ❌ Generation failed:', error.stack || error.message || error);
    try {
        fs.appendFileSync(
            path.join(process.cwd(), 'v2-error.log'),
            `${new Date().toISOString()} ${error.stack || error.message}\n`
        );
    } catch (_) { /* log write failure is non-fatal */ }

    // --- ROLLBACK: DB ---
    if (courseId && !DRY_RUN) {
        console.log(`[API-V2] Rolling back course ${courseId}...`);
        const { error: deleteErr } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseId);
        if (deleteErr) {
            // Rollback failure is secondary — log it but keep the original error primary
            console.error('[API-V2] Rollback: DB delete failed (secondary error):', deleteErr.message);
        } else {
            console.log(`[API-V2] Rollback: course ${courseId} and all descendants deleted.`);
        }
    }

    // --- ROLLBACK: Storage (best-effort) ---
    if (uploadedStoragePaths.length > 0 && !DRY_RUN) {
        console.log(`[API-V2] Rollback: cleaning up ${uploadedStoragePaths.length} uploaded storage file(s)...`);
        const { error: storageErr } = await supabase.storage
            .from('course-images')
            .remove(uploadedStoragePaths);
        if (storageErr) {
            console.error('[API-V2] Rollback: Storage cleanup failed (secondary error):', storageErr.message);
        } else {
            console.log('[API-V2] Rollback: storage cleanup complete.');
        }
    }

    // Mark generation progress record as failed
    if (generationId && !DRY_RUN) {
        await dbV2.markGenerationComplete(supabase, generationId, false, error.message);
    }

    // Stream normalised error to client — do NOT stream raw provider errors
    await sendEvent({
        stage: 'error',
        api: isMediaError ? error.api : 'generation',
        errorCode: isMediaError ? error.errorCode : 'internal_error',
        message: isMediaError
            ? error.message  // MediaGenerationError.message is already formatted
            : 'Course generation failed — internal error. Check server logs.',
        retryable: isMediaError ? error.retryable : false,
        lessonTitle: isMediaError ? error.lessonTitle : undefined,
        blockType: isMediaError ? error.blockType : undefined,
        slotLabel: isMediaError ? error.slotLabel : undefined,
    });
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep "generate-v2" | head -15
```

Expected: no errors.

- [ ] **Step 3: Verify `uploadedStoragePaths` is accessible in catch scope**

`uploadedStoragePaths` was declared with `const` inside the outer `try` block in Task 5 Step 3. Move it to **before** the `try` block so the `catch` can access it. Find the outer try block structure:

```typescript
try {
    const uploadedStoragePaths: string[] = [];  // <-- currently here
    const generationStart = Date.now();
    ...
```

Move both declarations to just before the `try {`:
```typescript
const uploadedStoragePaths: string[] = [];
const generationStart = Date.now();
try {
    ...
```

- [ ] **Step 4: Final TypeScript check**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep -E "error TS" | head -20
```

Expected: zero errors specific to the route or any file modified in this plan. Pre-existing errors in other files are acceptable.

- [ ] **Step 5: Commit**

```bash
git add app/api/course/generate-v2/route.ts
git commit -m "feat: atomic course rollback — DB cascade + storage cleanup on any generation failure"
```

---

## Task 7: Integration Test

**Objective:** Verify that a generation failure causes full rollback and a structured error event, and that a successful generation has all media URLs populated before the lesson is saved.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Wait for `✓ Ready` in the terminal.

- [ ] **Step 2: Test image failure path (temporarily break the API key)**

In `.env.local`, temporarily set:
```
GEMINI_API_KEY=invalid_key_for_testing
```

Restart the dev server. Trigger a course generation via the admin UI or:
```bash
curl -X POST http://localhost:3000/api/course/generate-v2 \
  -H "Content-Type: application/json" \
  -d '{"courseName":"Test Atomic Failure","difficultyLevel":"beginner","topicCount":1,"lessonsPerTopic":1}' \
  --no-buffer 2>&1 | grep -E "stage|error|api|errorCode"
```

Expected output contains:
```json
{"stage":"error","api":"gemini-image","errorCode":"auth_failed","retryable":false,...}
```

Check Supabase: confirm no `courses` row was created for "Test Atomic Failure".

- [ ] **Step 3: Restore the real API key**

```
GEMINI_API_KEY=<real key>
```

Restart the dev server.

- [ ] **Step 4: Test successful generation**

Trigger a 1-topic, 1-lesson course:
```bash
curl -X POST http://localhost:3000/api/course/generate-v2 \
  -H "Content-Type: application/json" \
  -d '{"courseName":"Attention Mechanisms in Transformers","difficultyLevel":"intermediate","topicCount":1,"lessonsPerTopic":1}' \
  --no-buffer 2>&1 | tail -5
```

Expected last event:
```json
{"stage":"completed","progress":100,"message":"V2 Generation Complete!","courseId":"..."}
```

- [ ] **Step 5: Verify all media is populated on first load**

Take the `courseId` from the completed event. In Supabase Studio run:
```sql
SELECT id, title,
  (SELECT COUNT(*) FROM jsonb_array_elements(content_blocks) b WHERE b->>'type' = 'video_snippet' AND b->>'videoUrl' IS NULL) AS videos_missing,
  (SELECT COUNT(*) FROM jsonb_array_elements(content_blocks) b WHERE b->>'type' = 'video_snippet' AND b->>'videoUrl' IS NOT NULL) AS videos_present
FROM course_lessons
WHERE topic_id IN (SELECT id FROM course_topics WHERE course_id = '<courseId>');
```

Expected: `videos_missing = 0`, `videos_present > 0`.

- [ ] **Step 6: Verify video prompt quality**

In Supabase Studio:
```sql
SELECT id, title,
  (SELECT b->>'videoPrompt' FROM jsonb_array_elements(content_blocks) b WHERE b->>'type' = 'video_snippet' LIMIT 1) AS sample_video_prompt
FROM course_lessons
WHERE topic_id IN (SELECT id FROM course_topics WHERE course_id = '<courseId>');
```

Verify the `sample_video_prompt` is 5 sentences, mentions the lesson title in the first sentence, and describes a motion arc (start→change→end) in the third sentence.

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "test: verify atomic rollback and synchronous media generation"
```

---

## Self-Review

**Spec coverage:**
- ✅ `MediaGenerationError` with `stage`, `retryable`, `slotLabel` — Task 1
- ✅ Typed `ImageGenerationResult` with `errorCode`/`errorMessage` — Tasks 1 + 2
- ✅ Typed `VideoGenerationResult` with `errorCode`/`errorMessage` — Tasks 1 + 3
- ✅ Sanitised client errors / normalised provider errors — Task 1 (`normaliseProviderError`)
- ✅ Pexels kept as fallback — Task 5 Step 6
- ✅ Budget guard before each Veo call — Task 5 Step 6
- ✅ Synchronous video generation before DB save — Task 5 Step 6
- ✅ Fail-fast image validation — Task 5 Step 4
- ✅ Slot identity on image failures — Task 5 Step 5
- ✅ Atomic rollback (DB cascade) — Task 6 Step 1
- ✅ Storage cleanup on rollback (best-effort) — Task 6 Step 1
- ✅ Idempotent rollback (errors logged separately, original error preserved) — Task 6 Step 1
- ✅ Lesson-level swallow-and-continue removed — Task 5 Step 7
- ✅ Video prompt motion-arc structure — Task 4
- ✅ Lesson title injected into all video prompts — Task 4 Steps 1 + 4
- ✅ Image prompts keep 1000-word mandate — Task 4 Step 4
- ✅ `uploadedStoragePaths` accessible in catch scope — Task 6 Step 3

**Placeholder scan:** No TBDs, no "implement later", no "similar to above". All code blocks are complete.

**Type consistency:** `ImageGenerationResult` defined in Task 1, imported in Task 2 and used in Task 5. `VideoGenerationResult` defined in Task 1, imported in Task 3, referenced in Task 5 (`veoResult.url`, `veoResult.errorCode`, `veoResult.errorMessage`). `MediaGenerationError` defined in Task 1, imported in Tasks 5 and 6. All consistent.
