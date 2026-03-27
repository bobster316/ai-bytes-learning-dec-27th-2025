# Master Lesson Reference v1
## Source: lesson_generative_ai_v2.html
## Date: 15 March 2026

This document defines the canonical layout, sections, styling, and behaviour of an AI Bytes Learning lesson.
All future lessons must match this reference exactly.

---

## DESIGN TOKENS

| Token | Value | Usage |
|-------|-------|-------|
| `--pulse` | `#00FFB3` | Primary accent — pulse green |
| `--iris` | `#9B8FFF` | Secondary accent — iris purple |
| `--amber` | `#FFB347` | Tertiary accent — amber |
| `--nova` | `#FF6B6B` | Warning/error — nova red |
| `--bg` | `#080810` | Page background |
| `--surface` | `#0f0f1a` | Card/section background |
| `--border` | `rgba(255,255,255,0.06)` | Subtle borders |
| `--text` | `#e8e8f0` | Body text |
| `--muted` | `#6b6b80` | Muted/secondary text |

---

## TYPOGRAPHY

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display headings (H1, H2) | Plus Jakarta Sans | 800 | All major headings |
| Body text | Plus Jakarta Sans | 400 | All body paragraphs |
| Labels, tags, chips, code | DM Mono | 300–400 | All monospace elements |
| Italic emphasis in headings | Plus Jakarta Sans em | italic | Coloured italic in H1 |

**Font sizes:**
- H1 (hook): `clamp(2.4rem, 5vw, 3.8rem)`, `letter-spacing: -0.03em`, `line-height: 1.05`
- H2 (section): `clamp(1.6rem, 3vw, 2.4rem)`, `letter-spacing: -0.03em`
- Body: `1.12rem`, `line-height: 1.85`
- Labels: `0.68rem`, `letter-spacing: 0.15em`, uppercase
- Chips/tags: `0.70rem`, `letter-spacing: 0.05–0.15em`

---

## LAYOUT CONTAINERS

| Class | Max-width | Usage |
|-------|-----------|-------|
| `.ct` | 1140px | Wide sections (cards, tabs, anatomy, flow, mindmap) |
| `.ctn` | 840px | Narrative sections (text, prediction, quiz, recap) |
| `.cte` | 760px | Ending/completion section only |

All containers: `margin: 0 auto`, standard padding `10vh 4vw`.

---

## GLOBAL CHROME

### Fixed Top Navigation Bar
- Position: `fixed`, top, full-width, `z-index: 100`
- Background: `rgba(8,8,16,0.92)` + `backdrop-filter: blur(12px)`
- Border-bottom: 1px `--border`
- Height: 52px
- Layout: 3 items — LEFT brand | CENTER lesson title | RIGHT chip
  - LEFT: "AI BYTES LEARNING" — DM Mono, `0.85rem`, `--pulse`, `letter-spacing: 0.1em`
  - CENTER: "Lesson 01 — [Title]" — DM Mono, `0.72rem`, `--muted`
  - RIGHT: "[N] MIN · [LEVEL]" — DM Mono chip with `--border` outline
- **Scroll progress bar**: 2px absolute at bottom of nav, `width` driven by scroll %, gradient `--pulse → --iris`
- NOTE: This replaces the standard site navigation on lesson pages. The site header must be hidden.

### Right Rail Navigation
- Position: `fixed`, right 20px, vertically centred, `z-index: 99`
- 8–10 dots (one per major section), `gap: 10px`, vertical column
- Default dot: 8px circle, `rgba(255,255,255,0.15)`
- Active dot: `--pulse` fill, `box-shadow: 0 0 8px --pulse`, `scale(1.5)`
- Hover: shows tooltip to the LEFT with section name (DM Mono, 0.65rem, surface bg)
- Clicking a dot smoothly scrolls to that section

---

## SECTION DEFINITIONS

---

### Section 1 — HOOK
**ID:** `#hook`
**Layout:** Full viewport height (`min-height: 100vh`), `padding-top: calc(52px + 8vh)`
**Background:** `--bg` + animated mesh gradient overlay

**Mesh gradient (3 animated blobs):**
- Blob 1: 480px, `--iris` purple, top-left
- Blob 2: 360px, `--pulse` green, top-right
- Blob 3: 300px, `--amber` amber, bottom-centre
- All blobs: `filter: blur(80px)`, `opacity: 0.18`, slow drift animation

