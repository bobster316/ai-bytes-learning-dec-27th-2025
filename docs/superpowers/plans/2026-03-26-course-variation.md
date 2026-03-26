# Course Variation System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every generated course a distinct visual identity and content personality via a `CourseDNA` object, so no two courses feel identical.

**Architecture:** A pure `generateCourseDNA()` function produces a deterministic DNA object from the course ID + title + difficulty. The `content` sub-object is injected into the generation prompt; the `render` sub-object is distributed to React components via `CourseDNAContext`. A DB migration adds `course_dna JSONB` and `dna_fingerprint TEXT` columns to the `courses` table.

**Tech Stack:** TypeScript strict mode, Next.js 16 App Router, React 19 context, Supabase JSONB, Zod validation, Node.js `crypto` (built-in)

**Spec:** `docs/superpowers/specs/2026-03-26-course-variation-design.md`

**Delivery split:**
- **Visual variation** (render DNA → frontend): fully delivered by this plan. Every existing and new course immediately gets distinct colours, typography, backgrounds, and layout rhythm.
- **Content personality variation** (content DNA → generation prompt): partially delivered. The prompt injection is wired into `LessonExpanderAgent` (v2), but the main generation route currently uses v1 `AgentOrchestrator`. Content personality will activate once the route is migrated to v2 (a separate plan).

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/types/course-upgrade.ts` | Modify | `CourseDNA` interface, `RawCourseDNA`, `CourseDNASchema` (Zod) |
| `lib/ai/course-dna-catalogue.ts` | Create | Raw archetype + palette data arrays — zero imports |
| `lib/ai/generate-course-dna.ts` | Create | `generateCourseDNA()`, `getCourseDNARender()`, `defaultRender` |
| `supabase/migrations/20260326_course_dna.sql` | Create | Add `course_dna` + `dna_fingerprint` columns |
| `lib/ai/agent-system-v2.ts` | Modify | `LessonExpanderAgent.expandLesson()` accepts optional `dna` param |
| `app/api/course/generate/route.ts` | Modify | Generate + persist DNA; pass `dna.content` through orchestrator |
| `components/course/course-dna-provider.tsx` | Create | `CourseDNAContext`, `CourseDNAProvider`, `useCourseDNA` hook |
| `app/courses/[courseId]/layout.tsx` | Create | Server Component — fetch DNA, render `<CourseDNAProvider>` |
| `components/course/block-renderer.tsx` | Modify | Remove `LessonVariantContext`; use `useCourseDNA()` instead |
| `components/course/lesson-progress-rail.tsx` | Modify | Remove `accent` prop; call `useCourseDNA()` internally |
| `components/course/course-background.tsx` | Create | Parameterised JSX background (dark_mesh / grain_texture / subtle_grid / clean_flat) |
| `components/course/SectionDivider.tsx` | Create | thin_rule / bold_number / dot_row from context |

---

## Task 1: Types + Zod Schema

**Files:**
- Modify: `lib/types/course-upgrade.ts`

- [ ] **Step 1: Add imports and types to `course-upgrade.ts`**

Open `lib/types/course-upgrade.ts`. Add `import { z } from "zod"` to the top of the file alongside the existing imports. Then append the following to the **end** of the file:

```typescript
// ─── CourseDNA ────────────────────────────────────────────────────────────────

export interface CourseDNA {
    dna_version: 1;
    content: {
        archetype_id:  string;
        writing_style: string;
        example_bias:  "real_world_first" | "theory_first" | "analogy_first";
        question_tone: "socratic" | "direct_challenge" | "reflective";
    };
    render: {
        palette_id:       string;
        primary_colour:   string;
        secondary_colour: string;
        surface_colour:   string;
        image_aesthetic:  "photorealistic" | "abstract_gradient" | "flat_illustration" | "technical_diagram";
        bg_treatment:     "dark_mesh" | "grain_texture" | "subtle_grid" | "clean_flat";
        typography:       "classic_serif" | "modern_sans" | "editorial_contrast";
        layout_density:   "tight" | "balanced" | "spacious";
        section_divider:  "thin_rule" | "bold_number" | "dot_row";
    };
}

