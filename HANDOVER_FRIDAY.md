# AI Bytes Learning — Full Handover Document
**Date:** 11 March 2026
**Return date:** Friday 14 March 2026
**Project directory:** `D:\ai-bytes-leaning-22nd-feb-2026 Backup`

---

## 1. Objective

Build **AI Bytes Learning** into the world's best micro-learning platform — Awwwards-level design that other e-learning providers (Coursera, Udemy, LinkedIn Learning) look at in admiration.

The platform teaches AI skills in 15-minute "Byte" lessons. The primary goal of this session was twofold:

**A) Complete the lesson design mockup (`lesson_final.html`)** — a standalone HTML prototype demonstrating what every generated lesson should look like. This is the design reference that all future React implementation must match. It covers a single lesson: "Prompt Engineering · Lesson 01: You've Been Talking to AI Wrong."

**B) Ensure design continuity across the full learning journey** — the course overview page, module intro page, lesson sidebar, and lesson content must all feel like one unified product, not three separate apps bolted together. The lesson experience in the mockup sets the standard; everything before and around it must match.

The platform is a Next.js 16 + React 19 app with Supabase backend. Generated lessons currently come out as flat markdown blobs. The long-term goal is to make the AI generator produce structured JSON blocks that render as the rich visual experience shown in the mockup.

---

## 2. Current Status

### ✅ Completed this session

| Item | Status |
|------|--------|
| `lesson_final.html` mockup — hero layout | Complete |
| `lesson_final.html` — anatomy section (alternating cards) | Complete |
| `lesson_final.html` — bento grid section | Complete |
| `lesson_final.html` — SVG mindmap | Complete |
| `lesson_final.html` — prediction/quiz inline block | Complete |
| `lesson_final.html` — techniques section | Complete |
| `lesson_final.html` — clean ending (no confetti) | Complete |
| `lesson_final.html` — video section | **Fixed** — real `<video>` using `public/videos/intro.mp4` + animated typing demo below |
| `lesson_final.html` — layout consistency | **Fixed** — all max-widths standardised (1140px / 840px / 760px) |
| `lesson_final.html` — no full-bleed images | **Fixed** — all images contained |
| `lesson_final.html` — hero symmetry | **Fixed** — 3-column grid, left column has course progress card + outcomes |
| Course overview page — dark background | **Fixed** — `bg-white` removed, now `bg-[#080810]` |
| Course overview page — colour palette | **Fixed** — violet/cyan replaced with iris/pulse |
| Course overview page — AI avatar | **Unchanged** — preserved at exactly `lg:col-span-5 aspect-video` |
| PremiumCurriculum component — colours | **Fixed** — violet/cyan → iris/pulse/amber |
| Lesson sidebar — colours | **Fixed** — violet → iris throughout |
| Module intro page | **Built from scratch** — was just a redirect, now a full designed page |

### 🔄 In Progress / Partially Done
- Lesson page shell (`app/courses/[courseId]/lessons/[lessonId]/page.tsx`) — not yet colour-checked or updated
- `PremiumCurriculum` module headers don't link to the new module intro page yet

### ❌ Not Started Yet
- New block types in `lib/types/lesson-blocks.ts`
- AI generator prompt rewrite (`lib/ai/agent-system-v2.ts`)
- React block components (`components/course/blocks/`)
- New lesson content renderer (`components/course/lesson-content-renderer.tsx`)
- Audio generation (ElevenLabs quota resets 14 March 2026 — Friday)

---

## 3. Key Context

### Platform
- **Name:** AI Bytes Learning
- **Stack:** Next.js 16 (App Router), React 19, Supabase (PostgreSQL + Auth + Storage), Tailwind CSS, Framer Motion
- **AI:** Gemini 2.0 Flash (primary generator), Anthropic Claude, OpenAI (secondary)
- **Voice assistant:** Sterling (British, witty, slightly condescending — NOT "Jarvis")
- **Payments:** Stripe (Standard £15/mo, Professional £25/mo, Unlimited £35/mo)
- **Video:** HeyGen for AI avatar intro videos
- **Images:** Gemini image generation + Unsplash + Pexels
- **Analytics:** PostHog
- **V2 generator active:** `NEXT_PUBLIC_USE_V2_GENERATOR=true`

