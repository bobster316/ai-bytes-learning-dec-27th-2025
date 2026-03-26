# Course Variation System — Design Spec
**Date:** 2026-03-26
**Status:** Approved (v3 — post spec-review fixes)
**Author:** Claude Code (brainstorming session)

---

## Problem

All generated courses on AI Bytes Learning share the same visual identity and content personality. As the course catalogue grows, the platform feels repetitive — same colour scheme, same tone, same structural patterns in every lesson. This undermines the award-winning, best-in-class experience goal.

---

## Goal

Introduce systematic variation so that each course has its own distinct identity — visually and in content personality — while remaining coherent within a course (all lessons feel like they belong to the same course).

---

## Section 1: The `CourseDNA` Object

`CourseDNA` is a plain JSON object generated once per course and stored in the `courses` table. It is the single source of truth for all variation decisions. It never changes after first generation.

**Type location:** `lib/types/course-upgrade.ts` — this is the file already imported by `lib/ai/agent-system-v2.ts`. Placing `CourseDNA` here avoids adding a new cross-import. (Note: `lib/types/course-generator.ts` also exists but is **not** imported by the generation agents — do not place `CourseDNA` there.)

```typescript
// lib/types/course-upgrade.ts (addition)

export interface CourseDNA {
  dna_version: 1;

  content: {
    archetype_id:  string;   // e.g. "clinical", "bold", "warm"
    writing_style: string;   // plain-English instruction injected into generator prompt
    example_bias:  "real_world_first" | "theory_first" | "analogy_first";
    question_tone: "socratic" | "direct_challenge" | "reflective";
  };

  render: {
    palette_id:       string;   // e.g. "pulse_teal", "iris_violet"
    primary_colour:   string;   // hex — accent, headings, active states
    secondary_colour: string;   // hex — highlights, badges
    surface_colour:   string;   // hex — page/card background
    image_aesthetic:  "photorealistic" | "abstract_gradient" | "flat_illustration" | "technical_diagram";
    bg_treatment:     "dark_mesh" | "grain_texture" | "subtle_grid" | "clean_flat";
    typography:       "classic_serif" | "modern_sans" | "editorial_contrast";
    layout_density:   "tight" | "balanced" | "spacious";
    section_divider:  "thin_rule" | "bold_number" | "dot_row";
  };
}

// The raw DB column type before Zod validation — always `unknown` until parsed
export type RawCourseDNA = unknown;

// Zod schema — mirrors CourseDNA interface exactly
// z.literal(1) for dna_version enables discriminated union if versions are added later
import { z } from "zod";

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

**Key design decisions:**
- Split into `content` (affects prompt/generation) and `render` (affects React components only). These never bleed into each other.
- `dna_version: 1` enables future migration if the shape changes.
- DNA is computed once and stored. Repair loops re-use the original stored DNA — they never re-roll it.
- The DB column is `JSONB` typed as `unknown` on read; always validated through `CourseDNASchema` before use.

---

## Section 2: The Six Archetypes

Each archetype carries `layout_density` and `section_divider` so render choices are coherent with content personality. These are **archetype properties, not independently selected values** — they are not picked from separate seed draws.

| ID | Label | Writing Style | Layout Density | Section Divider |
|----|-------|---------------|---------------|----------------|
| `clinical` | Clinical | Precise, evidence-first, no fluff | `spacious` | `thin_rule` |
| `bold` | Bold | Punchy, declarative, short paragraphs | `tight` | `bold_number` |
| `warm` | Warm | Encouraging, analogy-rich, conversational | `balanced` | `dot_row` |
| `futuristic` | Futuristic | Forward-looking, system-level thinking | `spacious` | `thin_rule` |
| `story_driven` | Story-Driven | Narrative hooks, case-study-led | `balanced` | `dot_row` |
| `provocateur` | Provocateur | Challenge assumptions, contrarian openers | `tight` | `bold_number` |

---

## Section 3: Render Variation Catalogue

Note: `layout_density` and `section_divider` valid values are defined above as archetype properties. The tables below cover the independently-selected render dimensions only.

### 12 Colour Palettes (independently selected)

| ID | Primary | Secondary | Surface |
|----|---------|-----------|---------|
| `pulse_teal` | #00FFB3 | #9B8FFF | #0a0a0f |
| `iris_violet` | #9B8FFF | #FF6B6B | #0b0a14 |
| `amber_fire` | #FFB347 | #FF6B6B | #0f0c08 |
| `nova_crimson` | #FF6B6B | #FFB347 | #0f0808 |
| `arctic_blue` | #5BC8F5 | #00FFB3 | #080c12 |
| `gold_ink` | #D4A840 | #9B8FFF | #0c0b08 |
| `coral_sage` | #FF8C69 | #7EC8A4 | #0a0d0b |
| `ice_white` | #E8EFF5 | #5BC8F5 | #09090f |
| `lime_tech` | #B8E840 | #5BC8F5 | #090c06 |
| `rose_glass` | #F8A4C8 | #D4A840 | #0f090d |
| `deep_ocean` | #2EC4F0 | #B8E840 | #060c12 |
| `slate_mono` | #C4C8D8 | #9B8FFF | #0a0a0c |

### Image Aesthetics (4, independently selected)
`photorealistic` | `abstract_gradient` | `flat_illustration` | `technical_diagram`

### Background Treatments (4, independently selected)
`dark_mesh` | `grain_texture` | `subtle_grid` | `clean_flat`

These map to JSX implementations (not raw Tailwind classes — see Section 5).

### Typography Personalities (3, independently selected)
| ID | Description |
|----|-------------|
| `classic_serif` | Body text in Instrument Serif, headings in Syne 800. Bold/large only on lesson title and main section headings. |
| `modern_sans` | Body in Plus Jakarta Sans, headings in Syne 800. Clean, no serif contrast. |
| `editorial_contrast` | Alternating Syne and DM Mono for section labels and callouts. Bold/large only on lesson title and main section headings. |

---

## Section 4: Pipeline Integration

### Generation orchestrator note

`app/api/course/generate/route.ts` currently imports `AgentOrchestrator` from `lib/ai/agent-system` (v1). `LessonExpanderAgent` lives in `lib/ai/agent-system-v2.ts`. The spec modification to inject DNA targets **`lib/ai/agent-system-v2.ts` → `LessonExpanderAgent`**. The route change needed is: after creating the course row, generate and persist DNA, then pass `dna.content` through to whatever v2 expansion calls are made (either by updating the `AgentOrchestrator` to accept DNA or by directly calling the v2 expander — the implementation plan will resolve which pattern fits the current call graph).

### Where DNA is created

In `app/api/course/generate/route.ts`, immediately after the Planner agent returns topic/lesson structure, before any Expander calls:

```typescript
const dna = generateCourseDNA(courseId, courseTitle, difficulty);
const fingerprint = crypto.createHash("sha256")
  .update(`${courseId}:${courseTitle}:${difficulty}`)
  .digest("hex");