**Content grid:** `grid-template-columns: 1fr 2px 1fr`, `gap: 3rem`, `max-width: 1140px`

**LEFT COLUMN:**
1. Tag: DM Mono, `0.70rem`, `--iris`, `letter-spacing: 0.15em` — e.g. "AI FOUNDATIONS · LESSON 01"
2. H1: Plus Jakarta Sans 800, `clamp(2.4rem, 5vw, 3.8rem)`, `line-height: 1.05`, `letter-spacing: -0.03em`, colour `#f5f5f5`
   - Second line wrapped in `<em>`: italic, `--iris` colour (NOT a different font — same Plus Jakarta Sans)
3. Thin horizontal rule: 60% width, gradient `--iris → transparent`
4. Subtitle paragraph: Plus Jakarta Sans, `1.05rem`, `--muted`, `line-height: 1.7`
5. Progress card: surface bg, border, rounded — "Lesson N of N" (DM Mono muted) + progress bar (pulse fill) + % (pulse)
6. "WHAT YOU'LL BUILD" label: DM Mono, `0.68rem`, `--muted`, uppercase
7. Bullet list: 3 items, `0.9rem`, `--text`, pulse dot (`6px circle`) before each item

**CENTRE DIVIDER:** 2px vertical line, height 340px, gradient `transparent → --iris → transparent`

**RIGHT COLUMN:**
1. Course image: rounded `border-radius: 16px`, bordered, `height: 260px`, `object-fit: cover`
2. 2×2 stat grid (`gap: 10px`):
   - Each stat: surface bg, border, rounded `10px`, `text-align: center`
   - Number: Plus Jakarta Sans 800, `1.6rem`, coloured (pulse or iris)
   - Label: DM Mono, `0.62rem`, `--muted`, `letter-spacing: 0.08em`

---

### Section 2 — INSTRUCTOR INSIGHT
**ID:** `#vi`
**Background:** `--surface`, top and bottom 1px `--border`
**Layout:** `grid-template-columns: 380px 1fr`, `gap: 3rem`, aligned centre

**LEFT:**
- "INSTRUCTOR INSIGHT" DM Mono label (`0.68rem`, `--iris`, `letter-spacing: 0.12em`)
- Video player: `max-width: 380px`, `border-radius: 16px`, `border: 1px solid rgba(155,143,255,0.3)`, `aspect-ratio: 16/9`, autoplay muted loop

**RIGHT:** 3 insight cards, each:
- Background: `rgba(15,15,26,0.8)`, border `rgba(155,143,255,0.25)`, `border-radius: 12px`, padding `16px 20px`
- Icon (emoji, `1.4rem`) + H4 (Plus Jakarta 700, `0.95rem`) + paragraph (`0.85rem`, `--muted`)
- Hover: border-color → `--iris`

---

### Section 3 — FOUNDATION
**ID:** `#found`
**Container:** `.ctn` (840px)
**Background:** `--bg`

**Structure:**
1. Section label: 3px iris bar + DM Mono uppercase text (standard pattern — see SECTION LABEL spec below)
2. H2: Plus Jakarta 800
3. Body paragraphs: `1.12rem`, `line-height: 1.85`, `--text`. `<strong>` tags = `--pulse` colour, `font-weight: 600`
4. Key Insight callout box:
   - `border-left: 3px solid --pulse`
   - `background: rgba(0,255,179,0.05)`
   - `border-radius: 0 10px 10px 0`
   - `padding: 18px 22px`
   - Label: "KEY INSIGHT" DM Mono `0.68rem`, `--pulse`, `letter-spacing: 0.12em`
   - Body: Plus Jakarta `1rem`, `--text`, `line-height: 1.7`

---

### Section 4 — TYPE CARDS
**ID:** `#types`
**Container:** `.ct` (1140px)
**Background:** `--bg`

**Structure:**
1. Section label
2. H2 + subtitle (`1rem`, `--muted`)
3. 3-column card grid (`gap: 20px`):

Each card:
- `background: --surface`, border, `border-radius: 16px`, overflow hidden
- **Colour accent bar**: 3px top bar (`--pulse` / `--iris` / `--amber`)
- Padding area (`22px`):
  - DM Mono badge (coloured bg tint + matching text): LANGUAGE / IMAGES / ADVERSARIAL
  - H3: Plus Jakarta 700, `1rem`, `#f5f5f5`
  - Paragraph: `0.88rem`, `--muted`, `line-height: 1.65`
  - Bottom content: either a **code snippet block** (DM Mono, dark bg, pulse text) or an **arrow text line** (coloured)
