# HANDOVER — 16 March 2026

**Project:** AI Bytes Learning
**Working directory:** `D:\ai-bytes-leaning-22nd-feb-2026 Backup`
**Dev server:** `npm run dev` (not auto-running)
**Test lesson URL:** `http://localhost:3000/courses/772/lessons/3473`
**V2 generator flag:** `NEXT_PUBLIC_USE_V2_GENERATOR=true`

---

## What Was Completed Today

### 1. Duplicate Block Key Bug — Fixed

**Problem:** The V2 generator was occasionally emitting two blocks with the same `id` (e.g. `les_002_interactive_vis`). React was warning:
```
Encountered two children with the same key, `les_002_interactive_vis`
```

**Fix:** `components/course/block-renderer.tsx`
Changed:
```tsx
<React.Fragment key={block.id}>
```
To:
```tsx
<React.Fragment key={`${block.id}-${idx}`}>
```
This guarantees unique keys even if the generator emits duplicate IDs, without requiring the generator to be fixed.

---

### 2. Master Lesson Structure — Generator Rewritten

**File:** `lib/ai/agent-system-v2.ts` — `LessonExpanderAgent.expandLesson()` prompt

The entire generator prompt was rewritten to follow a **22-block role system**. The old prompt used vague rules ("include 4-5 callouts", "25-35 blocks"). The new prompt defines each block's **pedagogical purpose and role**, giving the AI structure to follow.

**22 Block Roles (in order):**

| # | Role | Block Type | Status |
|---|------|-----------|--------|
| 1 | Lesson header | `lesson_header` | MANDATORY |
| 2 | Hook | `punch_quote` | MANDATORY |
| 3 | Learning outcomes | `objective` | MANDATORY |
| 4 | Hero media | `video_snippet` OR `full_image` | MANDATORY |
| 5 | Context cards | `type_cards` layout=`grid` | MANDATORY |
| 6 | Instructor insight | `instructor_insight` | MANDATORY |
| 7 | Foundation concept | `text` (only long text block allowed) | MANDATORY |
| 8 | Comparison | `flow_diagram` contrast OR `type_cards` layout=`horizontal` | MANDATORY |
| 9 | Concept card grid | `type_cards` layout=`numbered` | MANDATORY |
| 10 | Process / anatomy | `flow_diagram` steps OR `mindmap` | MANDATORY |
| 11 | Visual explainer | `concept_illustration` OR `image_text_row` | MANDATORY |
| 12 | Knowledge check | `prediction` | MANDATORY |
| 13 | Applied example | `applied_case` | MANDATORY |
| 14 | Real-world use cases | `industry_tabs` | MANDATORY |
| 15 | Technical example | `interactive_vis` | OPTIONAL (Intermediate/Advanced only) |
| 16 | Warning / misconception | `callout` variant=`warning` | MANDATORY |
| 17 | Practice activity | `open_exercise` | MANDATORY |
| 18 | Reflection | `go_deeper` OR `text` | OPTIONAL (Intermediate/Advanced only) |
| 19 | Recap | `recap` | MANDATORY |
| 20 | Quiz | `quiz` | MANDATORY |
| 21 | Glossary | `key_terms` | MANDATORY |
| 22 | Completion | `completion` | MANDATORY |

**Target block counts by difficulty:**
- Beginner: 14–18 blocks
- Intermediate: 16–20 blocks
- Advanced: 18–24 blocks

**Old prompt block count:** 25–35+ (too many, padding was happening)

**Evaluator** (`EvaluatorAgent`) was also updated to check role-by-role against the master structure rather than using the old generic checklist.

---

### 3. Visual Variation System — Fully Implemented

The core problem: every lesson looked identical — same purple accent colour, same card layout, same dark/light section rhythm. Fixed with a **4-dimension variation system.**

#### Dimension 1: Lesson Accent Colour (auto-derived)

**File:** `components/course/block-renderer.tsx`

A `LessonVariantContext` React context is computed once per lesson from a hash of the first block's ID. Four lessons in a row will have four different dominant accent colours:

| Variant | Accent | Colour |
|---------|--------|--------|
| 0 | pulse | `#00FFB3` (green) |
| 1 | iris | `#9B8FFF` (purple) |
| 2 | amber | `#FFB347` (orange) |
| 3 | nova | `#FF6B6B` (red/pink) |

This accent flows into: ObjectiveCard gradient border, TypeCards card accents, RecapSlide gradient, section glows.

```tsx
export const LessonVariantContext = React.createContext<LessonVariant>({
    variant: 0, accent: "#9B8FFF", accentName: "iris",
});
```

Components that read it: `ObjectiveCard`, `TypeCards`, `RecapSlide`.

#### Dimension 2: TypeCards — 4 Distinct Layouts

**File:** `components/course/blocks/type-cards.tsx` (fully rewritten)

The generator emits a `layout` field on each `type_cards` block. The block-renderer also auto-cycles layouts based on position within the lesson if the generator doesn't specify one.

| Layout | Appearance | Used At |
|--------|-----------|---------|
| `bento` | Featured first card spans 2 cols, sparkline chart | Extra/default |
| `grid` | Equal 3–4 col grid, top accent border, no featured | Role 5 (context cards) |
| `horizontal` | Full-width rows with left accent colour bar, index pill | Role 8 (comparison) |
| `numbered` | Large faded `01 02 03` watermark number, card style | Role 9 (concept grid) |

The `TypeCards` component now has four sub-layout renderers: `BentoLayout`, `GridLayout`, `HorizontalLayout`, `NumberedLayout`.

**Auto-cycling logic in block-renderer:** If the generator doesn't specify `layout`, the renderer derives one from `(typeCardsCounter + lessonVariant.variant) % 4`, so even existing lessons will show different layouts.

#### Dimension 3: RecapSlide — 3 Visual Styles

**File:** `components/course/blocks/recap-slide.tsx` (fully rewritten)

The generator emits a `style` field on the `recap` block. If absent, the lesson variant determines the style.

| Style | Appearance |
|-------|-----------|
| `card` | Dark gradient card, numbered gradient circles (original look) |
| `minimal` | Clean text-only, large faded mono numbers (`01 02 03`), horizontal divider |
| `striped` | 3 equal columns side by side, each with coloured top border accent |

Each style also uses the lesson accent colour from context.

#### Dimension 4: Section Background Variation

**File:** `components/course/block-renderer.tsx`

Four different `SURFACE_BG` sets (which block types get the dark `#0f0f1a` background treatment). The set used depends on the lesson variant, so the dark/glass rhythm shifts between lessons:

- Variant 0: `type_cards` + `industry_tabs` dark, `prediction` glass
- Variant 1: `prediction` + `applied_case` dark, `type_cards` glass
- Variant 2: Everything dark (most contrast)
- Variant 3: Minimal dark — only `quiz`, `interactive_vis`, `industry_tabs`, `applied_case`

#### ObjectiveCard Updated

**File:** `components/course/blocks/objective-card.tsx`

Now reads `LessonVariantContext` to use the lesson accent colour in its gradient border, scan line, icon, and label. Previously hardcoded to `#00FFB3` (green) on every lesson.

---

### 4. New Type Definitions

**File:** `lib/types/lesson-blocks.ts`

Added optional fields:
```ts
export interface TypeCardsBlock extends BaseBlock {
    layout?: "bento" | "grid" | "horizontal" | "numbered";
    ...
}

export interface RecapBlock extends BaseBlock {
    style?: "card" | "minimal" | "striped";
    ...
}
```

---

## Current V2 Lessons in Database

| Lesson ID | Blocks | Title |
|-----------|--------|-------|
| 3488 | 27 | Types of Machine Learning |
| 3487 | 18 | What is Machine Learning? |
| 3478 | 25 | Ethical Implications and Responsible AI |
| 3477 | 24 | Prompt Engineering and Content Generation |
| 3476 | 21 | GANs and VAEs: A Deep Dive |
| 3475 | 18 | Introduction to Generative Models |
| 3474 | 19 | How Neural Networks Learn |
| 3473 | 21 | What is a Neural Network? |

Lessons 3479–3486 are V1 (zero `content_blocks`, markdown only).

---

## Files Changed Today