// persisted in same DB transaction as the course row
await supabase
  .from("courses")
  .update({ course_dna: dna, dna_fingerprint: fingerprint })
  .eq("id", courseId);
```

### How content generation uses DNA

`content.writing_style`, `content.example_bias`, and `content.question_tone` are injected verbatim into the `LessonExpanderAgent` system prompt in `lib/ai/agent-system-v2.ts`:

```
COURSE PERSONALITY: ${dna.content.writing_style}
EXAMPLE STYLE: ${dna.content.example_bias}
QUESTION TONE: ${dna.content.question_tone}
```

The generator never reads `dna.render` — render is a frontend concern only.

### How the frontend uses DNA

`CourseDNAProvider` (a `"use client"` component, see Section 5) wraps the course layout and exposes `dna.render` to all block components via context.

### `dna_fingerprint`

Always derived — never independently authored:

```typescript
const fingerprint = crypto.createHash("sha256")
  .update(`${courseId}:${title}:${difficulty}`)
  .digest("hex");
```

This makes `dna_fingerprint` a cache/lookup key only. Always re-derivable. No divergence possible.

### Persistence

DNA is persisted in a **single transaction** alongside the course row. If the transaction fails, no partial DNA state is written. The `course_dna` column is `JSONB NOT NULL DEFAULT '{}'` — the generation route checks for empty object (`Object.keys(raw).length === 0`) and regenerates if missing.

The DB column type on read is `unknown`. It is always validated through `CourseDNASchema` before use. TypeScript sees the raw column as `unknown`, not as `CourseDNA`.

### Zod validation + fallback

A utility function `getCourseDNA(raw: unknown): CourseDNA["render"]` wraps all reads:

```typescript
// lib/ai/generate-course-dna.ts

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