- Hover: `translateY(-4px)` + coloured `box-shadow`

---

### Section 5 — ANATOMY (Sticky Scroll)
**ID:** `#anat`
**Background:** `--surface`, top and bottom 1px `--border`
**Container:** `.ct` (1140px), but the section itself is full-width

**Structure:**
1. Section label + H2 + subtitle: "SCROLL TO STEP THROUGH THE ARCHITECTURE" (DM Mono, `0.72rem`, `--muted`)
2. **40%/60% sticky grid** (`grid-template-columns: 40% 1fr`, `gap: 4rem`):

**LEFT (sticky, top: 80px):**
- SVG diagram, `width: 100%`, `height: 420px`
- 5 rectangle boxes with arrows: Input Tokens → Embedding Layer → Multi-Head Attention → Feed Forward → Output Logits
- Default box: surface fill, subtle border, muted label
- **Active step box**: pulse/accent border (`stroke-width: 3`), brighter fill, white label text
- Transitions on fill, stroke, stroke-width (0.4s)

**RIGHT (scrollable steps):**
- 4 steps, each: `border-bottom: 1px --border`, `padding: 32px 0`
- Default: `opacity: 0.35`
- Active (when in viewport): `opacity: 1`
- Each step contains:
  - "STEP 0N" — DM Mono `0.68rem`, `--pulse`, `letter-spacing: 0.1em`
  - Step title — Plus Jakarta 700, `1.15rem`, `#f5f5f5`
  - Body paragraph — Plus Jakarta `1rem`, `--muted`, `line-height: 1.75`
  - Code example box — DM Mono `0.78rem`, `--iris`, iris tint bg, `border-radius: 6px`

---

### Section 6 — PUNCH QUOTE
**ID:** `#punch`
**Container:** `.ctn` (840px)
**Background:** `--bg`
**Text alignment:** CENTRE

**Structure:**
1. Full-width horizontal rule: 1px, gradient `transparent → --iris → transparent`
2. Quote text:
   - Plus Jakarta Sans 800
   - `font-size: clamp(1.8rem, 3.5vw, 2.5rem)`
   - `line-height: 1.2`
   - `letter-spacing: -0.03em`
   - **Colour: `--iris` (purple)** — NOT white
   - Centred
3. Full-width horizontal rule (same as above)
4. Attribution: `— [text]` — Plus Jakarta `0.95rem`, `--muted`, centred

**NOTE:** This is NOT a left-border blockquote. It is a centred, bold, iris-coloured statement framed by two horizontal rules.

---

### Section 7 — PREDICTION
**ID:** `#pred`
**Container:** `.ctn` (840px)
**Background:** `--surface`, top and bottom 1px `--border`

**Structure:**
1. Label row: amber 3px bar + "BEFORE YOU CONTINUE" (DM Mono, `0.68rem`, `--amber`, `letter-spacing: 0.15em`)
2. Question: Plus Jakarta 600, `1.15rem`, `#f5f5f5`, `line-height: 1.5`
3. Option buttons (A, B, C):
   - Full width, left-aligned
   - `background: --bg`, border, `border-radius: 10px`, `padding: 14px 18px`
   - Letter badge: DM Mono, `0.75rem`, 26px circle, `rgba(255,255,255,0.06)` bg
   - Text: `0.95rem`, `--text`
   - Hover: subtle border brightening
   - **Correct answer selected**: `border: --pulse`, `background: rgba(0,255,179,0.06)`, text = `--pulse`
   - **Wrong answer selected**: `border: rgba(255,107,107,0.3)`, text = `--muted`, `opacity: 0.6`
4. Answer reveal panel (initially `max-height: 0`, expands to `220px`):
   - `border-left: 3px solid --pulse`
   - `background: rgba(0,255,179,0.04)`
   - `border-radius: 0 10px 10px 0`
   - `padding: 16px 20px`
   - Plus Jakarta `1rem`, `--text`, `line-height: 1.7`

---

### Section 8 — MINDMAP
**ID:** `#mmap`
**Container:** `.ct` (1140px)
**Background:** `--bg`