### Terminology (CRITICAL)
- Course structure units are called **modules** — NEVER "topics"
- The DB table is `course_topics` but in ALL UI, copy, and conversation: **module**
- A "Byte" = one lesson (15 minutes)

### Design tokens (ENFORCED everywhere)
```
--pulse:  #00FFB3   green  — success, CTA, outcomes, completion
--iris:   #9B8FFF   purple — active state, navigation, primary accent
--amber:  #FFB347   orange — time, warnings, secondary info
--nova:   #FF6B6B   red    — live indicators, errors, alerts
--bg:     #080810   near-black page background
--surface:#0f0f1a   slightly lighter card background
--border: rgba(255,255,255,0.08)
```

### Typography (lesson mockup)
- **Plus Jakarta Sans** — display headings
- **Inter** — body/reading text
- **DM Mono** — labels, code, data
- **Instrument Serif** — decorative italic
- **Fraunces** — pull quotes

### AI Avatar Rules (CRITICAL)
- Only **1 AI avatar video per course** — on the course overview page only
- Module intro pages: NO avatar video
- Lesson pages: NO avatar video
- Avatar size: **NEVER increase** beyond current `lg:col-span-5` `aspect-video`. Same or smaller only.
- Component: `VoiceAvatar` using `intro_video_url` from courses table

### Layout rules (lesson_final.html)
- Main content max-width: **1140px** — anatomy, bento, flow, techniques, split, video
- Narrow text max-width: **840px** — stat-punch, prediction, punch-quote
- Ending max-width: **760px**
- All sections: `margin: 0 auto`, `padding: 8–10vh 8vw`
- **NO full-bleed/full-width images** — user explicitly rejected. Contained image cards only.
- Video: uses `public/videos/intro.mp4` (local file, 27MB). CDNs block hotlinking from `file://`.

### What NEVER to do (from failed attempts)
- Do NOT use `opacity: 0` on above-fold content with JS dependency
- Do NOT make font sizes > 3rem for punch quotes
- Do NOT add confetti / trophy / XP animation on completion
- Do NOT use full-bleed images
- Do NOT make the AI avatar bigger
- Do NOT use "topics" — always "modules"
- Do NOT create designs that look like "dark mode UI components" — create EXPERIENCE pages

### Current courses in DB
- **Course 753:** "Prompt Engineering Demystified" — complete
- **Course 754:** "Introduction to Neural Networks" — partial, 1 lesson (ID 3430)

### ElevenLabs quota
- ~20 credits remaining. **Resets Friday 14 March 2026.** Audio generation work should wait until then.

---

## 4. Decisions Already Made

| Decision | Reason |
|----------|--------|
| Dark theme throughout (`bg-[#080810]`) | Lesson mockup is dark; course pages were light — jarring transition. Unified to dark. |
| Single colour palette (pulse/iris/amber/nova) | Course pages used violet/cyan, lesson used different tokens. Looked like two products. |
| No full-bleed images | User explicitly rejected them multiple times. All images must be in contained cards. |
| No confetti/trophy/XP on completion | User flagged it as "over the top". Clean 3-line summary only. |
| Module intro page is a full page, not a redirect | The old `/topics/[id]` just redirected to Lesson 1 — no context, no bridge. Now a proper designed page. |
| Quiz at module level (not lesson level) | Module quiz = graded gate (5–8 questions, 70% pass mark). Lesson = inline predictions only (2–3 questions, no score stored). |
| AI avatar: course level only, 1 per course | Production cost (HeyGen credits). Module-level videos would be prohibitively expensive. |
| Avatar size frozen — same or smaller | User directive. Never increase. |
| Typing animation = "animated comparison" (secondary) | User kept asking "where is the video" when shown only the typing demo. Real `<video>` is now primary; typing demo is a separate section below. |
| `lesson_final.html` is the design reference | This HTML mockup defines the target. All React implementation must match it. |
| Scroll-driven scenes, no "Continue" button gating | Inspired by The Pudding, Stripe, Apple product pages — NOT other LMS platforms. |