export function getCourseDNARender(raw: unknown): CourseDNA["render"] {
  const parsed = CourseDNASchema.safeParse(raw);
  if (!parsed.success) return defaultRender;
  return parsed.data.render;
}
```

This is called in the Server Component that fetches course data before passing to `CourseDNAProvider`.

### Repair loops

If a lesson needs to be regenerated (quality failure, admin re-trigger), the existing `course_dna` is read from the DB and passed unchanged to the Expander. DNA is never re-rolled on repair — only on first generation.

---

## Section 5: Frontend Rendering

### Client/Server boundary

The DNA provider must be a `"use client"` component (React context requires client). The course layout at `app/courses/[courseId]/layout.tsx` is a **Server Component** (it fetches DNA from Supabase). The pattern:

```
app/courses/[courseId]/layout.tsx  ← Server Component, fetches course_dna
  └── <CourseDNAProvider render={...}>  ← "use client" component
        └── {children}
```

`CourseDNAProvider` lives in its own file: `components/course/course-dna-provider.tsx`. It is **not** defined inside `block-renderer.tsx`. The context hook (`useCourseDNA`) is exported from the provider file.

### `CourseDNAProvider` + context

```typescript
// components/course/course-dna-provider.tsx
"use client";

const CourseDNAContext = createContext<CourseDNA["render"]>(defaultRender);
export const useCourseDNA = () => useContext(CourseDNAContext);

export function CourseDNAProvider({
  render,
  children,
}: {
  render: CourseDNA["render"];
  children: React.ReactNode;
}) {
  return <CourseDNAContext.Provider value={render}>{children}</CourseDNAContext.Provider>;
}
```

### Layout wiring

**Note:** `app/courses/layout.tsx` already exists as a `"use client"` component (it uses `usePathname()` to suppress the header on lesson pages). The new file `app/courses/[courseId]/layout.tsx` is a nested segment layout — Next.js App Router renders both layouts in chain. The new layout is a Server Component because it uses no client hooks. The existing parent layout output arrives as `{children}` — there is no conflict.

```typescript
// app/courses/[courseId]/layout.tsx  (NEW FILE — Server Component)
import { getCourseDNARender } from "@/lib/ai/generate-course-dna";