/** Named alias — makes it explicit that DB column reads are `unknown` until validated */
export type RawCourseDNA = unknown;

/** Zod schema — mirrors CourseDNA exactly; z.literal(1) for future discriminated-union migration */
export const CourseDNASchema = z.object({
    dna_version: z.literal(1),
    content: z.object({
        archetype_id:  z.string(),
        writing_style: z.string(),
        example_bias:  z.enum(["real_world_first", "theory_first", "analogy_first"]),
        question_tone: z.enum(["socratic", "direct_challenge", "reflective"]),
    }),
    render: z.object({
        palette_id:       z.string(),
        primary_colour:   z.string(),
        secondary_colour: z.string(),
        surface_colour:   z.string(),
        image_aesthetic:  z.enum(["photorealistic", "abstract_gradient", "flat_illustration", "technical_diagram"]),
        bg_treatment:     z.enum(["dark_mesh", "grain_texture", "subtle_grid", "clean_flat"]),
        typography:       z.enum(["classic_serif", "modern_sans", "editorial_contrast"]),
        layout_density:   z.enum(["tight", "balanced", "spacious"]),
        section_divider:  z.enum(["thin_rule", "bold_number", "dot_row"]),
    }),
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types/course-upgrade.ts
git commit -m "feat: add CourseDNA interface, RawCourseDNA, and Zod schema"
```

---

## Task 2: DNA Catalogue

**Files:**
- Create: `lib/ai/course-dna-catalogue.ts`

This file has **zero imports**. Pure data only.

- [ ] **Step 1: Create the catalogue file**

```typescript
// lib/ai/course-dna-catalogue.ts
// Pure data — no imports. Single source of truth for all archetype + palette values.

export const ARCHETYPES = [
    { id: "clinical",     label: "Clinical",     writingStyle: "Precise, evidence-first, no filler words.",               layoutDensity: "spacious" as const, sectionDivider: "thin_rule"   as const },
    { id: "bold",         label: "Bold",         writingStyle: "Punchy and declarative. Short paragraphs only.",           layoutDensity: "tight"    as const, sectionDivider: "bold_number" as const },
    { id: "warm",         label: "Warm",         writingStyle: "Encouraging and analogy-rich. Conversational tone.",       layoutDensity: "balanced" as const, sectionDivider: "dot_row"     as const },
    { id: "futuristic",   label: "Futuristic",   writingStyle: "Forward-looking and system-level. Think in abstractions.", layoutDensity: "spacious" as const, sectionDivider: "thin_rule"   as const },
    { id: "story_driven", label: "Story-Driven", writingStyle: "Open with a narrative hook. Lead with a real case.",       layoutDensity: "balanced" as const, sectionDivider: "dot_row"     as const },
    { id: "provocateur",  label: "Provocateur",  writingStyle: "Challenge assumptions. Open with a contrarian statement.", layoutDensity: "tight"    as const, sectionDivider: "bold_number" as const },
] as const;

export const PALETTES = [
    { id: "pulse_teal",   primary: "#00FFB3", secondary: "#9B8FFF", surface: "#0a0a0f" },
    { id: "iris_violet",  primary: "#9B8FFF", secondary: "#FF6B6B", surface: "#0b0a14" },
    { id: "amber_fire",   primary: "#FFB347", secondary: "#FF6B6B", surface: "#0f0c08" },
    { id: "nova_crimson", primary: "#FF6B6B", secondary: "#FFB347", surface: "#0f0808" },
    { id: "arctic_blue",  primary: "#5BC8F5", secondary: "#00FFB3", surface: "#080c12" },
    { id: "gold_ink",     primary: "#D4A840", secondary: "#9B8FFF", surface: "#0c0b08" },
    { id: "coral_sage",   primary: "#FF8C69", secondary: "#7EC8A4", surface: "#0a0d0b" },
    { id: "ice_white",    primary: "#E8EFF5", secondary: "#5BC8F5", surface: "#09090f" },
    { id: "lime_tech",    primary: "#B8E840", secondary: "#5BC8F5", surface: "#090c06" },
    { id: "rose_glass",   primary: "#F8A4C8", secondary: "#D4A840", surface: "#0f090d" },
    { id: "deep_ocean",   primary: "#2EC4F0", secondary: "#B8E840", surface: "#060c12" },
    { id: "slate_mono",   primary: "#C4C8D8", secondary: "#9B8FFF", surface: "#0a0a0c" },
] as const;

export const IMAGE_AESTHETICS         = ["photorealistic", "abstract_gradient", "flat_illustration", "technical_diagram"] as const;
export const BG_TREATMENTS            = ["dark_mesh", "grain_texture", "subtle_grid", "clean_flat"] as const;
export const TYPOGRAPHY_PERSONALITIES = ["classic_serif", "modern_sans", "editorial_contrast"] as const;
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/course-dna-catalogue.ts
git commit -m "feat: add CourseDNA catalogue (archetypes + palettes)"
```

---

## Task 3: `generateCourseDNA()` + `getCourseDNARender()`

**Files:**
- Create: `lib/ai/generate-course-dna.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/ai/generate-course-dna.ts
import crypto from "crypto";
import { CourseDNA, CourseDNASchema } from "@/lib/types/course-upgrade";
import { ARCHETYPES, PALETTES, IMAGE_AESTHETICS, BG_TREATMENTS, TYPOGRAPHY_PERSONALITIES } from "./course-dna-catalogue";

function pick<T>(arr: readonly T[], seed: number): T {
    return arr[seed % arr.length];
}

export const defaultRender: CourseDNA["render"] = {
    palette_id:       "pulse_teal",
    primary_colour:   "#00FFB3",
    secondary_colour: "#9B8FFF",
    surface_colour:   "#0a0a0f",
    image_aesthetic:  "photorealistic",
    bg_treatment:     "dark_mesh",
    typography:       "modern_sans",
    layout_density:   "balanced",
    section_divider:  "thin_rule",
};

/**
 * Deterministic — same courseId + title + difficulty always produce the same DNA.
 * Pure function, no side effects, no DB calls.
 */
export function generateCourseDNA(courseId: string, title: string, difficulty: string): CourseDNA {
    const hash = crypto.createHash("sha256")
        .update(`${courseId}:${title}:${difficulty}`)
        .digest("hex");

    // 7 seed integers from non-overlapping 4-char windows of the 64-char hex hash
    // seeds[0]=archetype, [1]=palette, [2]=example_bias, [3]=question_tone,
    // [4]=image_aesthetic, [5]=bg_treatment, [6]=typography
    const seeds = Array.from({ length: 7 }, (_, i) =>
        parseInt(hash.slice(i * 4, i * 4 + 4), 16)
    );

    const archetype = pick(ARCHETYPES, seeds[0]);
    const palette   = pick(PALETTES,   seeds[1]);

    return {
        dna_version: 1,
        content: {
            archetype_id:  archetype.id,
            writing_style: archetype.writingStyle,
            example_bias:  pick(["real_world_first", "theory_first", "analogy_first"] as const, seeds[2]),
            question_tone: pick(["socratic", "direct_challenge", "reflective"]        as const, seeds[3]),
        },
        render: {
            palette_id:       palette.id,
            primary_colour:   palette.primary,
            secondary_colour: palette.secondary,
            surface_colour:   palette.surface,
            image_aesthetic:  pick(IMAGE_AESTHETICS,          seeds[4]),
            bg_treatment:     pick(BG_TREATMENTS,             seeds[5]),
            typography:       pick(TYPOGRAPHY_PERSONALITIES,  seeds[6]),
            layout_density:   archetype.layoutDensity,   // archetype-coupled
            section_divider:  archetype.sectionDivider,  // archetype-coupled
        },
    };
}

/** Safely parse raw JSONB from DB. Returns defaultRender on any validation failure. */
export function getCourseDNARender(raw: unknown): CourseDNA["render"] {
    const result = CourseDNASchema.safeParse(raw);
    return result.success ? result.data.render : defaultRender;
}

/** Derive fingerprint — always re-derivable from courseId/title/difficulty */
export function deriveDNAFingerprint(courseId: string, title: string, difficulty: string): string {
    return crypto.createHash("sha256")
        .update(`${courseId}:${title}:${difficulty}`)
        .digest("hex");
}

/**
 * Derive an integer 0–N from a string. Used to replace the old lessonVariant.variant
 * integer in block components that need a per-course cycle offset (TypeCards, RecapSlide).
 * e.g. archetypeOffset(dna.render.palette_id, 4) replaces `lessonVariant.variant % 4`
 */
export function archetypeOffset(seed: string, modulus: number): number {
    const sum = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return sum % modulus;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Smoke-test determinism**

```bash
npx tsx -e "
import { generateCourseDNA } from './lib/ai/generate-course-dna';
const a = generateCourseDNA('test-123', 'Introduction to AI', 'beginner');
const b = generateCourseDNA('test-123', 'Introduction to AI', 'beginner');
const c = generateCourseDNA('test-456', 'Deep Learning', 'advanced');
console.log('Same inputs match:', JSON.stringify(a) === JSON.stringify(b));
console.log('Different inputs differ:', JSON.stringify(a) !== JSON.stringify(c));
console.log('Sample:', a.render.palette_id, a.content.archetype_id);
"
```

Expected: `Same inputs match: true`, `Different inputs differ: true`.

- [ ] **Step 4: Commit**

```bash
git add lib/ai/generate-course-dna.ts
git commit -m "feat: add generateCourseDNA() and supporting utilities"
```

---

## Task 4: Database Migration

**Files:**
- Create: `supabase/migrations/20260326_course_dna.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260326_course_dna.sql
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS course_dna       JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS dna_fingerprint  TEXT;

COMMENT ON COLUMN courses.course_dna      IS 'CourseDNA JSON — visual identity and content personality. Generated once on first creation.';
COMMENT ON COLUMN courses.dna_fingerprint IS 'SHA-256 of courseId:title:difficulty. Re-derivable — stored for fast lookup only.';
```

- [ ] **Step 2: Apply the migration**

Paste into Supabase Studio → SQL Editor and run. Or use CLI:
```bash
npx supabase db push
```

Verify:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'courses' AND column_name IN ('course_dna', 'dna_fingerprint');
```

Expected: 2 rows returned.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260326_course_dna.sql
git commit -m "feat: add course_dna and dna_fingerprint columns to courses table"
```

---

## Task 5: Wire DNA into Generation Pipeline

**Files:**
- Modify: `lib/ai/agent-system-v2.ts`
- Modify: `app/api/course/generate/route.ts`

### Part A — `agent-system-v2.ts`

- [ ] **Step 1: Add `CourseDNA` import to agent-system-v2.ts**

Open `lib/ai/agent-system-v2.ts`. Add to the imports at the top:
```typescript
import type { CourseDNA } from "@/lib/types/course-upgrade";
```

- [ ] **Step 2: Update `LessonExpanderAgent.expandLesson` signature**

Find the method signature (around line 326):
```typescript
async expandLesson(lesson: any, moduleContext: any, courseContext: any, retrievedChunks: any[] = [], lessonNumber: number = 1, courseState: CourseState | null = null): Promise<ConceptExplanation> {
```

Add `dnaContent` as the last parameter:
```typescript
async expandLesson(lesson: any, moduleContext: any, courseContext: any, retrievedChunks: any[] = [], lessonNumber: number = 1, courseState: CourseState | null = null, dnaContent: CourseDNA["content"] | null = null): Promise<ConceptExplanation> {
```

- [ ] **Step 3: Inject DNA into the prompt**

Find the `prompt` template string that begins with `` `SYSTEM: You are an elite UK instructional designer. `` (around line 407). Add these 3 lines immediately after the `DIFFICULTY: ${difficulty}` line:

```
COURSE PERSONALITY: ${dnaContent?.writing_style ?? 'Clear, expert, no filler words.'}
EXAMPLE STYLE: ${dnaContent?.example_bias ?? 'real_world_first'}
QUESTION TONE: ${dnaContent?.question_tone ?? 'socratic'}
```

- [ ] **Step 4: Update `OrchestratorV2.processLesson` to forward DNA**

Find `processLesson` in the `OrchestratorV2` class (~line 528):

```typescript
// BEFORE:
async processLesson(lessonPlan: any, moduleContext: any, courseContext: any, lessonNumber: number = 1, courseState: CourseState | null = null): Promise<ConceptExplanation> {
    return await this.expander.expandLesson(lessonPlan, moduleContext, courseContext, [], lessonNumber, courseState);
}

// AFTER:
async processLesson(lessonPlan: any, moduleContext: any, courseContext: any, lessonNumber: number = 1, courseState: CourseState | null = null, dnaContent: CourseDNA["content"] | null = null): Promise<ConceptExplanation> {
    return await this.expander.expandLesson(lessonPlan, moduleContext, courseContext, [], lessonNumber, courseState, dnaContent);
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

### Part B — `route.ts`

- [ ] **Step 6: Add DNA generation to the route**

Open `app/api/course/generate/route.ts`. Add imports at the top:
```typescript
import { generateCourseDNA, deriveDNAFingerprint } from "@/lib/ai/generate-course-dna";
```

Find the `sendEvent({ stage: 'setup', ... })` call (around line 182). Add immediately after it:
```typescript
// Generate and persist CourseDNA — deterministic from course identity
const courseDNA = generateCourseDNA(course.id, courseName, difficultyLevel);
const dnaFingerprint = deriveDNAFingerprint(course.id, courseName, difficultyLevel);

if (!DRY_RUN) {
    await supabase
        .from("courses")
        .update({ course_dna: courseDNA, dna_fingerprint: dnaFingerprint })
        .eq("id", course.id);
}
```

- [ ] **Step 7: Check if v2 orchestrator is accessible from the route**

```bash
grep -n "OrchestratorV2\|processLesson" app/api/course/generate/route.ts
```

If `OrchestratorV2` is already used: pass `courseDNA.content` as the last argument to any `processLesson` calls.

If only v1 `AgentOrchestrator` is used (current state): add a comment:
```typescript
// TODO: pass courseDNA.content to OrchestratorV2.processLesson once route is migrated to v2
// DNA render is already persisted and applied by the frontend immediately.
```

This is a known gap — content personality injection is deferred to the v1→v2 route migration.

- [ ] **Step 8: Commit**

```bash
git add lib/ai/agent-system-v2.ts app/api/course/generate/route.ts
git commit -m "feat: wire CourseDNA into generation pipeline (render immediate, content pending v2 migration)"
```

---

## Task 6: `CourseDNAProvider` + Context Hook

**Files:**
- Create: `components/course/course-dna-provider.tsx`

- [ ] **Step 1: Create the provider**

```typescript
// components/course/course-dna-provider.tsx
"use client";

import React, { createContext, useContext } from "react";
import type { CourseDNA } from "@/lib/types/course-upgrade";
import { defaultRender } from "@/lib/ai/generate-course-dna";

const CourseDNAContext = createContext<CourseDNA["render"]>(defaultRender);

export function useCourseDNA(): CourseDNA["render"] {
    return useContext(CourseDNAContext);
}

export function CourseDNAProvider({
    render,
    children,
}: {
    render: CourseDNA["render"];
    children: React.ReactNode;
}) {
    return (
        <CourseDNAContext.Provider value={render}>
            {children}
        </CourseDNAContext.Provider>
    );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/course/course-dna-provider.tsx
git commit -m "feat: add CourseDNAProvider context and useCourseDNA hook"
```

---

## Task 7: Per-Course Layout (Server Component)

**Files:**
- Create: `app/courses/[courseId]/layout.tsx`

**Note:** `app/courses/layout.tsx` already exists as `"use client"`. The new `[courseId]/layout.tsx` is a deeper nested segment — Next.js renders both in chain; no conflict. In Next.js 16, `params` in Server Components may be a `Promise` — the code below awaits it.

- [ ] **Step 1: Create the layout**

```typescript
// app/courses/[courseId]/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { getCourseDNARender } from "@/lib/ai/generate-course-dna";
import { CourseDNAProvider } from "@/components/course/course-dna-provider";

export default async function CourseLayout({
    params,
    children,
}: {
    params: Promise<{ courseId: string }>;
    children: React.ReactNode;
}) {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: course } = await supabase
        .from("courses")
        .select("course_dna")
        .eq("id", courseId)
        .single();

    const render = getCourseDNARender(course?.course_dna);

    return (
        <CourseDNAProvider render={render}>
            {children}
        </CourseDNAProvider>
    );
}
```

- [ ] **Step 2: Start dev server and verify no errors**

```bash
npm run dev
```

Open `http://localhost:3000/courses/[any-existing-courseId]`.

Expected: page loads without console errors. (Lesson blocks still use `LessonVariantContext` at this point — they will fall back to the default context value since the provider is not yet in scope for block-renderer.)

- [ ] **Step 3: Commit**

```bash
git add "app/courses/[courseId]/layout.tsx"
git commit -m "feat: add per-course Server Component layout with CourseDNAProvider"
```

---

## Task 8: `CourseBackground` Component

**Files:**
- Create: `components/course/course-background.tsx`
- Modify: `components/course/lesson-content-renderer.tsx` (remove old inline blobs)

- [ ] **Step 1: Read the existing blob pattern in `lesson-content-renderer.tsx`**

Open `components/course/lesson-content-renderer.tsx` and find the elements rendering background mesh blobs and SVG grain. Note their exact JSX so you can replicate the pattern in `CourseBackground`.

- [ ] **Step 2: Create `course-background.tsx`**

```typescript
// components/course/course-background.tsx
"use client";

import { useCourseDNA } from "./course-dna-provider";

export function CourseBackground() {
    const { bg_treatment, primary_colour, secondary_colour, surface_colour } = useCourseDNA();

    if (bg_treatment === "clean_flat") {
        return <div className="fixed inset-0 -z-10" style={{ backgroundColor: surface_colour }} />;
    }

    if (bg_treatment === "subtle_grid") {
        return (
            <div className="fixed inset-0 -z-10" style={{ backgroundColor: surface_colour }}>
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(${primary_colour} 1px, transparent 1px), linear-gradient(90deg, ${primary_colour} 1px, transparent 1px)`,
                        backgroundSize: "60px 60px",
                    }}
                />
            </div>
        );
    }

    if (bg_treatment === "grain_texture") {
        return (
            <div className="fixed inset-0 -z-10" style={{ backgroundColor: surface_colour }}>
                <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                    <filter id="grain-bg">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#grain-bg)" />
                </svg>
            </div>
        );
    }

    // dark_mesh — radial gradient blobs (default, replicates existing LessonContentRenderer pattern)
    return (
        <div className="fixed inset-0 -z-10" style={{ backgroundColor: surface_colour }}>
            <div
                className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[120px] pointer-events-none"
                style={{ background: `radial-gradient(circle, ${primary_colour}, transparent 70%)` }}
            />
            <div
                className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.06] blur-[100px] pointer-events-none"
                style={{ background: `radial-gradient(circle, ${secondary_colour}, transparent 70%)` }}
            />
            <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
                <filter id="grain-mesh">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#grain-mesh)" />
            </svg>
        </div>
    );
}
```

- [ ] **Step 3: Remove inline blobs from `lesson-content-renderer.tsx`**

Open `components/course/lesson-content-renderer.tsx`. Remove the inline blob `div` elements and SVG grain that you noted in Step 1. Add `<CourseBackground />` at the top of the component's rendered output instead. **Do not skip this step** — if both the old inline elements and `CourseBackground` are present simultaneously, the background will be double-layered.

- [ ] **Step 4: Commit**

```bash
git add components/course/course-background.tsx components/course/lesson-content-renderer.tsx
git commit -m "feat: extract background treatment into CourseBackground component"
```

---

## Task 9: `SectionDivider` Component

**Files:**
- Create: `components/course/SectionDivider.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/course/SectionDivider.tsx
"use client";

