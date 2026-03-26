# Course Variation System — Design Spec
**Date:** 2026-03-26
**Status:** Approved
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

```typescript
// lib/types/course-generator.ts (addition)

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
```

**Key design decisions:**
- Split into `content` (affects prompt/generation) and `render` (affects React components only). These never bleed into each other.
- `dna_version: 1` enables future migration if the shape changes.
- DNA is computed once and stored. It is never recomputed from scratch — repair loops re-use the original stored DNA.

---

## Section 2: The Six Archetypes

| ID | Label | Writing Style |
|----|-------|---------------|
| `clinical` | Clinical | Precise, evidence-first, no fluff |
| `bold` | Bold | Punchy, declarative, short paragraphs |
| `warm` | Warm | Encouraging, analogy-rich, conversational |
| `futuristic` | Futuristic | Forward-looking, system-level thinking |
| `story_driven` | Story-Driven | Narrative hooks, case-study-led |
| `provocateur` | Provocateur | Challenge assumptions, contrarian openers |

Each archetype also carries a default `layout_density` and `section_divider` so render choices are coherent with the content personality.

---

## Section 3: Render Variation Catalogue

### 12 Colour Palettes

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

### Image Aesthetics (4)
`photorealistic` | `abstract_gradient` | `flat_illustration` | `technical_diagram`

### Background Treatments (4)
`dark_mesh` | `grain_texture` | `subtle_grid` | `clean_flat`

### Typography Personalities (3)
| ID | Description |
|----|-------------|
| `classic_serif` | Body text in Instrument Serif, headings in Syne 800. Bold/large only on lesson title and main section headings. |
| `modern_sans` | Body in Plus Jakarta Sans, headings in Syne 800. Clean, no serif contrast. |
| `editorial_contrast` | Alternating Syne and DM Mono for section labels and callouts. Bold/large only on lesson title and main section headings. |

### Layout Densities (3)
| ID | Section padding | Card gap |
|----|----------------|----------|
| `tight` | `py-12` | `gap-3` |
| `balanced` | `py-20` | `gap-5` |
| `spacious` | `py-28` | `gap-8` |

### Section Dividers (3)
`thin_rule` — 1px line, 40% opacity
`bold_number` — large faded section counter (01 / 02 / 03) in DM Mono
`dot_row` — row of 5 dots in primary colour at 30% opacity

---

## Section 4: Pipeline Integration

### Where DNA is created

In `app/api/course/generate/route.ts`, immediately after the Planner agent returns topic/lesson structure, before any Expander calls:

```typescript
const dna = generateCourseDNA(courseId, courseTitle, difficulty);
// persist in same transaction as course row insert
await supabase.from("courses").update({ course_dna: dna, dna_fingerprint: fingerprint }).eq("id", courseId);
```

### How content generation uses DNA

`content.writing_style` is injected verbatim into the `LessonExpanderAgent` system prompt:

```
COURSE PERSONALITY: ${dna.content.writing_style}
EXAMPLE STYLE: ${dna.content.example_bias}
QUESTION TONE: ${dna.content.question_tone}
```

The generator never reads `dna.render` — render is a frontend concern only.

### How the frontend uses DNA

`CourseDNAContext` wraps the course layout and exposes `dna.render` to all block components via context. Block components read from context — they never accept palette props directly.

```typescript
// app/courses/[courseId]/layout.tsx
<CourseDNAContext.Provider value={course.course_dna?.render ?? defaultRender}>
  {children}
</CourseDNAContext.Provider>
```

### `dna_fingerprint`

Always derived — never independently authored:

```typescript
const fingerprint = crypto.createHash("sha256")
  .update(`${courseId}:${title}:${difficulty}`)
  .digest("hex");
```

This makes `dna_fingerprint` a cache/lookup key only. It is always re-derivable. No divergence possible.

### Persistence

DNA is persisted in a **single transaction** alongside the course row. If the transaction fails, no partial DNA state is written. The `course_dna` column is `JSONB NOT NULL DEFAULT '{}'` — generation code checks for empty object and regenerates if missing.

### Repair loops

If a lesson needs to be regenerated (quality failure, admin re-trigger), the existing `course_dna` is read from the DB and passed unchanged to the Expander. DNA is never re-rolled on repair — only on first generation.

### Validation

A Zod schema (`CourseDNASchema`) validates the stored JSON on read. If the stored object fails validation (e.g. after a `dna_version` bump), the system falls back to `defaultRender` constants rather than crashing.

---

## Section 5: Frontend Rendering

### `CourseDNAContext`

Replaces the existing `LessonVariantContext`. Lives in `components/course/block-renderer.tsx`.

```typescript
const CourseDNAContext = createContext<CourseDNA["render"]>(defaultRender);
export const useCourseDNA = () => useContext(CourseDNAContext);
```