**Structure:**
1. Section label + H2 + subtitle
2. Full-width SVG (`max-width: 900px`, `height: 500px`, centred)

**SVG Mindmap:**
- Central node: `r=52`, `--surface` fill, `--iris` stroke `2px`, text "Gen AI" + "Landscape" in DM Mono
- 5 branch nodes (each `r=30`):
  - Text: `--pulse` green
  - Images: `--iris` purple
  - Audio: `--amber` amber
  - Video: `--nova` red
  - Code: `#6effd8` light green
- Connecting lines: coloured to match branch, animated in with `stroke-dashoffset` trick
- Sub-labels: DM Mono `9.5px`, `--muted`, positioned at end of branch sub-lines
- 3 sub-lines per branch, each with a text label (e.g. Text → LLMs, Chatbots, Code Gen)

---

### Section 9 — FLOW DIAGRAM
**ID:** `#flow`
**Container:** `.ct` (1140px)
**Background:** `--surface`, top and bottom 1px `--border`

**Structure:**
1. Section label + H2 + subtitle
2. Horizontal flex row (`gap: 0`, `overflow-x: auto`):
   - 5 step cards (`flex: 1`, `min-width: 155px`, surface bg, border, `border-radius: 12px`, `padding: 20px 16px`, `text-align: center`)
   - Arrow dividers between them: `→` in `--muted`
   - Each card: number badge (24px circle, coloured bg tint, DM Mono) + H4 (Plus Jakarta 700, `0.85rem`) + paragraph (`0.75rem`, `--muted`)
   - Steps 01–03: iris colour scheme; Steps 04–05: pulse colour scheme

---

### Section 10 — INDUSTRY TABS
**ID:** `#ind`
**Container:** `.ct` (1140px)
**Background:** `--bg`

**Structure:**
1. Section label + H2 + subtitle
2. Tab bar (`border-bottom: 1px --border`):
   - Plain text tabs (DM Mono, `0.72rem`, `--muted`)
   - **Active tab**: text = `#f5f5f5`, `::after` pseudo-element = 2px `--pulse` underline animating in with `scaleX(0 → 1)`
   - No background fill on active tab — underline only
3. Tab panels (one visible at a time):
   - **2-column grid** (`grid-template-columns: 1fr 1fr`, `gap: 2.5rem`):
     - LEFT: image (`border-radius: 14px`, `height: 220px`, `object-fit: cover`, bordered)
     - RIGHT: H3 (Plus Jakarta 700, `1.2rem`) + paragraph (`1rem`, `--muted`, `line-height: 1.75`)

**NOTE:** The image is on the LEFT, text on the RIGHT. Not stacked vertically.

---

### Section 11 — INTERACTIVE CODE
**ID:** `#int`
**Container:** `.ct` (1140px)
**Background:** `--surface`, top and bottom 1px `--border`

**Structure:**
1. Section label + H2 + subtitle
2. 2-column grid (`grid-template-columns: 1fr 1fr`, `gap: 2.5rem`):

**LEFT:**
- `<pre>` code block: `background: #060610`, border, `border-radius: 12px`, `padding: 22px`, DM Mono `0.78rem`, `line-height: 1.7`
- **Syntax highlighting**: keys = `--iris`, string values = `--pulse`, string literals = `--amber`, numbers = `--nova`
- "DECODE →" button below: DM Mono, iris border, iris text, iris tint bg

**RIGHT (hidden until DECODE clicked):**
- Annotation cards stagger-animate in (`translateX(10px → 0)`, stagger 0.1s each)
- Each card: `--surface` bg, `border-left: 3px solid --iris`, rounded right, `padding: 12px 16px`
- Key label: DM Mono `0.70rem`, `--iris`
- Value text: `0.85rem`, `--text`

---

### Section 12 — APPLIED CASE
**ID:** `#app`
**Container:** `.ct` (1140px)
**Background:** `--bg`

**Card structure:**
- `border-left: 3px solid --iris`
- `background: --surface`
- `border: 1px --border`
- `border-radius: 0 16px 16px 0`
- `padding: 32px 36px`

