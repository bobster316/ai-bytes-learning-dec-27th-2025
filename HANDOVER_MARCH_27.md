# Handover — 27 March 2026

## Summary

Today was a full-day implementation session delivering the **Lesson Quality Standard** — a permanent quality baseline for all AI Bytes lessons. The work covered three layers: component rendering fixes (Phase A), generator prompt rules (Phase C), and content sanitizer updates (Phase C), followed by regenerating the first reference lesson (Phase B).

All 11 code tasks are committed and merged to `main`. Three lessons (3577, 3578, 3579) have been freshly generated under the new standard and are live in course 834.

---

## What Was Done

### 1. Design Spec & Implementation Plan

- **Spec:** `docs/superpowers/specs/2026-03-27-lesson-quality-standard.md`
- **Plan:** `docs/superpowers/plans/2026-03-27-lesson-quality-standard.md`

The spec established 10 component fixes, generator prompt rules (LESSON_QUALITY_RULES), and a REPAIR/WARN separation in the sanitizer. The plan had 13 tasks — 11 code tasks + regeneration + verification.

---

### 2. Type Definitions — `lib/types/lesson-blocks.ts`

**Commits:** `1aeabe0`, `639b280`

Five optional fields added to existing block interfaces:

| Block | New Field | Purpose |
|-------|-----------|---------|
| `VideoSnippetBlock` | `description?: string` | 2-sentence context panel rendered below video |
| `FullImageBlock` | `explanation?: string` | 2–3 sentence interpretation of the visual |
| `FullImageBlock` | `layout?: "split" \| "hero"` | Controls split vs full-width render |
| `FlowDiagramBlock` | `explanation?: string` | Interpretation panel beneath diagram |
| `AppliedCaseBlock` | `tabs?: Array<{id, label, scenario, challenge, resolution, imageUrl?}>` | 3-tab structured interface |
| `RecapBlock` | `items?: Array<{title: string; body: string}>` | 4 rich card layout (replaces flat `points[]`) |

All fields are optional — full backward compatibility. Legacy `points: string[]` on RecapBlock now has a `// Legacy — used when items is absent` comment.

---

### 3. Component Changes

#### 3.1 `components/course/blocks/image-text-row.tsx` — Commit `0df9f55`
- Removed `border border-white/5` from image container
- Added `shadow-sm` for depth

#### 3.2 `components/course/blocks/video-snippet.tsx` — Commits `d058fc0`, `bb72679`
- Removed `border border-[#00FFB3]/20` from video container
- Restructured left column to `flex flex-col` so the description sits below the video naturally
- **New description panel:** shown when `props.description` is present:
  ```tsx
  <div className="mt-3 px-5 py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/[0.06]">
    <p className="font-body italic text-sm text-[#B0B0C8] leading-relaxed">
      {props.description}
    </p>
  </div>
  ```
- Panel is completely hidden when `description` is empty/missing

#### 3.3 `components/course/blocks/full-image-section.tsx` — Commit `e874bc5`
- `rounded-[2.5rem]` → `rounded-xl` (less chunky)
- **Conditional split layout:**
  ```tsx
  const showSplit = !!explanation && layout !== "hero"
  ```
  - When true: image 55% left, explanation text 45% right (2-column)
  - When false: full-width image, explanation in card beneath (or hidden if absent)
  - Hero images explicitly opt out with `layout: "hero"`

#### 3.4 `components/course/blocks/flow-diagram.tsx` — Commit `885c405`
- New explanation inset card appended after the diagram:
  ```tsx
  {explanation && (
    <div className="mt-8 px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm">
      <p className="font-body text-sm text-[#B0B0C8] leading-relaxed">{explanation}</p>
    </div>
  )}
  ```

#### 3.5 `components/course/blocks/applied-case.tsx` — Commit `b09d675`
Full redesign replacing the old 2-tab static layout:
- `useState(0)` for active tab index
- Normalises input: `tabs = props.tabs?.length > 0 ? props.tabs : [legacy single-tab fallback]`
- Tab bar is conditionally shown only when `tabs.length > 1`
- Per-tab optional image:
  ```tsx
  {tab.imageUrl && (
    <div className="mb-6 w-full aspect-video rounded-xl overflow-hidden">
      <img src={tab.imageUrl} ... />
    </div>
  )}
  ```