All block components call `useCourseDNA()` to access `primary_colour`, `secondary_colour`, `surface_colour`, etc.

### CSS class maps

Static maps translate DNA enum values to Tailwind classes:

```typescript
const DENSITY_PADDING = { tight: "py-12", balanced: "py-20", spacious: "py-28" };
const DENSITY_GAP     = { tight: "gap-3",  balanced: "gap-5",  spacious: "gap-8" };
```

### Background treatment

Applied at course layout level via a CSS variable on the root wrapper:

```typescript
// e.g. dark_mesh → background: radial-gradient(ellipse at 20% 30%, ...) + SVG grain overlay
const BG_CLASSES = {
  dark_mesh:      "bg-mesh-gradient",
  grain_texture:  "bg-grain",
  subtle_grid:    "bg-grid",
  clean_flat:     "bg-[var(--surface)]",
};
```

### `SectionDivider` component

```typescript
export function SectionDivider() {
  const { section_divider, primary_colour } = useCourseDNA();
  // renders thin_rule | bold_number | dot_row accordingly
}
```

Used between major lesson sections.

---

## Section 6: `generateCourseDNA()` + DNA Catalogue

### Catalogue file (`lib/ai/course-dna-catalogue.ts`)

Plain data — no logic. Single source of truth for all archetypes, palettes, and render enums. Maintained independently of generation code.

Key entries: 6 archetypes, 12 palettes, 4 image aesthetics, 4 bg treatments, 3 typography personalities, 3 layout densities, 3 section dividers. (Full values in Section 2 and 3 above.)

### `generateCourseDNA()` (`lib/ai/generate-course-dna.ts`)

```typescript
export function generateCourseDNA(courseId: string, title: string, difficulty: string): CourseDNA {
  const hash = crypto.createHash("sha256")
    .update(`${courseId}:${title}:${difficulty}`)
    .digest("hex");

  // 8 independent seed integers from different 4-hex-char windows of the hash
  const seeds = Array.from({ length: 8 }, (_, i) =>
    parseInt(hash.slice(i * 4, i * 4 + 4), 16)
  );

  const archetype = pick(ARCHETYPES, seeds[0]);
  const palette   = pick(PALETTES,   seeds[1]);

  return {
    dna_version: 1,
    content: {
      archetype_id:  archetype.id,
      writing_style: archetype.writingStyle,
      example_bias:  pick(["real_world_first", "theory_first", "analogy_first"], seeds[2]),
      question_tone: pick(["socratic", "direct_challenge", "reflective"],        seeds[3]),
    },
    render: {
      palette_id:       palette.id,
      primary_colour:   palette.primary,
      secondary_colour: palette.secondary,
      surface_colour:   palette.surface,
      image_aesthetic:  pick(IMAGE_AESTHETICS,         seeds[4]),
      bg_treatment:     pick(BG_TREATMENTS,            seeds[5]),
      typography:       pick(TYPOGRAPHY_PERSONALITIES, seeds[6]),
      layout_density:   archetype.layoutDensity,
      section_divider:  archetype.sectionDivider,
    },
  };
}
```

**Properties:**
- **Deterministic** — same inputs always produce same DNA. Re-running generation never changes visual identity.
- **Pure function** — no side effects, no DB calls.
- **Collision-resistant** — uses 8 independent seed windows from SHA-256 hash. Effectively zero probability of two different courses getting identical DNA.

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `lib/types/course-generator.ts` | Add | `CourseDNA` interface + `CourseDNASchema` (Zod) |
| `lib/ai/course-dna-catalogue.ts` | Create | All archetype/palette/render catalogue data |
| `lib/ai/generate-course-dna.ts` | Create | `generateCourseDNA()` pure function |
| `app/api/course/generate/route.ts` | Modify | Call `generateCourseDNA()`, persist DNA in same transaction |
| `lib/ai/agent-system-v2.ts` | Modify | Inject `content.writing_style` etc. into `LessonExpanderAgent` prompt |
| `components/course/block-renderer.tsx` | Modify | Replace `LessonVariantContext` with `CourseDNAContext` |
| `app/courses/[courseId]/layout.tsx` | Modify | Wrap with `CourseDNAContext.Provider` reading from `course.course_dna` |
| `components/course/SectionDivider.tsx` | Create | Render thin_rule / bold_number / dot_row from context |
| `supabase/migrations/` | Create | Add `course_dna JSONB`, `dna_fingerprint TEXT` columns to `courses` |

---

## Out of Scope

- Per-lesson DNA override (DNA is course-level only)
- Light/dark mode switching per DNA (all courses are dark-mode)
- Admin UI to manually set DNA (auto-generated only)
- DNA affecting quiz logic or assessment scoring