**Contents:**
1. "APPLIED CASE" — DM Mono `0.68rem`, `--iris`, `letter-spacing: 0.12em`
2. H3 title — Plus Jakarta 700, `1.1rem`, `#f5f5f5`
3. Three labelled sub-blocks, each:
   - Label: DM Mono `0.65rem`, `--muted`, `letter-spacing: 0.08em`, uppercase
   - Body: Plus Jakarta `1rem`, `--text`, `line-height: 1.7`
   - Labels used: **THE SCENARIO** / **TRADITIONAL APPROACH** / **GENERATIVE AI PIPELINE**
4. Result chips row: rounded pill badges, `--pulse` colour, pulse border, pulse tint bg

---

### Section 13 — WARNING / CALLOUT
**ID:** `#warn`
**Container:** `.ctn` (840px)
**Background:** `--bg`, reduced padding `5vh 4vw`

**Callout box:**
- `border-left: 3px solid --nova`
- `background: rgba(255,107,107,0.05)`
- `border-radius: 0 10px 10px 0`
- `padding: 20px 24px`
- "⚠ COMMON MISTAKE" — DM Mono `0.68rem`, `--nova`, `letter-spacing: 0.1em`
- Body: Plus Jakarta `1rem`, `--text`, `line-height: 1.75`

---

### Section 14 — EXERCISE
**ID:** `#ex`
**Container:** `.ctn` (840px)
**Background:** `--surface`, top and bottom 1px `--border`

**Structure:**
1. "YOUR TURN" — DM Mono `0.68rem`, `--amber`, `letter-spacing: 0.15em`
2. Instruction text — Plus Jakarta `1.05rem`, `--text`, `line-height: 1.7`
3. Weak prompt box:
   - `background: #060610`
   - `border: 1px solid rgba(255,107,107,0.35)`
   - DM Mono `0.85rem`, `--nova`
4. 2×2 scaffold input grid:
   - Label: DM Mono `0.65rem`, `--muted`, uppercase
   - Input: dark bg, border, `border-radius: 8px`, DM Mono `0.8rem`, focus border = `--amber`
   - Placeholder: `--muted`
   - Labels: WHO IS THE AUDIENCE? / WHAT FORMAT? / WHAT TONE? / WHAT SHOULD IT COVER?
5. "See model answer" button — DM Mono, amber border, amber text
6. Answer reveal — collapses/expands, DM Mono amber text on dark bg with amber border

---

### Section 15 — RECAP
**ID:** `#recap`
**Container:** `.ctn` (840px)
**Background:** `--surface`, top and bottom 1px `--border`

**Structure:**
1. "IF YOU REMEMBER ONLY THREE THINGS" — DM Mono `0.68rem`, `--muted`, `letter-spacing: 0.12em`
2. Three recap items (vertical stack, `gap: 2rem`), each:
   - **Large number**: Plus Jakarta 800, `3rem`, `--iris`, `line-height: 1`, `opacity: 0.7`, `min-width: 48px`
   - Title: Plus Jakarta 700, `1.05rem`, `#f5f5f5`
   - Body: Plus Jakarta `0.97rem`, `--muted`, `line-height: 1.7`

---

### Section 16 — QUIZ
**ID:** `#quiz`
**Container:** `.ctn` (840px)
**Background:** `--bg`

**Structure:**
1. "CHECK YOUR UNDERSTANDING" section label (iris)
2. "QUESTION N OF 3" — DM Mono `0.68rem`, `--muted`, `letter-spacing: 0.1em`
3. Questions shown one at a time (`display: none` → `display: block` on activation):
   - Question text: Plus Jakarta 600, `1.1rem`, `#f5f5f5`, `line-height: 1.5`
   - Option buttons (same style as Prediction section): A/B/C/D lettered circles + text
   - Feedback panel: slides in from `max-height: 0` to `130px`
     - Correct: pulse border + pulse tint + pulse text
     - Wrong: nova border + nova tint + nova text
   - "Next question →" button: DM Mono, iris border, iris text (hidden until answer selected)
4. Score display (hidden until last question answered):
   - Score number: Plus Jakarta 800, `4rem`, `--pulse`, centred
   - "CORRECT ANSWERS" label: DM Mono `0.72rem`, `--muted`
   - Advice paragraph: muted text

---

### Section 17 — KEY TERMS
**ID:** `#terms`
**Container:** `.ctn` (840px)
**Background:** `--surface`, top and bottom 1px `--border`