| File | What Changed |
|------|-------------|
| `components/course/block-renderer.tsx` | Duplicate key fix; `LessonVariantContext`; 4 SURFACE_BG sets; TypeCards layout cycling |
| `components/course/blocks/type-cards.tsx` | Full rewrite — 4 layout modes (bento/grid/horizontal/numbered) |
| `components/course/blocks/recap-slide.tsx` | Full rewrite — 3 style modes (card/minimal/striped), uses lesson accent |
| `components/course/blocks/objective-card.tsx` | Now reads lesson accent from context for all coloured elements |
| `lib/types/lesson-blocks.ts` | Added `layout?` to `TypeCardsBlock`, `style?` to `RecapBlock` |
| `lib/ai/agent-system-v2.ts` | Full rewrite of `LessonExpanderAgent` prompt (22-role structure); evaluator updated |

---

## Architecture of the Variation System

```
LessonBlockRenderer
  │
  ├── Computes lessonVariant from hash(blocks[0].id) → { variant: 0–3, accent: hex }
  │
  ├── Picks SURFACE_BG_SETS[variant] — which blocks get dark bg
  │
  ├── Tracks typeCardsCounter — cycles TypeCards layout if generator didn't specify
  │
  └── LessonVariantContext.Provider wraps all blocks
        │
        ├── ObjectiveCard  — reads accent for border/icon/label colour
        ├── TypeCards      — reads accent for card highlight colours
        └── RecapSlide     — reads accent + variant for style selection
```

---

## Next Steps (Recommended)

1. **Generate a new lesson** via admin dashboard to verify all 22 block roles appear correctly and that `layout` / `style` fields are present in the JSON output.

2. **Visual QA** — run the Playwright screenshot script against lessons from different courses. You should now see clearly different visual styles: one lesson green, one purple, one amber, one with striped recap, one with horizontal cards, etc.

3. **Playwright script (from memory):**
```js
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/courses/772/lessons/3473', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    for (let y = 0; y <= 6000; y += 150) {
        await page.evaluate(yy => window.scrollTo(0, yy), y);
        await page.waitForTimeout(60);
    }
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'C:/Users/ravkh/Downloads/screenshot.png', fullPage: true });
    await browser.close();
})();
```

4. **Right-rail section progress dots** — still not built. Fixed-right dots (8px circles), active = pulse/lesson accent, highlights current section on scroll. Was discussed in previous sessions but not yet implemented.

5. **ElevenLabs audio** — quota reset 14 March. Generate audio via admin and verify the hero audio player activates.

6. **Veo video generation** — model `veo-3.1-generate-preview`. Verify it fires async after lesson save and that `video_snippet` blocks show the video once URL is populated.

---

## Known Issues

- Lessons 3479–3486 have zero `content_blocks` (V1 markdown only). They render as basic HTML via `lesson-renderer-v2.ts`. To upgrade them, re-generate via admin.
- The V2 generator can still occasionally emit duplicate block IDs — the block-renderer now handles this gracefully with `key={block.id}-${idx}`, but it would be better fixed in the generator too.
- `interactive_vis` currently renders a static code viewer (no actual chart). This is intentional for MVP but is a placeholder.

---

## Key Constants (for reference)

```
Brand accent colours:
  --pulse: #00FFB3 (green)
  --iris:  #9B8FFF (purple)
  --amber: #FFB347 (orange)
  --nova:  #FF6B6B (red/pink)

Fonts:
  font-display  → Syne 800 (headings)
  font-body     → Instrument Serif italic (body text)
  font-mono     → DM Mono (labels, data, numbers)

Layout widths:
  Wide blocks:  max-w-[1140px]
  Narrow text:  max-w-[840px]
  Ending:       max-w-[760px]

Background: #0a0a0f (near-black)
Surface:    #0f0f1a (dark section bg)
```

---

## Environment

- Dev server: `npm run dev` from `D:\ai-bytes-leaning-22nd-feb-2026 Backup`
- Backup snapshot (read-only): `D:\Backup 14th March 2026` — do NOT edit this
- Test course: Course 772 (Neural Networks), lessons 3473–3478 — all V2
- Admin dashboard: `http://localhost:3000/admin`
- V2 generation: `/api/course/generate-v2`
