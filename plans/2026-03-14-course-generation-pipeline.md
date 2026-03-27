# Course Generation & Media Assembly Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a staged orchestration pipeline that takes a course title and produces a fully assembled course with lessons, quizzes, Sophie/Dan audio per lesson/module, and optional module video — all stored in Cloudflare R2 with metadata in Supabase.

**Architecture:** A `course_generation_jobs` table drives a 15-stage pipeline. Each stage is a standalone async function that reads from Supabase, does its work, writes back to Supabase, uploads media to Cloudflare R2, and marks itself complete. Gemini 2.0 Flash handles all AI generation (content + scripts + enrichment). ElevenLabs handles all final audio. NotebookLM has no public API — enrichment is done via Gemini; NotebookLM is a human-in-the-loop quality step only.

**Tech Stack:** Next.js 16 App Router · Supabase (PostgreSQL + Auth) · Cloudflare R2 (S3-compatible via `@aws-sdk/client-s3`) · ElevenLabs TTS · Gemini 2.0 Flash · Framer Motion · TypeScript strict

---

## Critical Pre-read: What Already Exists

| File | Status | Notes |
|------|--------|-------|
| `lib/services/elevenlabs-service.ts` | EXISTS — needs voice update | Uses Isabella/Lily, needs Sophie/Dan |
| `lib/services/audio-storage.ts` | EXISTS — replace with R2 | Currently Supabase Storage |
| `lib/ai/agent-system-v2.ts` | EXISTS — reuse `BaseAgentV2` | Gemini client with retry logic |
| `app/api/course/generate-v2/route.ts` | EXISTS — update | Current generation entry point |
| `course_generation_progress` table | EXISTS — supplement | Need richer `course_generation_jobs` |

---

## MVP Scope (implement this before anything else)

Per lesson:
- Lesson intro audio (Sophie, 30–60 s)
- Lesson recap audio (Sophie, 45–90 s)
- Quiz (1–3 questions)
- Action step

Per module:
- Module overview audio (Sophie, 2–4 min)
- Deep-dive discussion audio (Sophie + Dan, 3–6 min)
- Optional module overview video (placeholder stub for now)

---

## Chunk 1: Schema & Infrastructure

### Task 1: Supabase Migration — New Tables

**Files:**
- Create: `supabase/migrations/20260314_course_pipeline_schema.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- course_generation_jobs: master job tracker
CREATE TABLE IF NOT EXISTS course_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','planning','generating','media','uploading','validating','complete','failed','partial_failed')),
  current_stage TEXT,
  stages_completed TEXT[] DEFAULT '{}',
  stages_failed TEXT[] DEFAULT '{}',
  input_params JSONB NOT NULL DEFAULT '{}',
  error_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- lesson_sections: structured content blocks per lesson
CREATE TABLE IF NOT EXISTS lesson_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL
    CHECK (section_type IN ('intro','concept','example','comparison','action_step','key_takeaway')),
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- media_assets: all generated media references
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES course_topics(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL
    CHECK (media_type IN (
      'lesson_intro_audio','lesson_recap_audio',
      'module_overview_audio','module_deep_dive_audio',
      'module_overview_video',
      'lesson_visual','module_visual'
    )),
  title TEXT NOT NULL,
  placement TEXT NOT NULL
    CHECK (placement IN ('lesson_top','lesson_bottom','module_top','module_resources')),
  voice_mode TEXT CHECK (voice_mode IN ('sophie','dan','sophie_dan')),
  r2_key TEXT,
  public_url TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  transcript_url TEXT,
  thumbnail_url TEXT,
  is_optional BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  generation_status TEXT DEFAULT 'pending'
    CHECK (generation_status IN ('pending','generating','complete','failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- generation_logs: per-stage audit trail
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started','completed','failed','skipped')),
  details JSONB DEFAULT '{}',
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add action_step + reflection fields to course_lessons if not present
ALTER TABLE course_lessons
  ADD COLUMN IF NOT EXISTS lesson_objective TEXT,
  ADD COLUMN IF NOT EXISTS action_step TEXT,
  ADD COLUMN IF NOT EXISTS key_takeaway TEXT,
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER DEFAULT 5;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_assets_course_id ON media_assets(course_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_module_id ON media_assets(module_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_lesson_id ON media_assets(lesson_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(media_type);
CREATE INDEX IF NOT EXISTS idx_lesson_sections_lesson_id ON lesson_sections(lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_gen_logs_job_id ON generation_logs(job_id, created_at);
```

- [ ] **Step 2: Apply migration**

```bash
# Via Supabase CLI
npx supabase db push

# OR paste into Supabase SQL Editor and run
```

Expected: no errors, tables created.

- [ ] **Step 3: Verify tables exist**

```bash
npx supabase db diff --use-migra
```

Expected: diff shows new tables, no dropped columns on existing tables.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260314_course_pipeline_schema.sql
git commit -m "feat: add pipeline schema — jobs, lesson_sections, media_assets, generation_logs"
```

---

### Task 2: Cloudflare R2 Client

**Files:**
- Create: `lib/storage/r2-client.ts`
- Create: `lib/storage/r2-upload.ts`

R2 uses the AWS S3-compatible API. Install the SDK first.

- [ ] **Step 1: Install AWS SDK**

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- [ ] **Step 2: Add R2 env vars to `.env.local`**

```bash
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=aibytes-media
R2_PUBLIC_URL=https://media.aibytes.com
```

- [ ] **Step 3: Write R2 client**

`lib/storage/r2-client.ts`:
```typescript
import { S3Client } from '@aws-sdk/client-s3';

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export const r2Client = getR2Client();
export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? 'aibytes-media';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';
```

- [ ] **Step 4: Write R2 upload helper**

`lib/storage/r2-upload.ts`:
```typescript
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from './r2-client';

export interface R2UploadResult {
  r2Key: string;
  publicUrl: string;
  sizeBytes: number;
}

/**
 * Upload a Buffer to Cloudflare R2.
 * Key uses deterministic paths: courses/{courseId}/modules/{moduleId}/...
 */
export async function uploadToR2(
  buffer: Buffer,
  r2Key: string,
  contentType: string,
): Promise<R2UploadResult> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicUrl = `${R2_PUBLIC_URL}/${r2Key}`;
  return { r2Key, publicUrl, sizeBytes: buffer.byteLength };
}

