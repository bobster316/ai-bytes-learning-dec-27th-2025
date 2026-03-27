# Lesson Quality Standard — Design Spec
> Date: 2026-03-27
> Scope: Component code (A) + Generator prompt rules (C), then lesson regeneration (B)

---

## Goal

Establish a permanent quality baseline for all AI Bytes lessons. Every lesson generated from this point forward must meet the visual, structural, and content standards defined here. The standard is enforced at two layers: generation time (prompt rules) and save time (sanitizer — deterministic repairs only).

---

## Section 1 — Component Changes

### 1.1 Image borders — all image-bearing blocks

**Problem:** `border border-white/5` with `rounded-[2.5rem]` reads as chunky and heavy.

**Fix (applies to: `image-text-row`, `full-image-section`, `type-cards`, `lesson-header`):**
- Remove all `border` classes from image containers
- Reduce corner radius: `rounded-[2.5rem]` → `rounded-xl`
- A faint `shadow-sm` or `shadow-[0_2px_12px_rgba(0,0,0,0.3)]` may remain for depth

---

### 1.2 `video_snippet` — description below video

**Problem:** No explanation of what the viewer is about to see or why it matters.

**Fix:**
- Render a `description` field (2 sentences max) below the video player
- Style: compact inset panel, `bg-white/5 backdrop-blur-sm`, italic text, `text-sm`, proper line-height
- Must be legible and substantive — NOT a faint decorative tag
- If `description` is empty/missing, panel is hidden entirely (no blank space)

---

### 1.3 `prediction` block — visual redesign

**Problem:** Flat, minimal, generic.

**Fix:**
- Gradient card background using CourseDNA palette accent
- Numbered insights with coloured left-accent bars
- Icon per insight (or numbered badge)
- More vertical breathing room between items

---

### 1.4 `full_image` block — conditional split layout

**Problem:** Image alone with no context.

**Rule (conditional — not mandatory):**
- **If** `explanation` field is present AND `layout` is not explicitly `"hero"` → render as split layout: image 55% left, explanation text 45% right
- **Otherwise** → full-width image with `explanation` text in a card beneath (or no text if absent)
- This preserves hero-style full-bleed usage where appropriate

---

### 1.5 `flow_diagram` block — explanation field

**Problem:** Diagram rendered with no interpretive text.

**Fix:**
- Show `explanation` field in a soft inset card beneath the diagram
- If empty, hide the card cleanly

---

### 1.6 `applied_case` block — 3 tabs + optional images

**Problem:** 2 tabs, no images.

**Fix:**
- Generator must produce exactly 3 scenarios
- Each tab may include an optional `imageUrl`
- If `imageUrl` is present: render image at top of tab panel, content below
- If `imageUrl` is absent: panel must still look intentional — use a coloured icon or accent block instead of a broken placeholder

---

### 1.7 `image_text_row` — breathing room, no border, responsive

**Problem:** Visible border, text column too constrained.

**Fix:**
- Remove border from image container
- Text column: supports 3–4 paragraphs at `text-sm`/`text-base`
- Desktop: 50/50 column split
- Mobile: stacks vertically (image first, then text — unless `reverse` prop, then text first)
- This responsive stacking is already implied by Tailwind `md:` breakpoints; preserve it explicitly

---

### 1.8 `type_cards` — expanded cards with body text

**Problem:** Small image, 1-line description, wasted space.

**Fix:**
- Image fills top region of card (aspect ratio `16/9` or `4/3`, not square thumbnail)
- Body text: 3–4 short sentences explaining the card's concept and why it matters
- Card grid: collapses to 1-per-row when content is rich (auto via CSS grid `min()` sizing)
- No oversized empty space — padding is consistent and tight

---

### 1.9 `recap` — 4 richly structured boxes

**Problem:** Simple bullet list.

**Fix:**
- Exactly 4 coloured cards, one per key takeaway
- Each card: `title` (bold, 4–6 words) + `body` (2 sentences expanding on it)
- Cards use CourseDNA palette accent colours (rotate through palette entries)
- Layout: 2×2 grid on desktop, 1-column on mobile

---