- If no image: accent icon block shown instead (intentional, not a blank gap)
- `AnimatePresence mode="wait"` with `key={activeTab}` for smooth transitions
- `ACCENT_COLOURS = ["#00FFB3", "#4b98ad", "#FFB347"]` cycles through tabs

#### 3.6 `components/course/blocks/prediction.tsx` — Commit `0416429`
Full visual redesign:
- **Gradient card container:** `linear-gradient(135deg, ${accentHex}10 0%, ${accentHex}06 100%)` with `border: 1px solid ${accentHex}25`
- **Each option:** `flex items-stretch` with coloured left accent bar + inner `flex items-center gap-4 px-5 py-4`
- **Numbered badge:** `w-7 h-7 rounded-full` showing A/B/C
- **State colours:** correct→`#00FFB3`, wrong→`#FF6B6B`, idle→`${accentHex}40`, dim→`rgba(255,255,255,0.05)`
- `space-y-4` vertical breathing room

#### 3.7 `components/course/blocks/type-cards.tsx` — Commit `c339672`
- BentoCard: `h-32` → `aspect-video`
- GridLayout: `h-24 sm:h-28 border border-white/5` → `aspect-video`
- HorizontalLayout: `w-24 h-24 border border-white/5` → `w-28 h-20`
- All image container borders removed

#### 3.8 `components/course/blocks/recap-slide.tsx` — Commits `6e6f3d5`, `bb72679`
- New `BoxStyle` layout function for when `items[]` is present:
  - 2×2 grid on desktop, 1-column on mobile
  - `ACCENT_CYCLE = [accent, "#4b98ad", "#FFB347", "#FF6B6B"]` — rotates per card
  - Each card: numbered badge + bold `item.title` heading + `item.body` 2-sentence text
- `RecapSlide`: `if (items.length > 0) return <BoxStyle>` else falls through to legacy `BentoStyle`
- Dead code removed in `bb72679`: `CardStyle`, `MinimalStyle`, `RECAP_STYLES` (never used) deleted
- `archetypeOffset` import removed (was unused)

---

### 4. Generator Changes — `lib/ai/agent-system-v2.ts`

**Commits:** `8f1d968`, `bb72679`

#### 4.1 `getBlockSchemaDoc` — 7 entries updated

| Block | What changed |
|-------|-------------|
| `video_snippet` | Added `description` as REQUIRED field with 2-sentence rule |
| `full_image` | Added REQUIRED `explanation` (2–3 sentences, must interpret not describe) + `layout` hint |
| `flow_diagram:steps` | Added REQUIRED `explanation` (what the diagram reveals) |
| `flow_diagram:contrast` | Added REQUIRED `explanation` (interpret comparison, not describe) |
| `applied_case` | Now requires exactly 3 `tabs`, each with scenario/challenge/resolution + optional imageUrl |
| `recap` | Now requires `items[]` array with exactly 4 entries, each having `title` (4–6 words) + `body` (2 sentences) |
| `key_terms` | Minimum 12 terms; each term MUST have a `definition` field (2 sentences) |

#### 4.2 `LESSON_QUALITY_RULES` constant

Added at module scope (not inside the function — fixed in `bb72679` to prevent recreation on every call). Injected between the `BE LITERAL. BE ACCURATE. BE TECHNICAL.` line and the `BANNED_WORDS_INSTRUCTION`:

```
LESSON CONTENT QUALITY RULES — ABSOLUTE LAW:

STRUCTURE:
  • objective block:      exactly 2 sentences
  • video_snippet blocks: REQUIRED field "description" — 2 sentences
  • recap blocks:         exactly 4 items; each MUST have "title" (4–6 words) AND "body" (2 sentences)
  • applied_case blocks:  exactly 3 scenarios/tabs; each may include imageUrl
  • key_terms blocks:     minimum 12 terms; each MUST have a full "definition" field (2 sentences)

TEXT QUALITY:
  • text blocks: 3–5 paragraphs per block; max 3 sentences per paragraph
  • no long compound sentences joined by multiple clauses
  • reduce verbosity by 15%

IMAGE EXPLANATIONS (semantic quality rule):
  • full_image blocks:    REQUIRED "explanation" — 2–3 sentences
  • flow_diagram blocks:  REQUIRED "explanation" — 2–3 sentences
  • type_cards cards:     REQUIRED "body" — 3–4 sentences per card
  • ALL explanations must INTERPRET the visual, not merely describe what is visible

LAYOUT HINTS:
  • full_image blocks: layout: "split" when explanation present, layout: "hero" for standalone
```

---

### 5. Sanitizer Changes — `lib/ai/content-sanitizer.ts`

**Commits:** `07c926a`, `bb72679`

#### Strict REPAIR / WARN separation

**REPAIR (deterministic, no semantic content invented):**
- `recap` block: dual-format handler — if `items[]` array exists, use it; if not, fall back to `points[]`; if both missing, fill empty arrays (REPAIR is safe because the component handles empty gracefully)
- `key_terms` field normalisation: `key_terms` → `terms`, `keyTerms` → `terms` (three field name variants Gemini may use)
- Paragraph splitting REPAIR for `text` blocks with a single paragraph > 300 chars; added `hasAbbreviations` guard to skip splitting when `e.g.`, `vs.`, `i.e.`, `etc.`, `no.` are detected

**WARN (missing semantic content — log + pass through, never fabricate):**
- `video_snippet` missing `description` → `console.warn`
- `full_image` missing `explanation` → `console.warn`
- `flow_diagram` missing `explanation` → `console.warn`
- `recap` with fewer than 4 `items` → `console.warn`
- `key_terms` array shorter than 12 → `console.warn`
- `applied_case` with `tabs.length !== 3` → `console.warn` (added in `bb72679`)

#### Key bug fixes in `bb72679`
- **`hasAbbreviations` guard:** regex `/[^.!?]+[.!?]+[\s]*/g` was splitting on `e.g.`, `vs.` etc. — now skips splitting when common abbreviations detected
- **`applied_case` tabs WARN:** was missing from original sanitizer pass; added WARN when tabs count ≠ 3

---

### 6. Block Renderer Fix — `components/course/block-renderer.tsx`

**Not committed yet — applied this session**

Fixed `key_terms` normalisation in the renderer to handle all three field name variants:

```tsx
const resolvedTerms = Array.isArray(b.terms) ? b.terms
    : Array.isArray(b.key_terms) ? b.key_terms
    : Array.isArray(b.keyTerms) ? b.keyTerms
    : [];
renderBlock = { ...b, terms: resolvedTerms };
```

This was needed because lesson 3578 came back from Gemini with `keyTerms` (camelCase). The sanitizer now normalises this at DB-write time, but the renderer fix provides a second safety net for any existing lessons.

---

### 7. Lesson Regeneration (Phase B)

#### Course / Topic details
- **Course:** 834 — "Decoding Attention: Mastering Attention Mechanisms in Transformers" (Intermediate)
- **Topic (Module):** 1469 — "Decoding Attention Mechanisms in Transformers"
- **Previous lesson:** 3573 (deleted manually in a prior session — the module had 0 lessons at start of today)

#### Generation script
**File:** `scripts/regen-lesson-3573.ts`

Directly invokes `LessonExpanderAgent.expandLesson()` with correct field names (`lessonTitle`, `microObjective`). The first attempt used `title`/`description` — Gemini silently generated content about entirely wrong topics (Narrative Hooks, Style Transfer, Optimisation Algorithms) because the prompt placeholders were `undefined`. The wrong lessons (3574–3576) were deleted and regenerated correctly.

#### Lessons generated

