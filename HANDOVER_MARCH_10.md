# Handover — 10 March 2026

## Session Summary
Review-only + design vision session. NO application code was changed.
Two things produced: (1) gap analysis of current lesson quality, (2) visual mockup prototype at `lesson_design_mockup.html`.

---

## Primary Mission
User directive: **AI Bytes must be the world's best micro-learning platform.** Better than every competitor. Award-winning. Students must love it, recommend it, achieve objectives. Everything must be next-level.

---

## Unrecorded Work (9 March 14:09–18:38) — Already in Codebase

| File | Change |
|------|--------|
| `lib/ai/image-service.ts` | Hybrid image: Gemini (hero) + Pexels parallel (secondary) |
| `app/api/course/generate-v2/route.ts` | Hybrid image strategy integrated |
| `components/course/blocks/text-section.tsx` | Pull-quote, stat callout, key-term highlighting |
| `components/course/blocks/full-image-section.tsx` | Parallax scroll, shimmer, callout hotspots |
| `components/course/blocks/objective-card.tsx` | Gradient border, scan-line animation |
| `components/course/blocks/completion-card.tsx` | Confetti, count-up XP, animated trophy |
| `lib/utils/lesson-renderer-v2.ts` | Updated HTML backup renderer |
| `.claudeignore` | Added logs/ |

**Course 754, Lesson 3430** ("Neural Networks: The Basics") — fully generated with Veo video.

---

## The New Lesson Design Vision

### What's Wrong With Current Approach
- Beautiful blocks stacked in a list = same as every other LMS (Coursera, Udemy, LinkedIn Learning)
- "Continue" button gates interrupt narrative flow
- Completion card (confetti + trophy + rotating rings + XP counter) is **over the top** — user explicitly flagged this
- No visual variety — images, diagrams, mindmaps, illustrations are sparse
- Every lesson structurally identical

### The New Paradigm: Scroll-Driven Scenes
Inspired by The Pudding, Stripe, Apple product pages — NOT other e-learning platforms.

**Key principles:**
1. Viewport is a STAGE — one idea per scroll moment
2. Scroll IS the pacing — no Continue buttons
3. Typography used as design element (not excessively large — readable)
4. Rich visuals woven throughout: mindmaps, flow diagrams, SVG illustrations, concept maps
5. Inline micro-predictions mid-lesson (not quiz at end)
6. Concept anchor sidebar — sticky left rail showing 4 concepts, active one highlights
7. Clean minimal ending — 3 learned skills + next button. NO confetti, NO trophy, NO XP animation

### New Block Types Needed
- `punch_quote` — bold typographic statement between content (NOT huge font — readable ~2.5-3rem)
- `prediction` — inline before-you-know-it question with 3 options, immediate reveal
- `mindmap` — SVG concept map showing relationships between ideas
- `flow_diagram` — left-to-right process flow (input → model → output)
- `concept_illustration` — SVG/CSS illustration tied to the specific concept

---

## Mockup File: `lesson_design_mockup.html`

**Status:** First version created. User feedback received:
1. **Font sizes too large and hard to read** — punch quotes at 6rem are excessive. Target: 2.5–3rem max
2. **Missing visuals** — needs images, illustrations, mindmaps, diagrams. "Pictures paint a thousand words."

### IMMEDIATE NEXT TASK: Update the mockup

**File:** `lesson_design_mockup.html` (root of project)

**Changes required:**

#### 1. Fix all font sizes
```css
/* BEFORE (too large) */
.punch-text  { font-size: clamp(2.8rem, 7vw, 6rem); }   /* → clamp(1.8rem, 3vw, 2.8rem) */
.hook-q      { font-size: clamp(2.4rem, 6vw, 5.2rem); }  /* → clamp(1.8rem, 3.5vw, 3rem) */
.punch-2-text{ font-size: clamp(2.2rem, 5.5vw, 4.8rem); }/* → clamp(1.7rem, 3vw, 2.6rem) */
```

#### 2. Add SVG Mindmap — Prompt Architecture
Add after the anatomy section. Central node "YOUR PROMPT" with 4 branches:
- Role (pulse/green, top-left)
- Context (iris/purple, top-right)
- Task (amber, bottom-left)
- Format (nova/red, bottom-right)
Each node: circle + label + 1-line description. Animated lines drawing in on scroll.

#### 3. Add SVG Flow Diagram — Vague vs Structured
Replace the current two prompt-cards with a visual flow:
```
[Vague words] ──→ [ AI Model ] ──→ [Generic output]     ← shown in nova/red
[Structured prompt] ──→ [ AI Model ] ──→ [Precise output] ← shown in pulse/green
```
Side by side, arrows drawn as SVG paths, boxes with rounded corners.

#### 4. Add Concept Illustration — Opening Section
Replace the plain hook background with an SVG network visualization:
- ~20 nodes (circles) connected by lines
- Nodes pulse gently
- Represents "AI understanding your words"
- Subtle, not distracting

#### 5. Add Visual Mistake Cards
Each of the 3 mistakes gets an SVG icon illustration:
- Mistake 1 (No role): person silhouette with question mark
- Mistake 2 (Task assumed): speech bubble with "..."
- Mistake 3 (No format): document with multiple conflicting layouts

#### 6. Add Mindmap for Techniques Section
Chain of Thought shown as a visual step-by-step flow:
```
[Question] → [Step 1] → [Step 2] → [Step 3] → [Answer]
```
Simple horizontal SVG with nodes and arrows.

#### 7. Add Real Image Placeholders
For image blocks, show styled placeholders with relevant AI-generated style descriptions rather than generic "generating..." text. Use gradient backgrounds with relevant iconography.

---

## Gap Analysis: Current Lesson vs World-Class Target

| Dimension | Current | Target |
|-----------|---------|--------|
| Block count/lesson | 12–18 | 25–35+ |
| Paragraphs per text block | 1–2 sentences | 3–4 rich paragraphs |
| Callout boxes | 1–2 | 4–5 spread throughout |
| Visual elements | Sparse | Mindmaps, diagrams, illustrations per lesson |
| Completion card | Over-the-top (confetti+trophy) | Clean 3-line summary |
| Quiz placement | End of lesson | Mid-lesson predictions + end recap |

---

## Priority Order for Next Sessions

1. **Update mockup** (font sizes + visual elements as above) → get user approval
2. **Once approved:** Implement new block types in React components
3. **Rewrite LessonExpanderAgent prompt** (`lib/ai/agent-system-v2.ts`) for 25-35+ blocks, deeper content, real examples
4. **Add new block types** to `lib/types/lesson-blocks.ts` and `components/course/blocks/`
5. **Replace completion card** with clean minimal ending
6. **After 14 March:** Audio generation (ElevenLabs quota resets)

---

## Environment State

| Item | Status |
|------|--------|
| Dev server | Not running — `npm run dev` |
| Course 753 | Complete — "Prompt Engineering Demystified" |
| Course 754 | Partial — "Introduction to Neural Networks", 1 lesson (3430) |
| ElevenLabs quota | ~20 credits — resets 14 March 2026 |
| Middleware | Active (`middleware.ts`) |
| V2 generator | Active (`NEXT_PUBLIC_USE_V2_GENERATOR=true`) |

---

## How to Resume

```bash
cd "d:\ai-bytes-leaning-22nd-feb-2026 Backup"
# Open mockup in browser first:
start lesson_design_mockup.html
# Then start dev server:
npm run dev
```

**First task:** Fix `lesson_design_mockup.html` — font sizes and add SVG visuals (mindmap, flow diagram, illustrations). Get user sign-off before touching any React components.