### 1.10 `key_terms` — minimum 12 terms enforced

**No component change required.** Enforcement is at generator and sanitizer level (see Section 2).

---

## Section 2 — Generator Prompt Rules

These rules are injected as a mandatory block in `LessonExpanderAgent` prompt. They override all prior defaults.

### 2.1 The Core Rules

```
LESSON CONTENT QUALITY RULES — ABSOLUTE LAW:

STRUCTURE:
  • objective block:      exactly 2 sentences — state what the learner will understand and why it matters
  • video_snippet blocks: REQUIRED field "description" — exactly 2 sentences: (1) what the viewer will see, (2) why it matters for this lesson
  • recap blocks:         exactly 4 items; each item MUST have "title" (4–6 words) AND "body" (2 sentences)
  • applied_case blocks:  exactly 3 scenarios/tabs; each tab may include imageUrl
  • key_terms blocks:     minimum 12 terms; each term MUST have a full "definition" field (2 sentences)

TEXT QUALITY:
  • text blocks: 3–5 paragraphs per block; max 3 sentences per paragraph
  • prefer concise sentences — no long compound sentences joined by multiple clauses
  • no paragraph should feel dense, essay-like, or academic
  • reduce verbosity; say more with less

IMAGE EXPLANATIONS (semantic quality rule):
  • full_image blocks:    REQUIRED field "explanation" — 2–3 sentences
  • flow_diagram blocks:  REQUIRED field "explanation" — 2–3 sentences
  • type_cards cards:     REQUIRED field "body" — 3–4 sentences per card
  • ALL explanations must INTERPRET the visual, not merely describe what is visible
    BAD:  "This image shows a transformer model."
    GOOD: "The visual highlights how attention links tokens across distance, which
          helps the model preserve context that older sequential approaches often lost."

LAYOUT HINTS (include these fields to guide rendering):
  • full_image blocks: set layout: "split" when explanation is present, layout: "hero" for standalone atmosphere images
```

### 2.2 Save-time enforcement (content-sanitizer.ts)

**Repair (deterministic — safe to auto-fix):**
- Missing `accentColour`, `icon`, `layout` defaults → fill from schema defaults
- Wrong field aliases (e.g. `heading` instead of `title`) → remap
- `paragraphs` array with one giant paragraph → split on `. ` into shorter entries
- key_terms array shorter than 12 → flag as warning (do NOT invent fake terms)

**Fail / warn, do NOT invent:**
- Missing `description` on video_snippet → log warning, leave empty (component hides it gracefully)
- Missing `explanation` on full_image or flow_diagram → log warning, component falls back to full-width
- recap items fewer than 4 or missing `body` → log warning, save as-is (better sparse than fabricated)

---

## Section 3 — Implementation Order

1. **Component code** — fix borders, video description, prediction, full_image split, flow_diagram explanation, applied_case tabs, image_text_row, type_cards, recap
2. **Generator prompts** — inject new quality rules into `LessonExpanderAgent` in `lib/ai/agent-system-v2.ts`
3. **Sanitizer** — update `lib/ai/content-sanitizer.ts` with new deterministic repairs + warnings
4. **Lesson regeneration (B)** — delete and regenerate lesson 3573 with the new standard in effect

---

## Files Affected

| File | Change |
|------|--------|
| `components/course/blocks/image-text-row.tsx` | Remove border, expand text, responsive stack |
| `components/course/blocks/full-image-section.tsx` | Conditional split layout, reduced radius |
| `components/course/blocks/type-cards.tsx` | Expanded cards, bigger image area, body text |
| `components/course/blocks/video-snippet.tsx` | Add description panel |
| `components/course/blocks/prediction.tsx` | Visual redesign |
| `components/course/blocks/flow-diagram.tsx` | Add explanation field display |
| `components/course/blocks/applied-case.tsx` | 3 tabs, optional image per tab |
| `components/course/blocks/recap-slide.tsx` | 4-box layout with title + body |
| `lib/ai/agent-system-v2.ts` | Inject new quality rules into LessonExpanderAgent |
| `lib/ai/content-sanitizer.ts` | Update deterministic repairs, add warnings |