| ID | Title | Blocks | key_terms | recap.items | applied_case.tabs |
|----|-------|--------|-----------|-------------|-------------------|
| 3577 | What Is Attention? The Intuition Behind the Mechanism | 17 | 12 ✅ | 4 ✅ | 3 ✅ |
| 3578 | Self-Attention and Scaled Dot-Product Attention | 18 | 12 ✅ | 4 ✅ | 3 ✅ |
| 3579 | Multi-Head Attention and Positional Encoding | 17 | 13 ✅ | 4 ✅ | 3 ✅ |

All three lessons return HTTP 200:
- `http://localhost:3000/courses/834/lessons/3577`
- `http://localhost:3000/courses/834/lessons/3578`
- `http://localhost:3000/courses/834/lessons/3579`

#### Quality field check on generated lessons

| Field | 3577 | 3578 | 3579 |
|-------|------|------|------|
| `full_image.explanation` | ✅ | ✅ | ✅ |
| `full_image.layout` | not set (→ split, correct) | not set (→ split, correct) | `"split"` ✅ |
| `flow_diagram.explanation` | ✅ | ✅ | ✅ |
| `video_snippet.description` | n/a (no VS) | n/a (no VS) | ✅ "This video visually explains..." |

---

### 8. Bugs Found and Fixed During Session

| Bug | Location | Fix |
|-----|----------|-----|
| Wrong lesson topic content | `scripts/regen-lesson-3573.ts` | Script used `lesson.title` but prompt reads `lesson.lessonTitle` and `lesson.microObjective` — fixed field names |
| `keyTerms` camelCase not recognised | `components/course/block-renderer.tsx` | Added fallback chain: `b.terms || b.key_terms || b.keyTerms` |
| `keyTerms` saved to DB without normalisation | `lib/ai/content-sanitizer.ts` | Added normalisation in sanitizer to always save as `terms` |
| Dead code in recap-slide | `components/course/blocks/recap-slide.tsx` | Deleted `CardStyle`, `MinimalStyle`, `RECAP_STYLES` (never called) |
| `LESSON_QUALITY_RULES` recreated on every call | `lib/ai/agent-system-v2.ts` | Moved from inside `expandLesson` to module scope |
| Paragraph splitting on abbreviations | `lib/ai/content-sanitizer.ts` | Added `hasAbbreviations` guard before running split logic |
| `applied_case` tabs had no WARN in sanitizer | `lib/ai/content-sanitizer.ts` | Added WARN when `tabs.length !== 3` |
| `font-serif` not in Tailwind config | `components/course/blocks/video-snippet.tsx` | Changed to `font-body` |

---

## Commit History (Today)

```
bb72679  fix: address code review issues — dead code, abbreviation guard, applied_case warn, font check, quality rules scope
8f1d968  feat: inject lesson quality rules into LessonExpanderAgent; update 7 block schema docs
07c926a  feat: sanitizer — WARN for missing semantic fields, REPAIR for recap items and paragraph splitting
6e6f3d5  feat: recap-slide — add BoxStyle for items[] (4 coloured cards with title + body)
0416429  feat: prediction block visual redesign — gradient card, left-accent option bars, numbered badges
c339672  fix: type-cards — image area to aspect-video, remove image container borders
885c405  feat: add explanation inset card to flow-diagram block
b09d675  feat: applied-case redesign — 3-tab layout with optional image per tab, backward-compatible
e874bc5  feat: full-image-section — rounded-xl, conditional split layout for explanation field
d058fc0  feat: add description panel below video, remove green border from video-snippet
0df9f55  fix: remove border from image-text-row image container
639b280  fix: add legacy field comments to RecapBlock and AppliedCaseBlock
1aeabe0  feat: add 5 optional fields to lesson block types
6ec6e46  docs: tighten lesson quality spec — four clarifications
b717d62  docs: lesson quality standard design spec
```

---

## Files Modified Today