**Structure:**
1. "GLOSSARY" section label (iris)
2. H2 "Key Terms" + subtitle
3. Accordion list:
   - Outer container: `border: 1px --border`, `border-radius: 12px`, overflow hidden
   - Each item: `border-bottom: 1px --border` (last item: no border)
   - Header button: full-width, flex space-between, Plus Jakarta 600, `0.95rem`, `--text`, hover bg = `rgba(255,255,255,0.02)`
   - Chevron: rotates 180° when open
   - Body: `max-height: 0 → 220px`, Plus Jakarta `0.97rem`, `--muted`, `line-height: 1.75`, `padding: 0 22px 18px`

---

### Section 18 — COMPLETION
**ID:** `#comp`
**Container:** `.cte` (760px)
**Background:** `--bg`
**Padding:** `14vh 4vw`
**Text alignment:** CENTRE

**Structure:**
1. "LESSON COMPLETE" — DM Mono `0.68rem`, `--pulse`, `letter-spacing: 0.2em`
2. H2 lesson title — Plus Jakarta 800, `clamp(1.5rem, 3vw, 2.2rem)`, `#f5f5f5`
3. Three skill badges (horizontal row, centred, flex-wrap):
   - Rounded pill: DM Mono `0.72rem`, `padding: 8px 16px`
   - Badge 1: `--pulse` text + `rgba(0,255,179,0.3)` border + `rgba(0,255,179,0.07)` bg
   - Badge 2: `--iris` text + `rgba(155,143,255,0.3)` border + `rgba(155,143,255,0.07)` bg
   - Badge 3: `--amber` text + `rgba(255,179,71,0.3)` border + `rgba(255,179,71,0.07)` bg
4. Horizontal rule: 1px, `--border`
5. "Next Lesson → [Title]" button:
   - Plus Jakarta 600, `0.95rem`, `padding: 14px 36px`, `border-radius: 40px`
   - **Background: `--iris`**, text: `#fff`, no border
   - Hover: slightly lighter iris, `translateY(-2px)`, iris box-shadow

---

## SECTION LABEL PATTERN (standard, used in sections 3–17)

Every section heading area uses this consistent pattern:

```
[3px vertical bar] [LABEL TEXT IN DM MONO]
[H2 Heading in Plus Jakarta 800]
[Subtitle in Plus Jakarta, --muted]  (optional)
```

Spec:
- Bar: `3px wide`, `14px tall`, `border-radius: 2px`, colour = `--iris` (default) or section accent
- Label text: DM Mono, `0.68rem`, matching colour, `letter-spacing: 0.15em`, uppercase, `margin-bottom: 1.2rem`
- Displayed as flex row with `gap: 10px`, `align-items: center`

---

## SCROLL & ANIMATION BEHAVIOUR

- **Smooth scroll**: Lenis (`lerp: 0.1`) wraps all scroll behaviour
- **Scroll-driven progress**: Top nav progress bar updates on scroll
- **Animate-in on scroll**: Elements with `.ai` class start `opacity: 0`, animate to `opacity: 1, translateY(0)` when `IntersectionObserver` fires at 12% threshold
- **Anatomy sticky**: ScrollTrigger pins left column, each step activates when its bounding box crosses 50% of viewport height
- **Mindmap lines**: SVG paths use `stroke-dashoffset` animation, triggered by IntersectionObserver
- **Rail dots**: Update active state based on which section's `offsetTop` is nearest

---

## WHAT THE REACT LESSON IS CURRENTLY MISSING

| Gap | Description | Priority |
|-----|-------------|----------|
| Dark top nav | White site nav shows instead of minimal dark lesson nav | HIGH |
| Punch quote styling | Must be CENTRED + IRIS COLOUR + horizontal rules, not left-border | HIGH |
| Industry tabs layout | Image must be LEFT (50%), text RIGHT (50%) — not stacked | HIGH |
| Instructor Insight section | Instructor video + 3 insight cards — no equivalent block type | MEDIUM |
| Interactive Code section | JSON syntax block + DECODE button + annotation cards | MEDIUM |
| Anatomy sticky scroll | SVG flowchart left + scroll-activated steps right | MEDIUM |
| Applied case labels | Should use SCENARIO / TRADITIONAL APPROACH / PIPELINE | LOW |
| Strong text in body | `<strong>` inside paragraphs should render in `--pulse` green | LOW |

---

*Document version: 1.0*
*Created: 15 March 2026*
*Source file: lesson_generative_ai_v2.html*