export default async function CourseLayout({ params, children }) {
  const { data: course } = await supabase.from("courses").select("course_dna").eq("id", params.courseId).single();
  const render = getCourseDNARender(course?.course_dna);
  return <CourseDNAProvider render={render}>{children}</CourseDNAProvider>;
}
```

### Replacing `LessonVariantContext`

`LessonVariantContext` in `components/course/block-renderer.tsx` is removed. Block components that currently call `useLessonVariant()` are updated to call `useCourseDNA()` instead. The context shape changes (render object instead of a simple accent colour) — each block takes what it needs from the render object.

**`LessonProgressRail` accent prop:** `block-renderer.tsx` currently passes `accent={lessonVariant.accent}` directly as a prop to `LessonProgressRail`. When `LessonVariantContext` is removed, this source disappears. Fix: `LessonProgressRail` should call `useCourseDNA()` itself and read `primary_colour` directly — it should not require an `accent` prop at all. Remove the prop from `LessonProgressRail`'s interface as part of this migration.

### Background treatment

Background treatments are JSX implementations, not raw Tailwind classes. `dark_mesh` and `grain_texture` reuse the existing SVG grain + radial-gradient blob pattern already in `LessonContentRenderer`. A `CourseBackground` component wraps the course page and switches implementation by `bg_treatment` value. New CSS utilities (`bg-mesh-gradient`, `bg-grain`) are **not** used — the existing JSX blob pattern is extracted into `components/course/course-background.tsx` and parameterised.

### Layout density

Static maps translate DNA enum values to Tailwind classes:

```typescript
const DENSITY_PADDING = { tight: "py-12", balanced: "py-20", spacious: "py-28" };
const DENSITY_GAP     = { tight: "gap-3",  balanced: "gap-5",  spacious: "gap-8" };
```

### `SectionDivider` component

```typescript
export function SectionDivider() {
  const { section_divider, primary_colour } = useCourseDNA();
  // renders thin_rule | bold_number | dot_row accordingly
}
```

---

## Section 6: `generateCourseDNA()` + DNA Catalogue

### Catalogue file (`lib/ai/course-dna-catalogue.ts`)

Plain data — no logic. No imports from type files (avoids circular dependency: catalogue → types → catalogue). Exported as `as const` arrays. `CourseDNA` is imported from `lib/types/course-upgrade.ts` only in `generate-course-dna.ts`, not in the catalogue itself.

### `pick()` helper

```typescript
function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}
```

Uses modulo. For array sizes used here (max 12), the modulo bias from a 16-bit seed (0–65535) is at most 0.002% — negligible for this use case.

### `generateCourseDNA()` (`lib/ai/generate-course-dna.ts`)

```typescript
export function generateCourseDNA(courseId: string, title: string, difficulty: string): CourseDNA {
  const hash = crypto.createHash("sha256")
    .update(`${courseId}:${title}:${difficulty}`)
    .digest("hex");

  // 7 seed integers from non-overlapping 4-hex-char windows of the 64-char hash
  // Windows cover positions 0–27 of a 64-char string — all within bounds
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
      question_tone: pick(["socratic", "direct_challenge", "reflective"] as const,        seeds[3]),
    },
    render: {
      palette_id:       palette.id,
      primary_colour:   palette.primary,
      secondary_colour: palette.secondary,
      surface_colour:   palette.surface,
      image_aesthetic:  pick(IMAGE_AESTHETICS,         seeds[4]),
      bg_treatment:     pick(BG_TREATMENTS,            seeds[5]),
      typography:       pick(TYPOGRAPHY_PERSONALITIES, seeds[6]),
      layout_density:   archetype.layoutDensity,   // archetype-coupled, not seed-picked
      section_divider:  archetype.sectionDivider,  // archetype-coupled, not seed-picked
    },
  };
}
```

**Properties:**
- **Deterministic** — same course ID + title + difficulty always produce the same DNA.
- **Pure function** — no side effects, no DB calls.
- `layout_density` and `section_divider` come from the archetype, not from independent seeds, so content personality and visual rhythm stay coherent.

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `lib/types/course-upgrade.ts` | Modify | Add `CourseDNA` interface, `RawCourseDNA` type, `CourseDNASchema` (Zod) |
| `lib/ai/course-dna-catalogue.ts` | **Create** | All archetype/palette/render catalogue data — no type imports |
| `lib/ai/generate-course-dna.ts` | **Create** | `generateCourseDNA()`, `getCourseDNARender()`, `defaultRender` |
| `app/api/course/generate/route.ts` | Modify | Call `generateCourseDNA()`, persist DNA; pass `dna.content` to v2 expander |
| `lib/ai/agent-system-v2.ts` | Modify | Accept `CourseDNA["content"]` param in `LessonExpanderAgent`, inject into system prompt |
| `components/course/course-dna-provider.tsx` | **Create** | `"use client"` — `CourseDNAContext`, `CourseDNAProvider`, `useCourseDNA` hook |
| `app/courses/[courseId]/layout.tsx` | **Create** | Server Component — fetches DNA, renders `<CourseDNAProvider>` |
| `components/course/block-renderer.tsx` | Modify | Remove `LessonVariantContext`; update block components to use `useCourseDNA()` |
| `components/course/course-background.tsx` | **Create** | Extracts mesh blob pattern from `LessonContentRenderer`; switches by `bg_treatment` |
| `components/course/SectionDivider.tsx` | **Create** | Renders thin_rule / bold_number / dot_row from `useCourseDNA()` |
| `supabase/migrations/` | **Create** | `ALTER TABLE courses ADD COLUMN course_dna JSONB NOT NULL DEFAULT '{}', ADD COLUMN dna_fingerprint TEXT` |

---

## Out of Scope

- Per-lesson DNA override (DNA is course-level only)
- Light/dark mode switching per DNA (all courses are dark-mode)
- Admin UI to manually set DNA (auto-generated only)
- DNA affecting quiz logic or assessment scoring