| File | Changes |
|------|---------|
| `lib/types/lesson-blocks.ts` | +5 optional fields across 5 block types |
| `components/course/blocks/image-text-row.tsx` | Remove border, add shadow-sm |
| `components/course/blocks/video-snippet.tsx` | Description panel, remove green border, font fix |
| `components/course/blocks/full-image-section.tsx` | rounded-xl, conditional split layout |
| `components/course/blocks/flow-diagram.tsx` | explanation inset card |
| `components/course/blocks/applied-case.tsx` | Full 3-tab redesign with optional images |
| `components/course/blocks/prediction.tsx` | Gradient card, accent bars, numbered badges |
| `components/course/blocks/type-cards.tsx` | aspect-video image areas, remove borders |
| `components/course/blocks/recap-slide.tsx` | BoxStyle (4-card grid), dead code removed |
| `lib/ai/agent-system-v2.ts` | 7 schema docs updated, LESSON_QUALITY_RULES injected |
| `lib/ai/content-sanitizer.ts` | REPAIR/WARN separation, field normalisation, abbreviation guard |
| `components/course/block-renderer.tsx` | key_terms field name normalisation |
| `scripts/regen-lesson-3573.ts` | New script (lesson generation utility) |

---

## What Is NOT Done / Known Gaps

### Generator still uses lesson analogy domains for style, not content
The `CourseStateManager.getNextDomain()` picks a metaphorical analogy domain (Culinary, Nature, Architecture, etc.). This is fine — it's used as a stylistic framing device. The lesson topic must be supplied via `lessonTitle` + `microObjective`. **Critical: if either field is undefined, Gemini generates plausible but completely wrong content.** The script `scripts/regen-lesson-3573.ts` now correctly sets these.

### `full_image.layout` not always set by Gemini
Lessons 3577 and 3578 came back without `layout` set. This works correctly because the component logic is:
```tsx
const showSplit = !!explanation && layout !== "hero"
```
When `layout` is undefined, `layout !== "hero"` is true, so split renders when explanation is present. However, the LESSON_QUALITY_RULES prompt tells Gemini to set `layout: "split"` explicitly — compliance will improve over time.

### `recap` still saves `points[]` alongside `items[]`
Gemini generates both fields in some responses. The sanitizer uses `items[]` first. `points[]` is harmlessly ignored by the component. No action needed.

### DB migration for `course_dna` column still pending
`supabase/migrations/20260326_course_dna.sql` — must be applied manually in Supabase Studio. Without it, all courses fall back to `defaultRender`. This was a pre-existing gap, not introduced today.

### `SectionDivider.tsx` not yet inserted into block-renderer
Built previously, but not wired between blocks. Pre-existing gap.

### V1 generation route still active
`app/api/course/generate/route.ts` uses the old `AgentOrchestrator` (v1). The v2 route (`generate-v2`) is separate. The quality rules only apply to v2 generation. A TODO comment exists in `app/api/course/generate/route.ts`.

---

## How to Resume

### Continue quality improvements
All 10 spec components are done. Future work:
1. Add `body` field (3–4 sentences) to type_cards `CardData` type — generator rule is set, component isn't wired yet
2. Wire `SectionDivider` between blocks in block-renderer
3. Migrate main generation route from v1 to v2

### Generate more lessons with the new standard
Use `scripts/regen-lesson-3573.ts` as a template. Critical rules:
- Field names must be `lessonTitle` (not `title`) and `microObjective` (not `description`)
- Verify content topic matches by checking `lesson_header.title` in the generated blocks
- The sanitizer logs are all expected warnings — check that no "ERROR" lines appear

### Dev server
Running on port 3000. Start with `npm run dev` if not running.

### V2 generator flag
Set `NEXT_PUBLIC_USE_V2_GENERATOR=true` in `.env.local` to use v2 pipeline.

---

## Reference Lesson URLs

- Lesson 3577 (reference): `http://localhost:3000/courses/834/lessons/3577`
- Lesson 3578: `http://localhost:3000/courses/834/lessons/3578`
- Lesson 3579: `http://localhost:3000/courses/834/lessons/3579`
- Admin edit: `http://localhost:3000/admin/courses/edit/834`