export async function deleteFromR2(r2Key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: r2Key })
  );
}

/** Deterministic R2 key builders — never use random filenames */
export const r2Keys = {
  lessonIntroAudio: (courseId: string, moduleId: string, lessonId: string) =>
    `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/intro.mp3`,
  lessonRecapAudio: (courseId: string, moduleId: string, lessonId: string) =>
    `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/recap.mp3`,
  lessonTranscript: (courseId: string, moduleId: string, lessonId: string) =>
    `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/transcript.json`,
  moduleOverviewAudio: (courseId: string, moduleId: string) =>
    `courses/${courseId}/modules/${moduleId}/audio/overview.mp3`,
  moduleDeepDiveAudio: (courseId: string, moduleId: string) =>
    `courses/${courseId}/modules/${moduleId}/audio/deep-dive-discussion.mp3`,
  moduleOverviewVideo: (courseId: string, moduleId: string) =>
    `courses/${courseId}/modules/${moduleId}/video/overview.mp4`,
  moduleVideoThumb: (courseId: string, moduleId: string) =>
    `courses/${courseId}/modules/${moduleId}/video/overview-thumb.jpg`,
};
```

- [ ] **Step 5: Verify R2 connectivity (manual)**

```typescript
// Run via: npx tsx scripts/test-r2.ts
import { uploadToR2 } from '../lib/storage/r2-upload';
const buf = Buffer.from('ping');
const result = await uploadToR2(buf, 'test/ping.txt', 'text/plain');
console.log('R2 OK:', result.publicUrl);
```

- [ ] **Step 6: Commit**

```bash
git add lib/storage/ package.json package-lock.json
git commit -m "feat: add Cloudflare R2 client and upload helpers"
```

---

### Task 3: Update ElevenLabs Voices to Sophie + Dan

**Files:**
- Modify: `lib/services/elevenlabs-service.ts`

- [ ] **Step 1: Update voice constants and add generateSpeechDualHost**

Replace the `ELEVENLABS_VOICES` constant and add a dual-voice method:

```typescript
export const ELEVENLABS_VOICES = {
  SOPHIE: {
    voice_id: 'khYwAWwYSjlxlcrwGQ16',
    name: 'Sophie',
    description: 'British Female — warm, clear, authoritative narrator'
  },
  DAN: {
    voice_id: 'DvhK1yIWv9GpUpAD6dsU',
    name: 'Dan',
    description: 'British Male — engaging, conversational co-host'
  }
} as const;

export type VoiceMode = 'sophie' | 'dan' | 'sophie_dan';
```

Add to `ElevenLabsService` class:

```typescript
/**
 * Generate single-voice audio (Sophie or Dan)
 */
async generateMonoAudio(script: string, voice: 'sophie' | 'dan'): Promise<{
  buffer: Buffer;
  durationSeconds: number;
  charactersUsed: number;
}> {
  const voiceId = voice === 'sophie'
    ? ELEVENLABS_VOICES.SOPHIE.voice_id
    : ELEVENLABS_VOICES.DAN.voice_id;
  const buffer = await this.generateSpeech(script, voiceId);
  const durationSeconds = Math.round((script.length / 150) * 60);
  return { buffer, durationSeconds, charactersUsed: script.length };
}

/**
 * Generate dual-host audio (Sophie + Dan interleaved).
 * Script format: lines prefixed with "SOPHIE:" or "DAN:"
 * Each line is generated separately then concatenated.
 */