import { useCourseDNA } from "./course-dna-provider";

export function SectionDivider({ sectionNumber }: { sectionNumber?: number }) {
    const { section_divider, primary_colour } = useCourseDNA();

    if (section_divider === "bold_number") {
        if (sectionNumber !== undefined) {
            return (
                <div className="flex items-center justify-center my-8 select-none pointer-events-none">
                    <span
                        className="font-mono text-[80px] font-black leading-none opacity-[0.06]"
                        style={{ color: primary_colour }}
                    >
                        {String(sectionNumber).padStart(2, "0")}
                    </span>
                </div>
            );
        }
        // bold_number with no sectionNumber — render a thick accent rule so the archetype
        // variation is still visible even without a section counter at the call site
        return (
            <div
                className="my-10 h-[3px] w-16 mx-auto rounded-full"
                style={{ backgroundColor: primary_colour, opacity: 0.4 }}
            />
        );
    }

    if (section_divider === "dot_row") {
        return (
            <div className="flex items-center justify-center gap-2 my-8">
                {[0, 1, 2, 3, 4].map((i) => (
                    <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: primary_colour, opacity: 0.3 }}
                    />
                ))}
            </div>
        );
    }

    // thin_rule (default)
    return (
        <div
            className="my-10 h-px w-full max-w-[1140px] mx-auto"
            style={{ backgroundColor: primary_colour, opacity: 0.12 }}
        />
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/course/SectionDivider.tsx
git commit -m "feat: add SectionDivider component driven by CourseDNA context"
```

---

## Task 10: Migrate `block-renderer.tsx` off `LessonVariantContext`

**Files:**
- Modify: `components/course/block-renderer.tsx`
- Modify: `components/course/lesson-progress-rail.tsx`

Read the full `block-renderer.tsx` before starting. This task has several interdependent changes.

- [ ] **Step 1: Verify no other usages of `hashString` exist**

```bash
grep -n "hashString" components/course/block-renderer.tsx
```

Expected: only 1 usage (inside the `lessonVariant` useMemo). If there are others, note them before deleting.

- [ ] **Step 2: Delete `LessonVariantContext` and related code**

Remove these from `block-renderer.tsx`:
- The `LessonVariant` interface (lines ~37–41)
- `LessonVariantContext` const (line ~43)
- `LESSON_ACCENTS` array (lines ~47–52)
- `SURFACE_BG_SETS` array (lines ~55–64)
- `hashString` function (lines ~66–68)
- The `lessonVariant` useMemo (lines ~127–131)
- The `SURFACE_BG` derived value (line ~133)

- [ ] **Step 3: Add `useCourseDNA` and derive replacements**

Add import:
```typescript
import { useCourseDNA } from "@/components/course/course-dna-provider";
import { archetypeOffset } from "@/lib/ai/generate-course-dna";
```

Inside `LessonBlockRenderer`, at the top of the function body, add:
```typescript
const courseDNA = useCourseDNA();
```

**Replace `lessonVariant.accent`** throughout → `courseDNA.primary_colour`

**Replace `SURFACE_BG.has(blockType)`** with a density-mapped surface set. Use `layout_density` from DNA to vary which blocks get dark backgrounds:

```typescript
// Map layout_density to a surface-dark set — drives visual rhythm per course
const SURFACE_DARK_BY_DENSITY: Record<string, Set<string>> = {
    tight:    new Set(['instructor_insight', 'industry_tabs', 'prediction', 'applied_case', 'interactive_vis', 'quiz', 'video_snippet']),
    balanced: new Set(['instructor_insight', 'type_cards', 'industry_tabs', 'applied_case', 'interactive_vis', 'quiz', 'video_snippet']),
    spacious: new Set(['instructor_insight', 'type_cards', 'industry_tabs', 'prediction', 'applied_case', 'interactive_vis', 'quiz', 'video_snippet']),
};
const SURFACE_DARK = SURFACE_DARK_BY_DENSITY[courseDNA.layout_density] ?? SURFACE_DARK_BY_DENSITY.balanced;
```

Replace `SURFACE_BG.has(blockType)` → `SURFACE_DARK.has(blockType)`

**Replace `lessonVariant.variant` in TypeCards layout cycling.** Find the line using `lessonVariant.variant` as an offset (e.g. `(typeCardsCounter + lessonVariant.variant) % LAYOUTS.length`). Replace with:
```typescript
const typeCardsOffset = archetypeOffset(courseDNA.palette_id, 4);
// then use: (typeCardsCounter + typeCardsOffset) % LAYOUTS.length
```

- [ ] **Step 4: Remove `LessonVariantContext.Provider` wrapper**

Find where `<LessonVariantContext.Provider value={lessonVariant}>` wraps the output. Remove the provider wrapper — keep only the children.

- [ ] **Step 5: Update `LessonProgressRail` to use `useCourseDNA()`**

Open `components/course/lesson-progress-rail.tsx`.

Add import:
```typescript
import { useCourseDNA } from "@/components/course/course-dna-provider";
```

Remove `LessonProgressRailProps` interface and the `{ accent = "#00FFB3" }` param from the function signature. Change to:
```typescript
export function LessonProgressRail() {
    const { primary_colour } = useCourseDNA();
    // replace all `accent` usages with `primary_colour`
```

- [ ] **Step 6: Remove `accent` prop from the call site**

Find `<LessonProgressRail accent={...} />` in `block-renderer.tsx`. Change to:
```typescript
<LessonProgressRail />
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 8: Visual check in browser**

```bash
npm run dev
```

Open any lesson page. Verify:
- No console errors
- Right-side nav dots visible and glowing
- No blank white panels
- Layout density padding is applied (tight/balanced/spacious)

- [ ] **Step 9: Commit**

```bash
git add components/course/block-renderer.tsx components/course/lesson-progress-rail.tsx
git commit -m "feat: migrate block-renderer to CourseDNA, remove LessonVariantContext"
```

---

## Task 11: Update Block Components Using `useLessonVariant()`

**Files:**
- Modify: individual block components under `components/course/blocks/`

- [ ] **Step 1: Find all affected block components**

```bash
grep -rl "useLessonVariant\|LessonVariantContext" components/course/blocks/
```

- [ ] **Step 2: Migrate each file**

For each file:
1. Remove the old import (e.g. `import { LessonVariantContext } from "../block-renderer"`)
2. Add: `import { useCourseDNA } from "../course-dna-provider"`
3. Replace `const { accent } = useContext(LessonVariantContext)` → `const { primary_colour } = useCourseDNA()`
4. Replace `accent` usages with `primary_colour` (or `secondary_colour` / `surface_colour` as appropriate)

**Special case — RecapSlide:** RecapSlide reads both `accent` AND `variant` from `LessonVariantContext`. `variant` was used to pick between `card`/`minimal`/`striped` styles. Replace with:
```typescript
import { useCourseDNA } from "../course-dna-provider";
import { archetypeOffset } from "@/lib/ai/generate-course-dna";

// Inside component:
const { primary_colour, palette_id } = useCourseDNA();
const RECAP_STYLES = ["card", "minimal", "striped"] as const;
const recapStyle = RECAP_STYLES[archetypeOffset(palette_id, 3)];
```

- [ ] **Step 3: Verify TypeScript compiles with no new errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add components/course/blocks/
git commit -m "feat: migrate block components to CourseDNA context"
```

---

## Task 12: Final Smoke Test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test two different courses**

Open two different course lesson pages. They should visually differ in:
- Accent colour (nav dot glow, heading highlights)
- Background treatment (mesh blobs vs grid vs grain)
- Layout density (spacing between sections)

- [ ] **Step 3: Test Supabase DNA persistence**

For a course that was recently generated, check Supabase Studio → `courses` table. Verify `course_dna` is populated with a valid JSON object containing `dna_version: 1`, `content`, and `render` sub-objects.

For courses generated before this change, `course_dna` will be `{}` — the frontend fallback (`defaultRender` = pulse_teal palette) will be used, which is correct behaviour.

- [ ] **Step 4: Final commit**

```bash
git add docs/superpowers/plans/2026-03-26-course-variation.md
git commit -m "docs: add course variation implementation plan"
```

---

## Known Gap: V1 → V2 Orchestrator + Content Personality

**What works immediately after this plan:**
- Every course gets a distinct visual identity (colours, background, typography, density, section dividers)
- This applies to all existing courses (via `defaultRender` fallback for old courses, and real DNA for any course generated after Task 4 is applied)
- `LessonProgressRail`, `TypeCards`, `RecapSlide`, and all other block components draw from course DNA

**What is deferred:**
- Writing style, example bias, and question tone are wired into `LessonExpanderAgent` (v2) but `route.ts` uses v1 `AgentOrchestrator` which does not call v2. Content personality injection activates once the route is migrated to `OrchestratorV2`.
- Newly generated courses will have correct visual DNA but default content personality until that migration is done.
- Migrating the route to v2 is a separate plan — do not include it here.