---

## 5. Outputs Created So Far

### A. lesson_final.html (root of project)
The primary design deliverable. ~3000 lines of standalone HTML/CSS/JS. Open directly in browser (no server needed).

**Sections in order:**
1. **Hero/Hook scene** — full viewport, mesh gradient bg, text scramble entrance, course progress card, practical outcomes, 3-column grid with ROLE/CONTEXT/TASK/FORMAT middle accent column
2. **Stat punch** — "80% of people use AI wrong" bold statement with node network canvas animation
3. **Video section** — real `<video>` from `public/videos/intro.mp4` + overlay bar + animated typing comparison demo below (● LIVE badge, loops vague → structured prompt)
4. **Anatomy section** — "The Anatomy of a Perfect Prompt" with SVG mindmap diagram + 4 alternating cards (ROLE/CONTEXT/TASK/FORMAT, image left/right alternating)
5. **Bento grid** — 3×2 grid showing common mistakes / what changes
6. **Flow diagram** — SVG left-to-right: [Vague] → [AI] → [Generic] vs [Structured] → [AI] → [Precise]
7. **Prediction/quiz** — inline question mid-lesson, 3 options, immediate bottom-slide reveal (no modal)
8. **Mindmap** — SVG concept map showing how 4 prompt parts connect
9. **Techniques section** — Chain of Thought, Few-Shot, Persona Stacking
10. **Punch quote** — "The model never guesses your intent. It guesses a word."
11. **Clean ending** — 3 skills learned, "Next Lesson →" CTA. NO confetti, NO trophy, NO XP animation.

**Key JS animations:**
- Canvas node network in hero background
- Text scramble on hero title
- Magnetic CTA button (mouse proximity)
- Fixed right-rail progress dots (8 sections)
- Anatomy SVG lines draw in on IntersectionObserver
- Mindmap SVG lines draw in on scroll
- Typing demo loops: PHASES array → typeText() → runPhase() IIFE, starts after 800ms delay

### B. Course Overview Page — updated (`app/courses/[courseId]/page.tsx`)
Key changes applied:
```tsx
// Background
<section className="min-h-screen flex flex-col bg-[#080810] font-sans selection:bg-[#9B8FFF]/30 selection:text-[#9B8FFF]">

// Mesh blobs (inside hero card)
<div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-[#9B8FFF]/15 rounded-full blur-[120px]" />
<div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#00FFB3]/8 rounded-full blur-[100px]" />

// Difficulty badge
<span className="... bg-[#9B8FFF]/15 border border-[#9B8FFF]/30 text-[#9B8FFF]">

// Duration badge
<span className="... bg-[#00FFB3]/10 border border-[#00FFB3]/25 text-[#00FFB3]">

// Outcome card
<div className="bg-[#00FFB3]/8 border border-[#00FFB3]/20 ...">
  <p className="text-[10px] font-bold text-[#00FFB3] ...">After this course you can</p>

// Unlock button
<Button className="... bg-[#9B8FFF] hover:bg-[#8a7fee] text-[#080810] ...">

// Subscription CTA
<div className="... bg-[#0f0f1a] border border-[#9B8FFF]/20 ...">
  <Button className="... bg-[#9B8FFF] hover:bg-[#8a7fee] text-[#080810] ...">
```
**Avatar: UNCHANGED** — `lg:col-span-5`, `aspect-video`, `VoiceAvatar` component, same size.

### C. PremiumCurriculum — updated (`components/course/premium-curriculum.tsx`)
Key colour replacements applied:
- `bg-[#04040B]` → `bg-[#0a0a12]`
- `text-cyan-400` / `bg-cyan-500/10` → `text-[#00FFB3]` / `bg-[#00FFB3]/10`
- `text-violet-500` / `bg-violet-500` → `text-[#9B8FFF]` / `bg-[#9B8FFF]`
- Progress bar: `from-cyan-500 to-violet-500` → `from-[#00FFB3] to-[#9B8FFF]`
- Section header title: "Syllabus Breakdown" → "What you'll learn"
- Quiz button (passed): emerald → pulse; (not started): violet → iris