async generateDualHostAudio(script: string): Promise<{
  buffer: Buffer;
  durationSeconds: number;
  charactersUsed: number;
}> {
  const lines = script.split('\n').filter(l => l.trim());
  const segments: Buffer[] = [];
  let totalChars = 0;

  for (const line of lines) {
    const isSophie = line.startsWith('SOPHIE:');
    const isDan = line.startsWith('DAN:');
    if (!isSophie && !isDan) continue;

    const text = line.replace(/^(SOPHIE|DAN):\s*/, '').trim();
    if (!text) continue;

    const voiceId = isSophie
      ? ELEVENLABS_VOICES.SOPHIE.voice_id
      : ELEVENLABS_VOICES.DAN.voice_id;
    const segment = await this.generateSpeech(text, voiceId);
    segments.push(segment);
    totalChars += text.length;
  }

  const combined = Buffer.concat(segments);
  return {
    buffer: combined,
    durationSeconds: Math.round((totalChars / 150) * 60),
    charactersUsed: totalChars,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/services/elevenlabs-service.ts
git commit -m "feat: update ElevenLabs voices to Sophie/Dan, add dual-host audio method"
```

---

## Chunk 2: Core Generation Pipeline (Stages 0–4)

### Task 4: Job Manager Utility

**Files:**
- Create: `lib/pipeline/job-manager.ts`

This is the single place that reads/writes `course_generation_jobs` and `generation_logs`. Every stage calls it.

- [ ] **Step 1: Write job manager**

`lib/pipeline/job-manager.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export type JobStatus =
  | 'queued' | 'planning' | 'generating' | 'media'
  | 'uploading' | 'validating' | 'complete' | 'failed' | 'partial_failed';

export interface JobInput {
  courseTitle: string;
  difficulty?: string;
  targetAudience?: string;
  tone?: string;
  maxModules?: number;
  maxLessonsPerModule?: number;
  sourceUrls?: string[];
}

export const JobManager = {
  async create(courseId: string, input: JobInput): Promise<string> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('course_generation_jobs')
      .insert({
        course_id: courseId,
        status: 'queued',
        current_stage: 'queued',
        input_params: input,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) throw new Error(`JobManager.create: ${error.message}`);
    return data.id;
  },

  async setStage(jobId: string, stage: string, status: JobStatus): Promise<void> {
    const supabase = getSupabase();
    await supabase
      .from('course_generation_jobs')
      .update({ current_stage: stage, status, updated_at: new Date().toISOString() })
      .eq('id', jobId);
  },

  async markStageComplete(jobId: string, stage: string): Promise<void> {
    const supabase = getSupabase();
    await supabase.rpc('append_stage_completed', { job_id: jobId, stage_name: stage });
  },

  async markJobComplete(jobId: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
      .from('course_generation_jobs')
      .update({ status: 'complete', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', jobId);
  },

  async markJobFailed(jobId: string, stage: string, error: string): Promise<void> {
    const supabase = getSupabase();
    await supabase.from('course_generation_jobs').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_log: supabase.rpc('append_json_error', { job_id: jobId, stage, error }),
    }).eq('id', jobId);
  },

  async log(jobId: string, stage: string, status: 'started' | 'completed' | 'failed' | 'skipped', details?: object, error?: string, durationMs?: number): Promise<void> {
    const supabase = getSupabase();
    await supabase.from('generation_logs').insert({
      job_id: jobId,
      stage,
      status,
      details: details ?? {},
      error: error ?? null,
      duration_ms: durationMs ?? null,
    });
  },
};
```

- [ ] **Step 2: Add Supabase helper RPC (SQL)**

Add to migration or run manually:
```sql
-- Append to stages_completed array atomically
CREATE OR REPLACE FUNCTION append_stage_completed(job_id UUID, stage_name TEXT)
RETURNS VOID LANGUAGE SQL AS $$
  UPDATE course_generation_jobs
  SET stages_completed = array_append(stages_completed, stage_name),
      updated_at = NOW()
  WHERE id = job_id;
$$;
```

- [ ] **Step 3: Commit**

```bash
git add lib/pipeline/job-manager.ts
git commit -m "feat: add JobManager utility for pipeline stage tracking"
```

---

### Task 5: Stage 1 — Course Planning Agent

**Files:**
- Create: `lib/pipeline/stages/01-plan-course.ts`

Builds on existing `BaseAgentV2` from `lib/ai/agent-system-v2.ts`.

- [ ] **Step 1: Write planning stage**

`lib/pipeline/stages/01-plan-course.ts`:
```typescript
import { JobManager } from '../job-manager';
import { createClient } from '@supabase/supabase-js';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const STAGE = 'plan_course';

export interface CoursePlan {
  title: string;
  subtitle: string;
  description: string;
  targetLearner: string;
  learningOutcomes: string[];
  estimatedTotalMinutes: number;
  modules: Array<{
    title: string;
    description: string;
    estimatedMinutes: number;
    lessonTitles: string[];
  }>;
}

async function callGemini(prompt: string): Promise<CoursePlan> {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return JSON.parse(text);
}

export async function planCourse(
  jobId: string,
  courseTitle: string,
  options: {
    difficulty?: string;
    targetAudience?: string;
    tone?: string;
    maxModules?: number;
    maxLessonsPerModule?: number;
  }
): Promise<CoursePlan> {
  const t0 = Date.now();
  await JobManager.log(jobId, STAGE, 'started');
  await JobManager.setStage(jobId, STAGE, 'planning');

  const prompt = `
You are an expert instructional designer for AI Bytes Learning, a UK-based micro-learning platform.

Design a complete course blueprint for: "${courseTitle}"

Constraints:
- Difficulty: ${options.difficulty ?? 'beginner'}
- Target audience: ${options.targetAudience ?? 'working professionals'}
- Tone: ${options.tone ?? 'clear, practical, British English'}
- Max modules: ${options.maxModules ?? 5}
- Max lessons per module: ${options.maxLessonsPerModule ?? 4}
- Each lesson: 5–8 minutes to complete
- Use UK English spelling (colour, behaviour, etc.)

Return JSON matching this exact schema:
{
  "title": string,
  "subtitle": string (one sentence),
  "description": string (2–3 sentences, benefit-focused),
  "targetLearner": string,
  "learningOutcomes": string[] (4–6 bullet points, each starting with an action verb),
  "estimatedTotalMinutes": number,
  "modules": [
    {
      "title": string,
      "description": string,
      "estimatedMinutes": number,
      "lessonTitles": string[]
    }
  ]
}
`;

  const plan = await callGemini(prompt);

  await JobManager.log(jobId, STAGE, 'completed', { moduleCount: plan.modules.length }, undefined, Date.now() - t0);
  await JobManager.markStageComplete(jobId, STAGE);

  return plan;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/pipeline/stages/01-plan-course.ts
git commit -m "feat: add Stage 1 — course planning agent"
```

---

### Task 6: Stage 2 — Create Course Shell in Supabase

**Files:**
- Create: `lib/pipeline/stages/02-create-course-shell.ts`

Takes the plan from Stage 1 and writes all `courses`, `course_topics`, `course_lessons` records.

- [ ] **Step 1: Write shell creation stage**

`lib/pipeline/stages/02-create-course-shell.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { JobManager } from '../job-manager';
import type { CoursePlan } from './01-plan-course';

const STAGE = 'create_course_shell';

export interface CourseShell {
  courseId: string;
  modules: Array<{
    moduleId: string;
    title: string;
    lessons: Array<{ lessonId: string; title: string }>;
  }>;
}

export async function createCourseShell(
  jobId: string,
  plan: CoursePlan,
  existingCourseId?: string
): Promise<CourseShell> {
  const t0 = Date.now();
  await JobManager.log(jobId, STAGE, 'started');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let courseId = existingCourseId;

  if (!courseId) {
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: plan.title,
        description: plan.description,
        difficulty_level: 'beginner',
        published: false,
      })
      .select('id')
      .single();
    if (courseError) throw new Error(`createCourseShell: ${courseError.message}`);
    courseId = course.id;
  }

  const modules: CourseShell['modules'] = [];

  for (let mi = 0; mi < plan.modules.length; mi++) {
    const mod = plan.modules[mi];
    const { data: topic, error: topicError } = await supabase
      .from('course_topics')
      .insert({
        course_id: courseId,
        title: mod.title,
        introduction: mod.description,
        position: mi + 1,
      })
      .select('id')
      .single();
    if (topicError) throw new Error(`createCourseShell topic: ${topicError.message}`);

    const lessons: Array<{ lessonId: string; title: string }> = [];

    for (let li = 0; li < mod.lessonTitles.length; li++) {
      const { data: lesson, error: lessonError } = await supabase
        .from('course_lessons')
        .insert({
          topic_id: topic.id,
          title: mod.lessonTitles[li],
          content_markdown: '', // filled in Stage 3
          position: li + 1,
        })
        .select('id')
        .single();
      if (lessonError) throw new Error(`createCourseShell lesson: ${lessonError.message}`);
      lessons.push({ lessonId: lesson.id, title: mod.lessonTitles[li] });
    }

    modules.push({ moduleId: topic.id, title: mod.title, lessons });
  }

  // Attach courseId to the job
  await supabase
    .from('course_generation_jobs')
    .update({ course_id: courseId, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  await JobManager.log(jobId, STAGE, 'completed', { courseId, moduleCount: modules.length }, undefined, Date.now() - t0);
  await JobManager.markStageComplete(jobId, STAGE);

  return { courseId: courseId!, modules };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/pipeline/stages/02-create-course-shell.ts
git commit -m "feat: add Stage 2 — create course shell (courses/topics/lessons)"
```

---

### Task 7: Stage 3 — Lesson Content Generator

**Files:**
- Create: `lib/pipeline/stages/03-generate-lessons.ts`

Generates full structured content for each lesson and saves `lesson_sections`.

- [ ] **Step 1: Write lesson generator**

`lib/pipeline/stages/03-generate-lessons.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { JobManager } from '../job-manager';
import type { CourseShell } from './02-create-course-shell';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const STAGE = 'generate_lessons';

interface LessonContent {
  lessonObjective: string;
  sections: Array<{
    sectionType: 'intro' | 'concept' | 'example' | 'comparison' | 'action_step' | 'key_takeaway';
    content: string;
  }>;
  estimatedDurationMinutes: number;
  actionStep: string;
  keyTakeaway: string;
}

async function generateLessonContent(
  lessonTitle: string,
  moduleName: string,
  courseTitle: string,
  difficulty: string
): Promise<LessonContent> {
  const prompt = `
You are an expert educator writing for AI Bytes Learning, a UK micro-learning platform.

Course: "${courseTitle}"
Module: "${moduleName}"
Lesson: "${lessonTitle}"
Difficulty: ${difficulty}

Write a complete lesson in UK English. Each section should be 2–4 paragraphs.

Return JSON:
{
  "lessonObjective": "By the end of this lesson, the learner will be able to...",
  "sections": [
    { "sectionType": "intro", "content": "..." },
    { "sectionType": "concept", "content": "..." },
    { "sectionType": "example", "content": "..." },
    { "sectionType": "comparison", "content": "..." },
    { "sectionType": "action_step", "content": "..." },
    { "sectionType": "key_takeaway", "content": "..." }
  ],
  "estimatedDurationMinutes": 6,
  "actionStep": "One concrete thing the learner should do right now",
  "keyTakeaway": "The single most important thing to remember"
}
`;

  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return JSON.parse(text);
}

export async function generateLessons(
  jobId: string,
  shell: CourseShell,
  courseTitle: string,
  difficulty = 'beginner'
): Promise<void> {
  const t0 = Date.now();
  await JobManager.log(jobId, STAGE, 'started');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const module of shell.modules) {
    for (const lesson of module.lessons) {
      const content = await generateLessonContent(
        lesson.title,
        module.title,
        courseTitle,
        difficulty
      );

      // Update lesson record with objective/action/takeaway
      await supabase.from('course_lessons').update({
        lesson_objective: content.lessonObjective,
        action_step: content.actionStep,
        key_takeaway: content.keyTakeaway,
        estimated_duration_minutes: content.estimatedDurationMinutes,
        content_markdown: content.sections.map(s => s.content).join('\n\n'),
      }).eq('id', lesson.lessonId);

      // Insert lesson_sections
      const sectionRows = content.sections.map((s, i) => ({
        lesson_id: lesson.lessonId,
        section_type: s.sectionType,
        content: s.content,
        sort_order: i,
      }));
      await supabase.from('lesson_sections').insert(sectionRows);
    }
  }

  await JobManager.log(jobId, STAGE, 'completed', {}, undefined, Date.now() - t0);
  await JobManager.markStageComplete(jobId, STAGE);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/pipeline/stages/03-generate-lessons.ts
git commit -m "feat: add Stage 3 — lesson content generator with section storage"
```

---

### Task 8: Stage 4 — Assessment Generator

**Files:**
- Create: `lib/pipeline/stages/04-generate-assessments.ts`

Generates 1–3 quiz questions per lesson. Uses existing `course_quizzes` + `course_quiz_questions` tables.

- [ ] **Step 1: Write assessment generator**

`lib/pipeline/stages/04-generate-assessments.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { JobManager } from '../job-manager';
import type { CourseShell } from './02-create-course-shell';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const STAGE = 'generate_assessments';

interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

async function generateQuestions(
  lessonTitle: string,
  keyTakeaway: string,
  count: number
): Promise<QuizQuestion[]> {
  const prompt = `
Generate ${count} multiple-choice quiz questions for a UK micro-learning lesson titled:
"${lessonTitle}"

Key takeaway from the lesson: "${keyTakeaway}"

Rules:
- Each question has exactly 4 options
- One correct answer
- Explanation is 1–2 sentences (UK English)
- Questions test understanding, not memorisation

Return JSON array:
[
  {
    "questionText": "...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "..."
  }
]
`;

  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  return JSON.parse(text);
}

export async function generateAssessments(
  jobId: string,
  shell: CourseShell
): Promise<void> {
  const t0 = Date.now();
  await JobManager.log(jobId, STAGE, 'started');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const module of shell.modules) {
    for (const lesson of module.lessons) {
      // Fetch lesson key_takeaway for context
      const { data: lessonData } = await supabase
        .from('course_lessons')
        .select('key_takeaway')
        .eq('id', lesson.lessonId)
        .single();

      const questions = await generateQuestions(
        lesson.title,
        lessonData?.key_takeaway ?? '',
        2
      );

      // Create a quiz for this lesson's topic (module-level quiz)
      const { data: quiz, error: quizError } = await supabase
        .from('course_quizzes')
        .insert({
          topic_id: module.moduleId,
          title: `${lesson.title} — Check Your Understanding`,
        })
        .select('id')
        .single();
      if (quizError) throw new Error(`generateAssessments quiz: ${quizError.message}`);

      const questionRows = questions.map((q, i) => ({
        quiz_id: quiz.id,
        question_text: q.questionText,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
        position: i + 1,
      }));
      await supabase.from('course_quiz_questions').insert(questionRows);
    }
  }

  await JobManager.log(jobId, STAGE, 'completed', {}, undefined, Date.now() - t0);
  await JobManager.markStageComplete(jobId, STAGE);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/pipeline/stages/04-generate-assessments.ts
git commit -m "feat: add Stage 4 — assessment generator (quiz questions per lesson)"
```

---

## Chunk 3: Media Pipeline (Stages 7–12)

### Task 9: Stage 7 — Media Script Generator

**Files:**
- Create: `lib/pipeline/stages/07-generate-media-scripts.ts`

Generates all audio scripts (4 types) using Gemini. No audio generated yet — just scripts saved to DB or returned.

- [ ] **Step 1: Write script generator**

`lib/pipeline/stages/07-generate-media-scripts.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { JobManager } from '../job-manager';
import type { CourseShell } from './02-create-course-shell';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const STAGE = 'generate_media_scripts';

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, responseMimeType: 'text/plain' },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export interface MediaScripts {
  lessonIntroScript: string;    // Sophie, 30–60 s
  lessonRecapScript: string;    // Sophie, 45–90 s
}

export interface ModuleScripts {
  moduleOverviewScript: string;    // Sophie, 2–4 min
  deepDiveScript: string;          // Sophie + Dan (SOPHIE:/DAN: prefixed lines), 3–6 min
}

export async function generateMediaScripts(
  jobId: string,
  shell: CourseShell,
  courseTitle: string
): Promise<void> {
  const t0 = Date.now();
  await JobManager.log(jobId, STAGE, 'started');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Generate lesson-level scripts
  for (const module of shell.modules) {
    for (const lesson of module.lessons) {
      const { data: lessonData } = await supabase
        .from('course_lessons')
        .select('lesson_objective, key_takeaway, action_step')
        .eq('id', lesson.lessonId)
        .single();

      const introScript = await callGemini(`
You are Sophie, a warm British female narrator for AI Bytes Learning.
Write a 30–60 second lesson intro script (UK English, spoken naturally).

Lesson: "${lesson.title}" (part of module: "${module.title}", course: "${courseTitle}")
Objective: ${lessonData?.lesson_objective ?? ''}

Cover:
1. What this lesson is about
2. Why it matters
3. What to pay attention to

Speak naturally. No stage directions. No "Hello!" opener.
`);

      const recapScript = await callGemini(`
You are Sophie, a warm British female narrator for AI Bytes Learning.
Write a 45–90 second lesson recap script (UK English, spoken naturally).

Lesson: "${lesson.title}"
Key takeaway: ${lessonData?.key_takeaway ?? ''}
Action step: ${lessonData?.action_step ?? ''}

Cover:
1. The key idea from this lesson
2. A practical reminder
3. What to carry forward

Speak naturally. No stage directions.
`);

      // Store scripts in media_assets as pending records
      await supabase.from('media_assets').insert([
        {
          course_id: shell.courseId,
          module_id: module.moduleId,
          lesson_id: lesson.lessonId,
          media_type: 'lesson_intro_audio',
          title: 'Lesson Audio Companion',
          placement: 'lesson_top',
          voice_mode: 'sophie',
          transcript: introScript,
          is_optional: true,
          sort_order: 1,
          generation_status: 'pending',
        },
        {
          course_id: shell.courseId,
          module_id: module.moduleId,
          lesson_id: lesson.lessonId,
          media_type: 'lesson_recap_audio',
          title: 'Quick Lesson Recap',
          placement: 'lesson_bottom',
          voice_mode: 'sophie',
          transcript: recapScript,
          is_optional: true,
          sort_order: 2,
          generation_status: 'pending',
        },
      ]);
    }

    // Module-level scripts
    const { data: moduleLessons } = await supabase
      .from('course_lessons')
      .select('title, key_takeaway')
      .eq('topic_id', module.moduleId)
      .order('position');

    const lessonSummary = (moduleLessons ?? [])
      .map(l => `- ${l.title}: ${l.key_takeaway}`)
      .join('\n');

    const moduleOverviewScript = await callGemini(`
You are Sophie, a warm British female narrator for AI Bytes Learning.
Write a 2–4 minute module overview script (UK English, spoken naturally).

Module: "${module.title}" in course: "${courseTitle}"
Lessons covered:
${lessonSummary}

Cover:
1. What this module is about
2. The major concepts
3. What the learner will be able to do by the end

Speak conversationally. No stage directions.
`);

    const deepDiveScript = await callGemini(`
You are writing a 3–6 minute discussion between two British AI educators for AI Bytes Learning.
Sophie (female) and Dan (male) are discussing: "${module.title}"
Context: ${courseTitle}

Format EVERY line as either:
SOPHIE: [what Sophie says]
DAN: [what Dan says]

Cover:
- Core concept exploration
- A practical example
- A common misunderstanding learners have
- Applied use cases

Keep it natural and conversational. No introductions like "Welcome everyone".
`);

    await supabase.from('media_assets').insert([
      {
        course_id: shell.courseId,
        module_id: module.moduleId,
        media_type: 'module_overview_audio',
        title: 'Module Overview Audio',
        placement: 'module_top',
        voice_mode: 'sophie',
        transcript: moduleOverviewScript,
        is_optional: false,
        sort_order: 1,
        generation_status: 'pending',
      },
      {
        course_id: shell.courseId,
        module_id: module.moduleId,
        media_type: 'module_deep_dive_audio',
        title: 'Deep Dive Discussion',
        placement: 'module_resources',
        voice_mode: 'sophie_dan',
        transcript: deepDiveScript,
        is_optional: false,
        sort_order: 2,
        generation_status: 'pending',
      },
    ]);
  }

  await JobManager.log(jobId, STAGE, 'completed', {}, undefined, Date.now() - t0);
  await JobManager.markStageComplete(jobId, STAGE);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/pipeline/stages/07-generate-media-scripts.ts
git commit -m "feat: add Stage 7 — media script generator (all 4 script types)"
```

---

### Task 10: Stage 8 — ElevenLabs Audio Generator

**Files:**
- Create: `lib/pipeline/stages/08-generate-audio.ts`

Reads pending `media_assets`, generates MP3 via ElevenLabs, uploads to R2, updates records.

- [ ] **Step 1: Write audio generation stage**

`lib/pipeline/stages/08-generate-audio.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { JobManager } from '../job-manager';
import { elevenLabsService } from '@/lib/services/elevenlabs-service';
import { uploadToR2, r2Keys } from '@/lib/storage/r2-upload';

const STAGE = 'generate_audio';

export async function generateAudio(
  jobId: string,
  courseId: string
): Promise<void> {
  const t0 = Date.now();
  await JobManager.log(jobId, STAGE, 'started');
  await JobManager.setStage(jobId, STAGE, 'media');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all pending audio assets for this course
  const { data: pendingAssets, error } = await supabase
    .from('media_assets')
    .select('*')
    .eq('course_id', courseId)
    .eq('generation_status', 'pending')
    .in('media_type', ['lesson_intro_audio', 'lesson_recap_audio', 'module_overview_audio', 'module_deep_dive_audio']);

  if (error) throw new Error(`generateAudio fetch: ${error.message}`);
  if (!pendingAssets?.length) {
    await JobManager.log(jobId, STAGE, 'skipped', { reason: 'no pending audio assets' });
    return;
  }

  // Check ElevenLabs quota before starting
  const totalChars = pendingAssets.reduce((sum, a) => sum + (a.transcript?.length ?? 0), 0);
  const quotaCheck = await elevenLabsService.checkQuotaSufficient(totalChars);
  if (!quotaCheck.sufficient) {
    throw new Error(`ElevenLabs quota insufficient: ${quotaCheck.warning}`);
  }

  for (const asset of pendingAssets) {
    if (!asset.transcript) continue;

    // Mark as generating
    await supabase.from('media_assets')
      .update({ generation_status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', asset.id);

    try {
      let audioBuffer: Buffer;
      let durationSeconds: number;

      if (asset.voice_mode === 'sophie_dan') {
        const result = await elevenLabsService.generateDualHostAudio(asset.transcript);
        audioBuffer = result.buffer;
        durationSeconds = result.durationSeconds;
      } else {
        const voice = asset.voice_mode === 'dan' ? 'dan' : 'sophie';
        const result = await elevenLabsService.generateMonoAudio(asset.transcript, voice);
        audioBuffer = result.buffer;
        durationSeconds = result.durationSeconds;
      }

      // Determine R2 key
      let r2Key: string;
      if (asset.media_type === 'lesson_intro_audio') {
        r2Key = r2Keys.lessonIntroAudio(courseId, asset.module_id, asset.lesson_id);
      } else if (asset.media_type === 'lesson_recap_audio') {
        r2Key = r2Keys.lessonRecapAudio(courseId, asset.module_id, asset.lesson_id);
      } else if (asset.media_type === 'module_overview_audio') {
        r2Key = r2Keys.moduleOverviewAudio(courseId, asset.module_id);
      } else {
        r2Key = r2Keys.moduleDeepDiveAudio(courseId, asset.module_id);
      }

      const { publicUrl } = await uploadToR2(audioBuffer, r2Key, 'audio/mpeg');

      // Save transcript JSON to R2
      const transcriptKey = r2Key.replace('.mp3', '-transcript.json');
      const transcriptBuf = Buffer.from(JSON.stringify({ text: asset.transcript }), 'utf-8');
      const { publicUrl: transcriptUrl } = await uploadToR2(transcriptBuf, transcriptKey, 'application/json');

      await supabase.from('media_assets').update({
        r2_key: r2Key,
        public_url: publicUrl,
        transcript_url: transcriptUrl,
        duration_seconds: durationSeconds,
        generation_status: 'complete',
        is_published: true,
        updated_at: new Date().toISOString(),
      }).eq('id', asset.id);

    } catch (err: any) {
      await supabase.from('media_assets').update({
        generation_status: 'failed',
        error_message: err.message,
        updated_at: new Date().toISOString(),
      }).eq('id', asset.id);
      // Log but don't abort — try remaining assets
      await JobManager.log(jobId, STAGE, 'failed', { assetId: asset.id }, err.message);
    }
  }

  await JobManager.log(jobId, STAGE, 'completed', { assetCount: pendingAssets.length }, undefined, Date.now() - t0);
  await JobManager.markStageComplete(jobId, STAGE);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/pipeline/stages/08-generate-audio.ts
git commit -m "feat: add Stage 8 — ElevenLabs audio generation with R2 upload"
```

---

## Chunk 4: Orchestrator, API, and Validation

### Task 11: Master Orchestrator

**Files:**
- Create: `lib/pipeline/orchestrator.ts`

Runs all stages in order. Each stage is independently retryable.

- [ ] **Step 1: Write orchestrator**

`lib/pipeline/orchestrator.ts`:
```typescript
import { JobManager, type JobInput } from './job-manager';
import { planCourse } from './stages/01-plan-course';
import { createCourseShell } from './stages/02-create-course-shell';
import { generateLessons } from './stages/03-generate-lessons';
import { generateAssessments } from './stages/04-generate-assessments';
import { generateMediaScripts } from './stages/07-generate-media-scripts';
import { generateAudio } from './stages/08-generate-audio';

export async function runCourseGenerationPipeline(input: JobInput): Promise<{
  jobId: string;
  courseId: string;
}> {
  // Stage 0: create the job
  const jobId = await JobManager.create('', input); // courseId attached in stage 2

  try {
    // Stage 1: plan
    const plan = await planCourse(jobId, input.courseTitle, {
      difficulty: input.difficulty,
      targetAudience: input.targetAudience,
      tone: input.tone,
      maxModules: input.maxModules,
      maxLessonsPerModule: input.maxLessonsPerModule,
    });

    // Stage 2: shell
    const shell = await createCourseShell(jobId, plan);

    // Stage 3: lesson content
    await generateLessons(jobId, shell, input.courseTitle, input.difficulty);

    // Stage 4: assessments
    await generateAssessments(jobId, shell);

    // Stage 7: media scripts
    await generateMediaScripts(jobId, shell, input.courseTitle);

    // Stage 8: audio
    await generateAudio(jobId, shell.courseId);

    // Mark complete
    await JobManager.markJobComplete(jobId);

    return { jobId, courseId: shell.courseId };
  } catch (err: any) {
    await JobManager.markJobFailed(jobId, 'unknown', err.message);
    throw err;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/pipeline/orchestrator.ts
git commit -m "feat: add pipeline orchestrator — runs all stages 1→8"
```

---

### Task 12: API Route — Trigger Generation

**Files:**
- Create: `app/api/pipeline/generate/route.ts`

New clean entry point. Does NOT replace existing generate-v2 route (leave that intact for backward compat).

- [ ] **Step 1: Write API route**

`app/api/pipeline/generate/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runCourseGenerationPipeline } from '@/lib/pipeline/orchestrator';
import type { JobInput } from '@/lib/pipeline/job-manager';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.courseTitle?.trim()) {
      return NextResponse.json({ error: 'courseTitle is required' }, { status: 400 });
    }

    const input: JobInput = {
      courseTitle: body.courseTitle.trim(),
      difficulty: body.difficulty ?? 'beginner',
      targetAudience: body.targetAudience ?? 'working professionals',
      tone: body.tone ?? 'clear, practical, British English',
      maxModules: Math.min(body.maxModules ?? 4, 6),
      maxLessonsPerModule: Math.min(body.maxLessonsPerModule ?? 3, 5),
      sourceUrls: body.sourceUrls ?? [],
    };

    // Run pipeline (long-running — in production move to background queue)
    const result = await runCourseGenerationPipeline(input);

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      courseId: result.courseId,
    });
  } catch (err: any) {
    console.error('[pipeline/generate] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test the route**

```bash
curl -X POST http://localhost:3000/api/pipeline/generate \
  -H "Content-Type: application/json" \
  -d '{
    "courseTitle": "Introduction to Prompt Engineering",
    "difficulty": "beginner",
    "maxModules": 2,
    "maxLessonsPerModule": 2
  }'
```

Expected: `{ "success": true, "jobId": "...", "courseId": "..." }`

- [ ] **Step 3: Commit**

```bash
git add app/api/pipeline/generate/route.ts
git commit -m "feat: add /api/pipeline/generate route — clean entry point for new pipeline"
```

---

### Task 13: Stage 14 — Validation

**Files:**
- Create: `lib/pipeline/stages/14-validate-course.ts`

Runs all required checks before publish.

- [ ] **Step 1: Write validator**

`lib/pipeline/stages/14-validate-course.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { JobManager } from '../job-manager';

const STAGE = 'validate_course';

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateCourse(
  jobId: string,
  courseId: string
): Promise<ValidationResult> {
  const t0 = Date.now();
  await JobManager.log(jobId, STAGE, 'started');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check course exists
  const { data: course } = await supabase.from('courses').select('id,title').eq('id', courseId).single();
  if (!course) errors.push('Course record not found');

  // Check modules exist
  const { data: modules } = await supabase.from('course_topics').select('id').eq('course_id', courseId);
  if (!modules?.length) errors.push('No modules found');

  // Check every module has lessons
  for (const mod of modules ?? []) {
    const { data: lessons } = await supabase.from('course_lessons').select('id,key_takeaway,action_step').eq('topic_id', mod.id);
    if (!lessons?.length) errors.push(`Module ${mod.id}: no lessons`);
    for (const lesson of lessons ?? []) {
      if (!lesson.key_takeaway) warnings.push(`Lesson ${lesson.id}: missing key_takeaway`);
      if (!lesson.action_step) warnings.push(`Lesson ${lesson.id}: missing action_step`);
    }
  }

  // Check audio assets are complete
  const { data: audioAssets } = await supabase
    .from('media_assets')
    .select('id,media_type,generation_status,public_url')
    .eq('course_id', courseId)
    .in('media_type', ['lesson_intro_audio', 'lesson_recap_audio', 'module_overview_audio', 'module_deep_dive_audio']);

  for (const asset of audioAssets ?? []) {
    if (asset.generation_status === 'failed') {
      warnings.push(`Audio asset ${asset.media_type} (${asset.id}) failed — will be missing in learner UI`);
    }
    if (asset.generation_status === 'complete' && !asset.public_url) {
      errors.push(`Audio asset ${asset.id} marked complete but has no public_url`);
    }
  }

  const passed = errors.length === 0;
  await JobManager.log(jobId, STAGE, passed ? 'completed' : 'failed', { errors, warnings }, passed ? undefined : errors.join('; '), Date.now() - t0);
  if (passed) await JobManager.markStageComplete(jobId, STAGE);

  return { passed, errors, warnings };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/pipeline/stages/14-validate-course.ts
git commit -m "feat: add Stage 14 — course validation before publish"
```

---

## Chunk 5: Learner UI Updates

### Task 14: Lesson Page — Audio Companion Cards

**Files:**
- Modify: `app/courses/[courseId]/lessons/[lessonId]/page.tsx`

Add `LessonAudioCard` at the top (intro) and bottom (recap) of the lesson.

- [ ] **Step 1: Create LessonAudioCard component**

`components/course/lesson-audio-card.tsx`:
```tsx
"use client";

import { useState, useRef } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

interface LessonAudioCardProps {
  title: string;          // "Lesson Audio Companion" | "Quick Lesson Recap"
  subtitle: string;       // "Listen before you start" | "Prefer listening?"
  audioUrl: string;
  durationSeconds: number;
  transcriptUrl?: string;
}

export function LessonAudioCard({ title, subtitle, audioUrl, durationSeconds, transcriptUrl }: LessonAudioCardProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] my-6">
      <button
        onClick={toggle}
        className="shrink-0 w-10 h-10 rounded-full bg-[#00d3f2] hover:bg-[#00b8d4] flex items-center justify-center transition-colors"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 text-black fill-black" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm">{title}</p>
        <p className="text-white/45 text-xs">{subtitle} · {formatTime(durationSeconds)}</p>
      </div>
      <Volume2 className="w-4 h-4 text-white/25 shrink-0" />
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setPlaying(false)}
        preload="none"
      />
    </div>
  );
}
```

- [ ] **Step 2: Query media_assets in lesson page server component**

In `app/courses/[courseId]/lessons/[lessonId]/page.tsx`, fetch lesson audio:

```typescript
// Add after existing lesson query:
const { data: audioAssets } = await supabase
  .from('media_assets')
  .select('media_type, title, public_url, duration_seconds, transcript_url')
  .eq('lesson_id', lessonId)
  .eq('is_published', true)
  .eq('generation_status', 'complete');

const introAudio = audioAssets?.find(a => a.media_type === 'lesson_intro_audio');
const recapAudio = audioAssets?.find(a => a.media_type === 'lesson_recap_audio');
```

- [ ] **Step 3: Add audio cards in JSX**

After the lesson summary (top):
```tsx
{introAudio?.public_url && (
  <LessonAudioCard
    title="Lesson Audio Companion"
    subtitle="Listen to a short explanation before you start"
    audioUrl={introAudio.public_url}
    durationSeconds={introAudio.duration_seconds ?? 45}
    transcriptUrl={introAudio.transcript_url ?? undefined}
  />
)}
```

After action step (bottom):
```tsx
{recapAudio?.public_url && (
  <LessonAudioCard
    title="Quick Lesson Recap"
    subtitle="Prefer listening? Here's the key idea in under a minute"
    audioUrl={recapAudio.public_url}
    durationSeconds={recapAudio.duration_seconds ?? 60}
    transcriptUrl={recapAudio.transcript_url ?? undefined}
  />
)}
```

- [ ] **Step 4: Commit**

```bash
git add components/course/lesson-audio-card.tsx app/courses/
git commit -m "feat: add lesson audio companion cards (intro + recap) to lesson page"
```

---

### Task 15: Module Page — Audio Resources Section

**Files:**
- Modify: `app/courses/[courseId]/topics/[topicId]/page.tsx`

Add a "Module Resources" section with overview audio and deep-dive discussion.

- [ ] **Step 1: Fetch module audio in server component**

```typescript
const { data: moduleAudio } = await supabase
  .from('media_assets')
  .select('media_type, title, public_url, duration_seconds, transcript_url')
  .eq('module_id', topicId)
  .eq('is_published', true)
  .eq('generation_status', 'complete')
  .in('media_type', ['module_overview_audio', 'module_deep_dive_audio', 'module_overview_video'])
  .order('sort_order');
```

- [ ] **Step 2: Render module resources section**

```tsx
{moduleAudio && moduleAudio.length > 0 && (
  <div className="mb-10">
    <h2 className="font-bold text-white text-xl mb-4">Module Resources</h2>
    <div className="space-y-3">
      {moduleAudio.map(asset => (
        <LessonAudioCard
          key={asset.media_type}
          title={asset.title}
          subtitle={
            asset.media_type === 'module_overview_audio'
              ? 'A guided overview of this module'
              : 'Sophie & Dan explore the key ideas'
          }
          audioUrl={asset.public_url}
          durationSeconds={asset.duration_seconds ?? 120}
          transcriptUrl={asset.transcript_url ?? undefined}
        />
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add app/courses/
git commit -m "feat: add module resources section with audio on module page"
```

---

## Chunk 6: Admin & Environment

### Task 16: Admin Trigger UI

**Files:**
- Modify: `app/admin/courses/new/page.tsx`

Replace current "Generate Course" form with a call to the new pipeline endpoint.

- [ ] **Step 1: Update generate handler**

```typescript
const handleGenerate = async () => {
  setGenerating(true);
  try {
    const res = await fetch('/api/pipeline/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseTitle: title.trim(),
        difficulty,
        targetAudience,
        maxModules: 4,
        maxLessonsPerModule: 3,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    router.push(`/admin/courses/edit/${data.courseId}?generated=true`);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setGenerating(false);
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/courses/new/page.tsx
git commit -m "feat: wire admin course creation to new pipeline endpoint"
```

---

### Task 17: Environment & .env.example

**Files:**
- Modify: `.env.local` (your copy — never commit secrets)
- Create: `.env.example` (commit this)

- [ ] **Step 1: Create `.env.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GEMINI_API_KEY=

# ElevenLabs — Sophie + Dan
ELEVENLABS_API_KEY=
ELEVENLABS_SOPHIE_VOICE_ID=khYwAWwYSjlxlcrwGQ16
ELEVENLABS_DAN_VOICE_ID=DvhK1yIWv9GpUpAD6dsU

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=aibytes-media
R2_PUBLIC_URL=https://media.aibytes.com

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add .env.example with all required environment variables"
```

---

## NotebookLM — Clarification for Implementers

> **NotebookLM has no public API.** The enrichment stages (5, 6) from the spec cannot be automated. The Gemini model handles all enrichment automatically in this plan.
>
> **Optional manual workflow:** An admin can export module source packs (generated in Stage 5 as markdown files) and upload them to NotebookLM manually for quality review. Any improved summaries or discussion points can be manually imported back via the admin interface. This is a human-in-the-loop quality step, not an automated stage.

---

## Execution Order

```
Chunk 1: Schema & Infrastructure (Tasks 1–3)   → prerequisite for everything
Chunk 2: Core Generation (Tasks 4–8)            → depends on Chunk 1
Chunk 3: Media Pipeline (Tasks 9–10)            → depends on Chunk 2
Chunk 4: Orchestrator + API + Validation        → depends on Chunks 2–3
Chunk 5: Learner UI                             → depends on Chunk 3
Chunk 6: Admin + Env                            → can run in parallel with Chunk 5
```

---

## Testing Each Stage Independently

Each stage exports a named function. Test any stage in isolation:

```typescript
// scripts/test-stage-03.ts
import { generateLessons } from '../lib/pipeline/stages/03-generate-lessons';
const mockShell = {
  courseId: 'existing-uuid',
  modules: [{ moduleId: 'mod-uuid', title: 'Test Module', lessons: [{ lessonId: 'lesson-uuid', title: 'Test Lesson' }] }]
};
await generateLessons('test-job-id', mockShell, 'Test Course');
```

---

Plan complete and saved to `plans/2026-03-14-course-generation-pipeline.md`. Ready to execute?

This is a substantial build — recommend executing Chunk 1 first (schema + R2 + ElevenLabs voices) as those are the foundations everything else depends on. Once those are verified working, Chunks 2–4 can be dispatched in parallel subagents.