### D. Lesson Sidebar — updated (`components/course/lesson-sidebar.tsx`)
Key changes:
- Module label border/text: `violet-500` → `#9B8FFF` (iris)
- Active lesson bg/border/text/icon: violet → iris
- Quiz completed: emerald → pulse `#00FFB3`
- Quiz not started hover: cyan → iris
- "Topic Assessment" → "Module Assessment"

### E. Module Intro Page — NEW (`app/courses/[courseId]/topics/[topicId]/page.tsx`)
Complete rewrite. Full page structure:
```
Fixed top nav: ← [Course Title]    Module X of Y
────────────────────────────────────────────────
Hero (pt-32 pb-20):
  Module 01 badge (iris)
  [Module Title] — large h1
  [Description]
  Stats: [N lessons] [~Xm] [Module assessment]
  [Start Module →] — iris button

Divider line

"In this module" section:
  "Lesson by lesson" heading
  Lesson cards (number, title, micro_objective, duration, →)
  Quiz row (pulse, "70% pass mark required")

Bottom:
  "Ready? Each lesson takes ~15 minutes."
  [Begin Lesson 1 →] — iris button
```
Self-healing preserved: if `topicId` is actually a quiz ID, redirects to `/quizzes/[id]`.

---

## 6. Outstanding Tasks

**Priority order:**

### P1 — Verify all changes work in browser
```bash
cd "d:\ai-bytes-leaning-22nd-feb-2026 Backup"
npm run dev
```
- Open `http://localhost:3000/courses/[753 or 754]`
- Verify: dark background, iris/pulse colours, avatar unchanged
- Click a module → should now go to module intro page (not direct to lesson)
- Verify module intro page renders correctly
- Open a lesson → verify sidebar iris colours

### P2 — Link module headers in PremiumCurriculum to module intro page
Currently clicking a module header just toggles expand/collapse. Need to add a visible "View Module →" link in the module header right area that navigates to `/courses/[courseId]/topics/[topicId]`.

File: `components/course/premium-curriculum.tsx`
Location: inside `.module-header-right` div (around line 222)
Add:
```tsx
<Link
  href={`/courses/${course.id}/topics/${topic.id}`}
  className="text-xs text-[#9B8FFF] hover:text-white font-medium transition-colors flex items-center gap-1"
  onClick={e => e.stopPropagation()}
>
  View Module <ArrowRight className="w-3 h-3" />
</Link>
```

### P3 — Check and update lesson page shell colours
File: `app/courses/[courseId]/lessons/[lessonId]/page.tsx`
Read the full file. Update any remaining violet/cyan to iris/pulse. Check the outer layout wrapper, header bar, sidebar container background.

### P4 — ElevenLabs audio (WAIT until Friday — quota resets 14 March)
Once quota is refreshed, generate audio narration for lessons using ElevenLabs TTS. Sterling voice. Scripts come from lesson content.

### P5 — Implement new lesson block types in React (major task)
This is the most impactful remaining work. Steps:
1. **Add block types to** `lib/types/lesson-blocks.ts`:
   - `punch_quote`, `anatomy_card`, `flow_diagram`, `mindmap`, `prediction`, `bento_grid`, `stat_callout`, `technique_card`
2. **Rewrite LessonExpanderAgent prompt** in `lib/ai/agent-system-v2.ts`:
   - Currently outputs prose markdown. Must output structured JSON blocks.
   - Target: 25–35+ blocks per lesson (currently 12–18)
3. **Build React block components** in `components/course/blocks/`
4. **Update** `components/course/lesson-content-renderer.tsx` to render blocks

### P6 — Build module intro mockup HTML (optional but useful)
No HTML prototype exists for the module intro page. Consider building `module_intro_mockup.html` at root to validate design before implementation.

### P7 — Replace lesson completion card
Current completion card has confetti + trophy + XP animation — user rejected this.
Replace with clean 3-line summary: skills learned + "Next Lesson →" button.
File: `components/course/completion-card.tsx` (or wherever completion is rendered)

---

## 7. Open Questions

1. **Module intro page design** — The React page was built functionally but the exact visual design hasn't been shown to the user for approval. Does the user want to see a mockup first, or accept the React implementation directly?

2. **PremiumCurriculum module click behaviour** — Should clicking the module title/badge navigate to the module intro page AND expand, or should expand/collapse stay on a separate chevron button while the title navigates?

3. **Lesson page background** — The lesson page shell hasn't been checked. Does it use a dark background already, or does it also have a white wrapper that needs fixing?

4. **Sterling voice** — Has the ElevenLabs voice ID for Sterling been confirmed? The quota resets Friday — need the exact voice ID to generate audio.

5. **Inline predictions in lessons** — These exist in `lesson_final.html` as static HTML. When the block renderer is built, should predictions be stored in the DB as blocks, or generated on-the-fly by the AI and stored in `content_blocks JSONB`?

6. **Module assessment pass mark** — Hardcoded as "70%" in the module intro page. Is this configurable per module, or always 70%?

---

## 8. Recommended Next Steps (Friday)

**Step 1:** Run `npm run dev` and verify all colour changes render correctly on the course overview page and module intro page. Fix any TypeScript errors or import issues.

**Step 2:** Add the "View Module →" link to PremiumCurriculum module headers (`components/course/premium-curriculum.tsx`, around the `.module-header-right` div).

**Step 3:** Read `app/courses/[courseId]/lessons/[lessonId]/page.tsx` in full and update any remaining violet/cyan colours to match the iris/pulse palette.

**Step 4:** Now that ElevenLabs quota has reset — generate narration audio for at least one lesson (Lesson 3430, Course 754) using Sterling's voice to test the audio pipeline.

**Step 5:** Begin the block type implementation. Start with `lib/types/lesson-blocks.ts` — define the TypeScript union type for all block types. This is the foundation everything else builds on and can be done without touching the AI or UI yet.

---

## 9. Restart Prompt

Paste this into a new Claude Code chat on Friday to continue without losing context:

---

```
I'm returning to work on AI Bytes Learning — a Next.js 16 + React 19 micro-learning platform for AI education (Supabase backend, Tailwind CSS, Gemini 2.0 Flash for content generation).

Project directory: D:\ai-bytes-leaning-22nd-feb-2026 Backup

Please start by reading these files in order:
1. HANDOVER_FRIDAY.md (root of project — full context)
2. CLAUDE.md (project instructions)
3. C:\Users\ravkh\.claude\projects\D--ai-bytes-leaning-22nd-feb-2026-Backup\memory\MEMORY.md

Then confirm you've read them and tell me:
- What was completed before I left
- What the immediate next steps are
- Any questions you need answered before starting

Key rules to know before you begin:
- Course structure units are called MODULES (not topics — even though the DB table is course_topics)
- Design tokens: pulse=#00FFB3, iris=#9B8FFF, amber=#FFB347, nova=#FF6B6B, bg=#080810
- AI avatar: 1 per course, course overview page only, NEVER increase size beyond current lg:col-span-5 aspect-video
- No full-bleed images anywhere
- No confetti/trophy/XP on completion
- UK English throughout
- The lesson design reference is lesson_final.html (root) — open in browser, no server needed

The ElevenLabs quota reset today (14 March). We can now do audio generation.

The main outstanding work is:
1. Verify colour changes from last session work in the browser (npm run dev)
2. Add "View Module →" link in PremiumCurriculum module headers
3. Check lesson page shell colours
4. Begin implementing new lesson block types in lib/types/lesson-blocks.ts

Do not start writing code until you've read the handover and confirmed understanding.
```

---

*Handover created: 11 March 2026. Next session: Friday 14 March 2026.*
